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
import re

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

# TODO: ZASTĄP SWOIM EMAILEM ADMINISTRATORA
# Default admin users list - will be stored in database
DEFAULT_ADMIN_USERS = [os.environ.get('ADMIN_EMAIL', 'admin@twoja-domena.pl')]

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

class Admin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    added_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProblemCreate(BaseModel):
    title: str
    description: str
    category: str
    attachments: List[str] = []
    created_by: str

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    attachments: Optional[List[str]] = None

class InstructionCreate(BaseModel):
    problem_id: str
    instruction_text: str
    images: List[str] = []
    created_by: str

class AdminCreate(BaseModel):
    email: str
    name: str
    added_by: str

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

# Helper function to get admin users
async def get_admin_users():
    admins = await db.admins.find().to_list(1000)
    if not admins:
        # Initialize with default admins
        for email in DEFAULT_ADMIN_USERS:
            admin_obj = Admin(email=email, name=email.split('@')[0], added_by="system")
            mongo_data = prepare_for_mongo(admin_obj.dict())
            await db.admins.insert_one(mongo_data)
        admins = await db.admins.find().to_list(1000)
    
    parsed_admins = [parse_from_mongo(admin) for admin in admins]
    return [admin['email'].lower() for admin in parsed_admins]

# Helper function to check if user is admin
async def is_admin_user(email):
    admin_emails = await get_admin_users()
    return email.lower() in admin_emails

# Admin management endpoints
@api_router.get("/admins", response_model=List[Admin])
async def get_admins():
    admins = await db.admins.find().to_list(1000)
    if not admins:
        # Initialize with default admins
        for email in DEFAULT_ADMIN_USERS:
            admin_obj = Admin(email=email, name=email.split('@')[0], added_by="system")
            mongo_data = prepare_for_mongo(admin_obj.dict())
            await db.admins.insert_one(mongo_data)
        admins = await db.admins.find().to_list(1000)
    
    parsed_admins = [parse_from_mongo(admin) for admin in admins]
    return [Admin(**admin) for admin in parsed_admins]

@api_router.post("/admins", response_model=Admin)
async def add_admin(admin: AdminCreate):
    # Check if admin already exists
    existing_admin = await db.admins.find_one({"email": admin.email.lower()})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    admin_obj = Admin(**admin.dict(), email=admin.email.lower())
    mongo_data = prepare_for_mongo(admin_obj.dict())
    await db.admins.insert_one(mongo_data)
    return admin_obj

@api_router.delete("/admins/{admin_email}")
async def delete_admin(admin_email: str):
    # Check if this is the last admin
    admin_count = await db.admins.count_documents({})
    if admin_count <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last administrator")
    
    result = await db.admins.delete_one({"email": admin_email.lower()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return {"message": "Admin deleted successfully"}

@api_router.get("/check-admin/{email}")
async def check_admin_status(email: str):
    is_admin = await is_admin_user(email)
    return {"is_admin": is_admin}

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
async def get_problems(
    status: Optional[str] = None, 
    category: Optional[str] = None,
    search: Optional[str] = None
):
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    if category:
        filter_dict["category"] = category
    
    # Add search functionality
    if search:
        # Create case-insensitive regex for search
        search_regex = re.compile(re.escape(search), re.IGNORECASE)
        filter_dict["$or"] = [
            {"title": {"$regex": search_regex}},
            {"description": {"$regex": search_regex}}
        ]
    
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

@api_router.put("/problems/{problem_id}", response_model=Problem)
async def update_problem(problem_id: str, problem_update: ProblemUpdate):
    update_data = {k: v for k, v in problem_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.problems.update_one(
        {"id": problem_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Return updated problem
    updated_problem = await db.problems.find_one({"id": problem_id})
    parsed_problem = parse_from_mongo(updated_problem)
    return Problem(**parsed_problem)

@api_router.delete("/problems/{problem_id}")
async def delete_problem(problem_id: str):
    # Also delete associated instructions
    await db.instructions.delete_many({"problem_id": problem_id})
    
    result = await db.problems.delete_one({"id": problem_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    return {"message": "Problem deleted successfully"}

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

@api_router.delete("/instructions/{problem_id}")
async def delete_instruction(problem_id: str):
    result = await db.instructions.delete_one({"problem_id": problem_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Instruction not found")
    
    # Update problem status back to "W toku"
    await db.problems.update_one(
        {"id": problem_id},
        {"$set": {"status": "W toku", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Instruction deleted successfully"}

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

# Health check
@api_router.get("/")
async def root():
    return {"message": "HD - Baza Problemów IT API is running"}

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