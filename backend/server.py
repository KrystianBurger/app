from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Admin users list
ADMIN_USERS = ['dawid.boguslaw@emerlog.eu']

# Define Models
class Problem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    status: str  # "Nowy", "W toku", "Rozwiązany"
    category: str  # "Windows", "Drukarki", "Poczta", "OneDrive", "Inne"
    attachments: List[str] = []  # Base64 encoded files
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Instruction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    problem_id: str
    instruction_text: str
    images: List[str] = []  # Base64 encoded images
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProblemCreate(BaseModel):
    title: str
    description: str
    category: str
    attachments: List[str] = []
    created_by: str

class InstructionCreate(BaseModel):
    problem_id: str
    instruction_text: str
    images: List[str] = []
    created_by: str

# Helper function to prepare data for MongoDB
def prepare_for_mongo(data):
    if isinstance(data, dict):
        prepared = {}
        for key, value in data.items():
            if isinstance(value, datetime):
                prepared[key] = value.isoformat()
            elif isinstance(value, list):
                prepared[key] = [prepare_for_mongo(item) if isinstance(item, dict) else item for item in value]
            elif isinstance(value, dict):
                prepared[key] = prepare_for_mongo(value)
            else:
                prepared[key] = value
        return prepared
    return data

# Helper function to parse data from MongoDB
def parse_from_mongo(item):
    if isinstance(item, dict):
        parsed = {}
        for key, value in item.items():
            if key.endswith('_at') and isinstance(value, str):
                try:
                    parsed[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    parsed[key] = value
            elif isinstance(value, list):
                parsed[key] = [parse_from_mongo(subitem) if isinstance(subitem, dict) else subitem for subitem in value]
            elif isinstance(value, dict):
                parsed[key] = parse_from_mongo(value)
            else:
                parsed[key] = value
        return parsed
    return item

# Problem endpoints
@api_router.post("/problems", response_model=Problem)
async def create_problem(problem: ProblemCreate):
    problem_dict = problem.dict()
    problem_obj = Problem(**problem_dict, status="Nowy")
    
    # Prepare for MongoDB storage
    mongo_data = prepare_for_mongo(problem_obj.dict())
    await db.problems.insert_one(mongo_data)
    return problem_obj

@api_router.get("/problems", response_model=List[Problem])
async def get_problems(status: Optional[str] = None, category: Optional[str] = None):
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    if category:
        filter_dict["category"] = category
    
    problems = await db.problems.find(filter_dict).to_list(1000)
    parsed_problems = [parse_from_mongo(problem) for problem in problems]
    return [Problem(**problem) for problem in parsed_problems]

@api_router.get("/problems/{problem_id}", response_model=Problem)
async def get_problem(problem_id: str):
    problem = await db.problems.find_one({"id": problem_id})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    parsed_problem = parse_from_mongo(problem)
    return Problem(**parsed_problem)

@api_router.put("/problems/{problem_id}/status")
async def update_problem_status(problem_id: str, status: str):
    result = await db.problems.update_one(
        {"id": problem_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Problem not found")
    return {"message": "Status updated"}

# Instruction endpoints
@api_router.post("/instructions", response_model=Instruction)
async def create_instruction(instruction: InstructionCreate):
    instruction_dict = instruction.dict()
    instruction_obj = Instruction(**instruction_dict)
    
    # Prepare for MongoDB storage
    mongo_data = prepare_for_mongo(instruction_obj.dict())
    await db.instructions.insert_one(mongo_data)
    
    # Update problem status to "Rozwiązany"
    await db.problems.update_one(
        {"id": instruction.problem_id},
        {"$set": {"status": "Rozwiązany", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return instruction_obj

@api_router.get("/instructions/{problem_id}", response_model=Optional[Instruction])
async def get_instruction_by_problem(problem_id: str):
    instruction = await db.instructions.find_one({"problem_id": problem_id})
    if not instruction:
        return None
    parsed_instruction = parse_from_mongo(instruction)
    return Instruction(**parsed_instruction)

# File upload endpoint
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    base64_content = base64.b64encode(contents).decode('utf-8')
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "base64_data": base64_content
    }

# Health check and stats
@api_router.get("/")
async def root():
    return {"message": "IT HelpDesk API is running"}

@api_router.get("/stats")
async def get_stats():
    total_problems = await db.problems.count_documents({})
    new_problems = await db.problems.count_documents({"status": "Nowy"})
    in_progress_problems = await db.problems.count_documents({"status": "W toku"})
    resolved_problems = await db.problems.count_documents({"status": "Rozwiązany"})
    
    # Stats by category
    windows_problems = await db.problems.count_documents({"category": "Windows"})
    printers_problems = await db.problems.count_documents({"category": "Drukarki"})
    email_problems = await db.problems.count_documents({"category": "Poczta"})
    onedrive_problems = await db.problems.count_documents({"category": "OneDrive"})
    other_problems = await db.problems.count_documents({"category": "Inne"})
    
    return {
        "total": total_problems,
        "new": new_problems,
        "in_progress": in_progress_problems,
        "resolved": resolved_problems,
        "by_category": {
            "Windows": windows_problems,
            "Drukarki": printers_problems,
            "Poczta": email_problems,
            "OneDrive": onedrive_problems,
            "Inne": other_problems
        }
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()