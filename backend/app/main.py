"""
HemoclastOnline FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
import redis.asyncio as redis
import logging
import json
import time

from app.core.config import settings
from app.core.database import engine, Base, async_session
from app.api.v1 import api_router
from app.websocket.connection_manager import ConnectionManager
from app.models.player import Player
from app.models.guest_session import GuestSession
from jose import JWTError, jwt
from sqlalchemy import select

logger = logging.getLogger(__name__)

# Connection manager for WebSocket connections
connection_manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting HemoclastOnline backend...")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize Redis connection
    app.state.redis = redis.from_url(settings.REDIS_URL)
    
    yield
    
    # Shutdown
    logger.info("Shutting down HemoclastOnline backend...")
    await app.state.redis.close()

app = FastAPI(
    title="HemoclastOnline API",
    description="Backend API for HemoclastOnline - Gothic Fantasy MMO-lite",
    version="1.0.0",
    lifespan=lifespan
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=settings.ALLOWED_METHODS,
    allow_headers=settings.ALLOWED_HEADERS,
)

# Security headers middleware
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

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "hemoclast-backend"}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str, token: str = Query(...)):
    """WebSocket endpoint with JWT authentication"""
    # Verify JWT token before accepting connection
    user = None
    try:
        # Check if it's a guest session token first
        if token.startswith("guest_"):
            async with async_session() as db:
                result = await db.execute(
                    select(GuestSession).where(
                        GuestSession.session_token == token,
                        GuestSession.is_active == True
                    )
                )
                guest_session = result.scalar_one_or_none()
                
                if guest_session:
                    # Get the associated player
                    result = await db.execute(select(Player).where(Player.id == guest_session.player_id))
                    user = result.scalar_one_or_none()
                    
                if not user:
                    await websocket.close(code=1008, reason="Invalid guest token")
                    return
        else:
            # Handle JWT tokens for registered users
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
    try:
        while True:
            data = await websocket.receive_text()
            
            # Parse message and handle different types
            try:
                message = json.loads(data)
                await handle_game_message(client_id, message)
            except json.JSONDecodeError:
                # Handle legacy text messages
                await connection_manager.broadcast(f"Client {client_id}: {data}")
                
    except WebSocketDisconnect:
        connection_manager.disconnect(client_id)
        
        # Notify other players of disconnection
        disconnect_message = {
            "type": "player_left",
            "data": {
                "client_id": client_id,
                "timestamp": int(time.time() * 1000)
            }
        }
        await connection_manager.broadcast(json.dumps(disconnect_message))

async def handle_game_message(client_id: str, message: dict):
    """Handle different types of game messages"""
    message_type = message.get("type")
    
    if message_type in ["player_spawn", "player_spawn_3d"]:
        # Store player data (works for both 2D and 3D)
        player_data = message.get("data", {})
        connection_manager.store_player_data(client_id, player_data)
        
        # Determine response type based on input type
        response_type = "player_joined_3d" if message_type == "player_spawn_3d" else "player_joined"
        
        print(f"🎭 BACKEND: Player {player_data.get('character_name')} spawning with type {message_type}")
        
        # Send existing players to the new player
        existing_players = connection_manager.get_all_players()
        for existing_client_id, existing_data in existing_players.items():
            if existing_client_id != client_id:  # Don't send self
                existing_player_message = {
                    "type": response_type,
                    "data": {
                        "client_id": existing_client_id,
                        **existing_data
                    }
                }
                await connection_manager.send_personal_message(existing_player_message, client_id)
                print(f"📤 BACKEND: Sent existing player {existing_data.get('character_name')} to new player")
        
        # Notify other players of new player spawn
        spawn_notification = {
            "type": response_type,
            "data": {
                "client_id": client_id,
                **player_data
            }
        }
        await connection_manager.broadcast_to_others(json.dumps(spawn_notification), client_id)
        print(f"📡 BACKEND: Broadcasted new player {player_data.get('character_name')} to {len(existing_players)} other players")
        
    elif message_type in ["player_move", "player_move_3d"]:
        # Update stored player position (works for both 2D and 3D)
        move_data = message.get("data", {})
        if client_id in connection_manager.player_data:
            connection_manager.player_data[client_id].update(move_data)
        
        # Determine response type based on input type
        response_type = "player_moved_3d" if message_type == "player_move_3d" else "player_moved"
        
        # Broadcast player movement to other players
        move_notification = {
            "type": response_type,
            "data": {
                "client_id": client_id,
                **move_data
            }
        }
        await connection_manager.broadcast_to_others(json.dumps(move_notification), client_id)
        
    elif message_type == "player_disconnect":
        # Handle explicit disconnect (cleanup will be done by WebSocketDisconnect)
        pass
        
    elif message_type == "chat_message":
        # Broadcast chat message to all players
        chat_notification = {
            "type": "chat_message",
            "data": {
                "client_id": client_id,
                **message.get("data", {})
            }
        }
        await connection_manager.broadcast(json.dumps(chat_notification))
    
    else:
        logger.warning(f"Unknown message type from {client_id}: {message_type}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
