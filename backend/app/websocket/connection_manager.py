"""
WebSocket connection manager for real-time features
"""

from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time features"""
    
    def __init__(self):
        # Active connections: client_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        
        # Player data: client_id -> player_info
        self.player_data: Dict[str, dict] = {}
        
        # Guild channels: guild_id -> List[client_id]
        self.guild_channels: Dict[int, List[str]] = {}
        
        # City presence: List[client_id] for town plaza
        self.city_presence: List[str] = []
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected")
    
    def disconnect(self, client_id: str):
        """Remove a WebSocket connection"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        
        # Remove player data
        if client_id in self.player_data:
            del self.player_data[client_id]
        
        # Remove from guild channels
        for guild_id, members in self.guild_channels.items():
            if client_id in members:
                members.remove(client_id)
        
        # Remove from city presence
        if client_id in self.city_presence:
            self.city_presence.remove(client_id)
        
        logger.info(f"Client {client_id} disconnected")
    
    async def send_personal_message(self, message: dict, client_id: str):
        """Send message to specific client"""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            await websocket.send_text(json.dumps(message))
    
    async def broadcast(self, message: str):
        """Broadcast message to all connected clients"""
        # Create a copy of the connections to avoid "dictionary changed size during iteration"
        connections_copy = dict(self.active_connections)
        
        for client_id, websocket in connections_copy.items():
            # Double-check the connection still exists
            if client_id in self.active_connections:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    logger.warning(f"Failed to send message to {client_id}: {e}")
                    # Remove failed connection
                    if client_id in self.active_connections:
                        del self.active_connections[client_id]
    
    async def broadcast_to_others(self, message: str, exclude_client_id: str):
        """Broadcast message to all connected clients except the specified one"""
        # Create a copy of the connections to avoid "dictionary changed size during iteration"
        connections_copy = dict(self.active_connections)
        
        for client_id, websocket in connections_copy.items():
            if client_id != exclude_client_id and client_id in self.active_connections:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    logger.warning(f"Failed to send message to {client_id}: {e}")
                    # Remove failed connection
                    if client_id in self.active_connections:
                        del self.active_connections[client_id]
    
    async def broadcast_to_guild(self, guild_id: int, message: dict):
        """Broadcast message to guild members"""
        if guild_id in self.guild_channels:
            for client_id in self.guild_channels[guild_id]:
                await self.send_personal_message(message, client_id)
    
    async def broadcast_to_city(self, message: dict):
        """Broadcast message to players in city plaza"""
        for client_id in self.city_presence:
            await self.send_personal_message(message, client_id)
    
    def join_guild_channel(self, client_id: str, guild_id: int):
        """Add client to guild channel"""
        if guild_id not in self.guild_channels:
            self.guild_channels[guild_id] = []
        
        if client_id not in self.guild_channels[guild_id]:
            self.guild_channels[guild_id].append(client_id)
    
    def leave_guild_channel(self, client_id: str, guild_id: int):
        """Remove client from guild channel"""
        if guild_id in self.guild_channels and client_id in self.guild_channels[guild_id]:
            self.guild_channels[guild_id].remove(client_id)
    
    def join_city(self, client_id: str):
        """Add client to city presence"""
        if client_id not in self.city_presence:
            self.city_presence.append(client_id)
    
    def leave_city(self, client_id: str):
        """Remove client from city presence"""
        if client_id in self.city_presence:
            self.city_presence.remove(client_id)
    
    def store_player_data(self, client_id: str, player_data: dict):
        """Store player data for a client"""
        self.player_data[client_id] = player_data
    
    def get_all_players(self) -> Dict[str, dict]:
        """Get all currently connected players' data"""
        return self.player_data.copy()
    
    def get_player_data(self, client_id: str) -> dict:
        """Get player data for a specific client"""
        return self.player_data.get(client_id, {})
