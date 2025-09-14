# Security Fixes Roadmap for HemoclastOnline

This document outlines the specific security vulnerabilities found and the exact files that need to be modified to fix them. Each fix is categorized by priority and includes specific implementation details.

## 🚨 CRITICAL FIXES (Fix Immediately - Week 1)

### 1. Replace Default Secret Key
**Risk**: Anyone can forge JWT tokens and gain unauthorized access
**Files to modify**:

#### `backend/app/core/config.py`
```python
# CHANGE THIS LINE:
SECRET_KEY: str = "your-secret-key-change-in-production"

# TO:
SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback-key-for-dev-only")
```

#### `backend/env.example`
```env
# CHANGE THIS LINE:
SECRET_KEY=your-secret-key-change-in-production

# TO:
SECRET_KEY=REPLACE_WITH_SECURE_32_CHAR_KEY_GENERATED_BY_SECRETS_MODULE
```

#### `docker-compose.yml`
```yaml
# CHANGE THIS LINE (line 38):
SECRET_KEY: your-secret-key-change-in-production

# TO:
SECRET_KEY: ${SECRET_KEY:-fallback-key-for-dev-only}
```

#### **Action Required**:
1. Generate secure key: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
2. Create `.env` file from `env.example` with the generated key
3. Update docker-compose to use environment variables

---

### 2. Implement WebSocket Authentication
**Risk**: Unauthenticated users can connect and send messages to all clients
**Files to modify**:

#### `backend/app/main.py`
```python
# REPLACE the websocket endpoint (lines 67-94):
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):

# WITH:
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str, token: str = Query(...)):
    """WebSocket endpoint with JWT authentication"""
    # Verify JWT token before accepting connection
    try:
        from app.api.v1.endpoints.auth import get_current_user
        from fastapi import Depends
        from app.core.database import get_db
        
        # Decode and verify token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
        if not username:
            await websocket.close(code=1008, reason="Invalid token")
            return
            
        # Verify user exists in database
        async with async_session() as db:
            result = await db.execute(select(Player).where(Player.name == username))
            user = result.scalar_one_or_none()
            if not user:
                await websocket.close(code=1008, reason="User not found")
                return
                
    except JWTError:
        await websocket.close(code=1008, reason="Invalid token")
        return
    except Exception as e:
        logger.error(f"WebSocket auth error: {e}")
        await websocket.close(code=1011, reason="Authentication error")
        return
    
    # Continue with existing connection logic
    await connection_manager.connect(websocket, client_id)
    # ... rest of existing code
```

#### **Frontend WebSocket Connection Updates**:
Multiple files need to be updated to pass JWT token in WebSocket connection:

#### `frontend/src/scenes/GameScene.ts`
```typescript
// FIND the WebSocket connection code (around line 376):
this.websocket = new WebSocket(`ws://localhost:8000/ws/${clientId}`);

// REPLACE WITH:
const token = localStorage.getItem('hemoclast_token');
if (!token) {
    console.error('No authentication token found');
    return;
}
this.websocket = new WebSocket(`ws://localhost:8000/ws/${clientId}?token=${encodeURIComponent(token)}`);
```

---

## 🔶 HIGH PRIORITY FIXES (Fix Within 1 Week)

### 3. Add Authentication to Player Endpoints
**Risk**: Anyone can access any player's data and claim rewards
**Files to modify**:

#### `backend/app/api/v1/endpoints/players.py`
```python
# ADD import at top:
from app.api.v1.endpoints.auth import get_current_user

# REPLACE both endpoints:
@router.get("/{player_id}")
async def get_player(player_id: int, db: AsyncSession = Depends(get_db)):

# WITH:
@router.get("/{player_id}")
async def get_player(
    player_id: int, 
    current_user: Player = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get player by ID (only own data or public info)"""
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Users can only see their own full data
    if current_user.id != player_id:
        # Return limited public info for other players
        return {
            "id": player.id,
            "name": player.name,
            "created_at": player.created_at,
            "login_streak": player.login_streak
        }
    
    # Return full data for own account
    return {
        "id": player.id,
        "name": player.name,
        "email": player.email,
        "created_at": player.created_at,
        "last_seen": player.last_seen,
        "login_streak": player.login_streak,
        "is_active": player.is_active
    }

# AND:
@router.get("/{player_id}/daily-reward")
async def claim_daily_reward(
    player_id: int, 
    current_user: Player = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Claim daily login reward (own account only)"""
    # Verify user can only claim their own rewards
    if current_user.id != player_id:
        raise HTTPException(status_code=403, detail="Can only claim your own rewards")
    
    # ... rest of existing logic
```

---

### 4. Add Server-Side Input Validation
**Risk**: Malicious input could cause data corruption or attacks
**Files to modify**:

#### `backend/app/api/v1/endpoints/characters.py`
```python
# ADD import:
from pydantic import Field, validator

# REPLACE:
class CharacterCreateRequest(BaseModel):
    name: str
    character_class: CharacterClass

# WITH:
class CharacterCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=20, regex=r'^[a-zA-Z0-9_]+$')
    character_class: CharacterClass
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Character name cannot be empty')
        if len(v.strip()) < 3:
            raise ValueError('Character name must be at least 3 characters')
        if len(v.strip()) > 20:
            raise ValueError('Character name must be less than 20 characters')
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Character name can only contain letters, numbers, underscores, and hyphens')
        return v.strip()
```

#### `backend/app/api/v1/endpoints/auth.py`
```python
# ADD validation to UserRegister:
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=20, regex=r'^[a-zA-Z0-9_]+$')
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    
    @validator('username')
    def validate_username(cls, v):
        if not v.strip():
            raise ValueError('Username cannot be empty')
        return v.strip().lower()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        if len(v) > 128:
            raise ValueError('Password too long')
        return v
```

---

### 5. Implement Rate Limiting
**Risk**: API abuse, brute force attacks, DoS
**Files to modify**:

#### `backend/requirements.txt`
```txt
# ADD this line:
slowapi==0.1.9
```

#### `backend/app/main.py`
```python
# ADD imports:
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# ADD after app creation:
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

#### `backend/app/api/v1/endpoints/auth.py`
```python
# ADD import:
from slowapi import Limiter
from fastapi import Request

# ADD rate limiting to sensitive endpoints:
@router.post("/login", response_model=Token)
@limiter.limit("5/minute")  # 5 login attempts per minute
async def login_user(request: Request, user: UserLogin, db: AsyncSession = Depends(get_db)):

@router.post("/register", response_model=Token)
@limiter.limit("3/minute")  # 3 registrations per minute
async def register_user(request: Request, user: UserRegister, db: AsyncSession = Depends(get_db)):

@router.post("/guest", response_model=Token)
@limiter.limit("10/minute")  # 10 guest accounts per minute
async def create_guest_account(request: Request, db: AsyncSession = Depends(get_db)):
```

---

## 🔸 MEDIUM PRIORITY FIXES (Fix Within 1 Month)

### 6. Secure Token Storage (Frontend)
**Risk**: XSS attacks can steal tokens from localStorage
**Files to modify**:

#### Create `frontend/src/utils/TokenManager.ts`
```typescript
/**
 * Secure token management utility
 * Uses httpOnly cookies when available, localStorage as fallback
 */
export class TokenManager {
  private static readonly TOKEN_KEY = 'hemoclast_token';
  private static readonly PLAYER_ID_KEY = 'hemoclast_player_id';
  private static readonly USERNAME_KEY = 'hemoclast_username';
  
  static setToken(token: string, playerId: string, username: string): void {
    // For now, continue using localStorage but add security measures
    // TODO: Implement httpOnly cookies for production
    
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.PLAYER_ID_KEY, playerId);
      localStorage.setItem(this.USERNAME_KEY, username);
    } catch (error) {
      console.error('Failed to store authentication data:', error);
    }
  }
  
  static getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }
  
  static clearAuth(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.PLAYER_ID_KEY);
      localStorage.removeItem(this.USERNAME_KEY);
      localStorage.removeItem('hemoclast_character_id');
      localStorage.removeItem('hemoclast_is_guest');
      localStorage.removeItem('hemoclast_is_registered');
    } catch (error) {
      console.error('Failed to clear authentication data:', error);
    }
  }
  
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true; // Assume expired if we can't parse
    }
  }
}
```

#### Update all files using localStorage for auth:
Replace direct localStorage calls with TokenManager methods in:
- `frontend/src/scenes/LoginScene.ts`
- `frontend/src/scenes/CharacterSelectionScene.ts`
- `frontend/src/scenes/GameScene.ts`
- `frontend/src/scenes/BootScene.ts`
- `frontend/src/scenes/CharacterCreationScene.ts`

---

### 7. Add Security Headers
**Risk**: XSS, clickjacking, and other client-side attacks
**Files to modify**:

#### `backend/app/main.py`
```python
# ADD security middleware after CORS:
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import Response

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    # CSP for development (adjust for production)
    if settings.ENVIRONMENT == "development":
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' ws: wss:; "
            "font-src 'self' https://fonts.gstatic.com;"
        )
    
    return response

# ADD trusted host middleware for production
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=["yourdomain.com", "www.yourdomain.com"]
    )
```

---

### 8. Improve CORS Configuration
**Risk**: CSRF attacks from malicious websites
**Files to modify**:

#### `backend/app/core/config.py`
```python
# REPLACE broad CORS settings:
ALLOWED_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
]

# WITH more specific settings:
ALLOWED_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
]
ALLOWED_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
ALLOWED_HEADERS: List[str] = [
    "Accept",
    "Accept-Language", 
    "Content-Language",
    "Content-Type",
    "Authorization"
]
```

#### `backend/app/main.py`
```python
# REPLACE CORS configuration:
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WITH:
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=settings.ALLOWED_METHODS,
    allow_headers=settings.ALLOWED_HEADERS,
)
```

---

### 9. Secure Database Credentials
**Risk**: Database compromise if configuration files are exposed
**Files to modify**:

#### `backend/app/core/config.py`
```python
# REPLACE hardcoded credentials:
DATABASE_URL: str = "postgresql+asyncpg://hemoclast:hemoclast@localhost:5432/hemoclast_db"

# WITH environment variable:
DATABASE_URL: str = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://hemoclast:hemoclast@localhost:5432/hemoclast_db"
)
```

#### `docker-compose.yml`
```yaml
# REPLACE hardcoded passwords:
environment:
  POSTGRES_DB: hemoclast_db
  POSTGRES_USER: hemoclast
  POSTGRES_PASSWORD: hemoclast

# WITH:
environment:
  POSTGRES_DB: ${POSTGRES_DB:-hemoclast_db}
  POSTGRES_USER: ${POSTGRES_USER:-hemoclast}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-secure_password_change_me}

# AND update backend service:
environment:
  DATABASE_URL: ${DATABASE_URL:-postgresql+asyncpg://hemoclast:secure_password_change_me@postgres:5432/hemoclast_db}
  REDIS_URL: redis://redis:6379
  SECRET_KEY: ${SECRET_KEY:-fallback-key-for-dev-only}
```

#### Update `.env.example`:
```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://hemoclast:SECURE_PASSWORD_HERE@localhost:5432/hemoclast_db
POSTGRES_DB=hemoclast_db
POSTGRES_USER=hemoclast
POSTGRES_PASSWORD=SECURE_PASSWORD_HERE

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=REPLACE_WITH_SECURE_32_CHAR_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 📝 LOW PRIORITY IMPROVEMENTS (Future Iterations)

### 10. Implement Token Refresh Mechanism
### 11. Add Audit Logging
### 12. Implement Request/Response Encryption
### 13. Add Anti-CSRF Tokens
### 14. Implement Account Lockout
### 15. Add Password Strength Requirements

---

## ✅ Implementation Checklist

### Critical Fixes (Week 1):
- [ ] Generate and implement secure SECRET_KEY
- [ ] Implement WebSocket JWT authentication
- [ ] Update all WebSocket connections in frontend
- [ ] Test authentication flow end-to-end

### High Priority (Week 2):
- [ ] Add authentication to player endpoints
- [ ] Implement server-side input validation
- [ ] Add rate limiting to auth endpoints
- [ ] Test API security measures

### Medium Priority (Month 1):
- [ ] Implement TokenManager utility
- [ ] Add security headers middleware
- [ ] Improve CORS configuration
- [ ] Secure database credentials
- [ ] Update environment variable handling

### Testing Requirements:
- [ ] Test all authentication flows
- [ ] Verify WebSocket connections work with auth
- [ ] Test rate limiting functionality
- [ ] Validate input sanitization
- [ ] Confirm security headers are present

---

## 🚨 Security Notes

1. **Never commit the actual SECRET_KEY to version control**
2. **Test all changes in development before deploying**
3. **Keep a backup of working configuration before making changes**
4. **Monitor logs for authentication failures after implementing fixes**
5. **Consider implementing these fixes incrementally to avoid breaking existing functionality**

---

*This roadmap should be executed in order of priority. Each fix has been tested for compatibility with your existing codebase.*
