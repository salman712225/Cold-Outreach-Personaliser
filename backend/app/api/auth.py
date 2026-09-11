import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings
from app.db.models import UserCreate, UserResponse, Token, UserInDB
from app.db.mongodb import save_item, get_item, find_items

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> UserResponse:
    # If no token provided or demo mode, return guest user
    if not credentials:
        return UserResponse(
            id="guest-user-123",
            email="demo@coldoutreach.ai",
            full_name="Guest User",
            created_at=datetime.utcnow()
        )
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    users = await find_items("users", {"email": email}, limit=1)
    if not users:
        return UserResponse(
            id="guest-user-123",
            email=email,
            full_name="User",
            created_at=datetime.utcnow()
        )
    user_doc = users[0]
    return UserResponse(
        id=user_doc["id"],
        email=user_doc["email"],
        full_name=user_doc.get("full_name", "User"),
        created_at=datetime.fromisoformat(user_doc["created_at"]) if isinstance(user_doc["created_at"], str) else user_doc["created_at"]
    )

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate):
    existing = await find_items("users", {"email": user_in.email}, limit=1)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user-{uuid.uuid4().hex[:8]}"
    hashed_pw = get_password_hash(user_in.password)
    now = datetime.utcnow()
    user_doc = {
        "id": user_id,
        "email": user_in.email,
        "full_name": user_in.full_name or "Cold Outreach Pro",
        "hashed_password": hashed_pw,
        "created_at": now.isoformat()
    }
    await save_item("users", user_id, user_doc)
    
    token = create_access_token({"sub": user_in.email, "id": user_id})
    return Token(
        access_token=token,
        user=UserResponse(id=user_id, email=user_in.email, full_name=user_doc["full_name"], created_at=now)
    )

@router.post("/login", response_model=Token)
async def login(user_in: UserCreate):
    users = await find_items("users", {"email": user_in.email}, limit=1)
    if not users or not verify_password(user_in.password, users[0]["hashed_password"]):
        # Quick demo auto-login for convenience if testing
        if user_in.email == "demo@coldoutreach.ai":
            now = datetime.utcnow()
            token = create_access_token({"sub": user_in.email, "id": "demo-user"})
            return Token(
                access_token=token,
                user=UserResponse(id="demo-user", email=user_in.email, full_name="Demo User", created_at=now)
            )
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    user_doc = users[0]
    token = create_access_token({"sub": user_doc["email"], "id": user_doc["id"]})
    return Token(
        access_token=token,
        user=UserResponse(
            id=user_doc["id"],
            email=user_doc["email"],
            full_name=user_doc.get("full_name", "User"),
            created_at=datetime.utcnow()
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user
