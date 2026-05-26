from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Mock Database
VALID_USERS = {
    "researcher@university.edu": "password123",
    "admin@echosense.com": "admin"
}

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(request: LoginRequest):
    email = request.email.strip().lower()
    password = request.password
    
    if email in VALID_USERS and VALID_USERS[email] == password:
        return {
            "success": True, 
            "message": "Login successful",
            "token": "mock-jwt-token-12345",
            "user": {"email": email}
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid email or password")
