"""
HemoclastOnline FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import redis.asyncio as redis
import logging
import json
import time

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import api_router
from app.websocket.connection_manager import ConnectionManager

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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "hemoclast-backend"}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time communication"""
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
    
    if message_type == "player_spawn":
        # Store player data
        player_data = message.get("data", {})
        connection_manager.store_player_data(client_id, player_data)
        
        # Send existing players to the new player
        existing_players = connection_manager.get_all_players()
        for existing_client_id, existing_data in existing_players.items():
            if existing_client_id != client_id:  # Don't send self
                existing_player_message = {
                    "type": "player_joined",
                    "data": {
                        "client_id": existing_client_id,
                        **existing_data
                    }
                }
                await connection_manager.send_personal_message(existing_player_message, client_id)
        
        # Notify other players of new player spawn
        spawn_notification = {
            "type": "player_joined",
            "data": {
                "client_id": client_id,
                **player_data
            }
        }
        await connection_manager.broadcast_to_others(json.dumps(spawn_notification), client_id)
        
    elif message_type == "player_move":
        # Update stored player position
        move_data = message.get("data", {})
        if client_id in connection_manager.player_data:
            connection_manager.player_data[client_id].update(move_data)
        
        # Broadcast player movement to other players
        move_notification = {
            "type": "player_moved",
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
