"""
Authentication endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr, Field, validator
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.config import settings
from app.models.player import Player
from app.models.guest_session import GuestSession

router = APIRouter()
security = HTTPBearer(auto_error=False)
limiter = Limiter(key_func=get_remote_address)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    
    @validator('username')
    def validate_username(cls, v):
        if not v.strip():
            raise ValueError('Username cannot be empty')
        # Check for valid characters
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', v.strip()):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.strip().lower()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        if len(v) > 128:
            raise ValueError('Password too long')
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    player_id: int
    username: str

class GuestToken(BaseModel):
    session_token: str
    token_type: str
    player_id: int
    username: str

class GuestToUserConversion(BaseModel):
    email: EmailStr
    password: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials:
        raise credentials_exception
    
    # Check if it's a guest session token first
    if credentials.credentials.startswith("guest_"):
        result = await db.execute(
            select(GuestSession).where(
                GuestSession.session_token == credentials.credentials,
                GuestSession.is_active == True
            )
        )
        guest_session = result.scalar_one_or_none()
        
        if guest_session:
            # Update last accessed time
            guest_session.last_accessed = datetime.utcnow()
            await db.commit()
            
            # Return the associated player
            result = await db.execute(select(Player).where(Player.id == guest_session.player_id))
            user = result.scalar_one_or_none()
            if user:
                return user
        
        raise credentials_exception
    
    # Handle JWT tokens for registered users
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(Player).where(Player.name == username))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    return user

@router.post("/guest", response_model=GuestToken)
@limiter.limit("10/minute")
async def create_guest_account(request: Request, db: AsyncSession = Depends(get_db)):
    """Create a guest account with persistent session token"""
    import uuid
    
    guest_name = f"Guest_{str(uuid.uuid4())[:8]}"
    
    # Create guest player
    guest_player = Player(
        name=guest_name,
        email=None,
        hashed_password=None
    )
    
    db.add(guest_player)
    await db.commit()
    await db.refresh(guest_player)
    
    # Create persistent guest session
    session_token = GuestSession.generate_session_token()
    guest_session = GuestSession(
        session_token=session_token,
        guest_name=guest_name,
        player_id=guest_player.id
    )
    
    db.add(guest_session)
    await db.commit()
    
    return {
        "session_token": session_token,
        "token_type": "guest",
        "player_id": guest_player.id,
        "username": guest_player.name
    }

@router.post("/convert-guest", response_model=Token)
async def convert_guest_to_registered(
    conversion_data: GuestToUserConversion,
    current_user: Player = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Convert a guest account to a registered account"""
    
    # Find the active guest session for this player
    result = await db.execute(
        select(GuestSession).where(
            GuestSession.player_id == current_user.id,
            GuestSession.is_active == True
        )
    )
    guest_session = result.scalar_one_or_none()
    
    if not guest_session:
        raise HTTPException(status_code=400, detail="No active guest session found")
    
    # Check if email already exists
    result = await db.execute(select(Player).where(Player.email == conversion_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Update the player record to be a registered user
    current_user.email = conversion_data.email
    current_user.hashed_password = get_password_hash(conversion_data.password)
    
    # Mark the guest session as converted
    guest_session.mark_as_converted()
    
    await db.commit()
    
    # Create a JWT token for the now-registered user
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.name}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "player_id": current_user.id,
        "username": current_user.name
    }

@router.post("/register", response_model=Token)
@limiter.limit("3/minute")
async def register_user(request: Request, user: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user account"""
    # Check if username already exists
    result = await db.execute(select(Player).where(Player.name == user.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email already exists
    result = await db.execute(select(Player).where(Player.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new player
    hashed_password = get_password_hash(user.password)
    new_player = Player(
        name=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    
    db.add(new_player)
    await db.commit()
    await db.refresh(new_player)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_player.name}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "player_id": new_player.id,
        "username": new_player.name
    }

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login_user(request: Request, user: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login with username and password"""
    # Find user by username
    result = await db.execute(select(Player).where(Player.name == user.username))
    player = result.scalar_one_or_none()
    
    if not player or not verify_password(user.password, player.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last seen
    player.last_seen = datetime.now()
    await db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": player.name}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer", 
        "player_id": player.id,
        "username": player.name
    }

@router.get("/me")
async def get_current_user_info(current_user: Player = Depends(get_current_user)):
    """Get current authenticated user info"""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "created_at": current_user.created_at,
        "last_seen": current_user.last_seen,
        "login_streak": current_user.login_streak
    }
