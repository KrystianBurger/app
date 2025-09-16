from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
import json

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

# Security
security = HTTPBearer()

# Define Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    role: str  # "user" or "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Problem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    status: str  # "Nowy", "W toku", "Rozwiązany"
    category: str  # "Sprzęt", "Oprogramowanie", "Sieć", "Inne"
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

class InstructionCreate(BaseModel):
    problem_id: str
    instruction_text: str
    images: List[str] = []

class LoginRequest(BaseModel):
    username: str
    password: str

# Mock users for demo
MOCK_USERS = {
    "admin": {"password": "admin123", "role": "admin"},
    "user": {"password": "user123", "role": "user"}
}

# Authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    # Simple token validation (in real app, use JWT)
    if token in ["admin_token", "user_token"]:
        role = "admin" if token == "admin_token" else "user"
        return {"username": token.replace("_token", ""), "role": role}
    raise HTTPException(status_code=401, detail="Invalid token")

# Auth endpoints
@api_router.post("/login")
async def login(request: LoginRequest):
    if (request.username in MOCK_USERS and 
        MOCK_USERS[request.username]["password"] == request.password):
        token = f"{request.username}_token"
        role = MOCK_USERS[request.username]["role"]
        return {"token": token, "role": role, "username": request.username}
    raise HTTPException(status_code=401, detail="Invalid credentials")

# Problem endpoints
@api_router.post("/problems", response_model=Problem)
async def create_problem(problem: ProblemCreate, current_user: dict = Depends(get_current_user)):
    problem_dict = problem.dict()
    problem_obj = Problem(**problem_dict, created_by=current_user["username"], status="Nowy")
    await db.problems.insert_one(problem_obj.dict())
    return problem_obj

@api_router.get("/problems", response_model=List[Problem])
async def get_problems(status: Optional[str] = None, category: Optional[str] = None):
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    if category:
        filter_dict["category"] = category
    
    problems = await db.problems.find(filter_dict).to_list(1000)
    return [Problem(**problem) for problem in problems]

@api_router.get("/problems/{problem_id}", response_model=Problem)
async def get_problem(problem_id: str):
    problem = await db.problems.find_one({"id": problem_id})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return Problem(**problem)

@api_router.put("/problems/{problem_id}/status")
async def update_problem_status(problem_id: str, status: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.problems.update_one(
        {"id": problem_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Problem not found")
    return {"message": "Status updated"}

# Instruction endpoints
@api_router.post("/instructions", response_model=Instruction)
async def create_instruction(instruction: InstructionCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    instruction_dict = instruction.dict()
    instruction_obj = Instruction(**instruction_dict, created_by=current_user["username"])
    await db.instructions.insert_one(instruction_obj.dict())
    
    # Update problem status to "Rozwiązany"
    await db.problems.update_one(
        {"id": instruction.problem_id},
        {"$set": {"status": "Rozwiązany", "updated_at": datetime.now(timezone.utc)}}
    )
    
    return instruction_obj

@api_router.get("/instructions/{problem_id}", response_model=Optional[Instruction])
async def get_instruction_by_problem(problem_id: str):
    instruction = await db.instructions.find_one({"problem_id": problem_id})
    if not instruction:
        return None
    return Instruction(**instruction)

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
    return {"message": "IT HelpDesk API is running"}

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