"""
API v1 routes
"""

from fastapi import APIRouter
from .endpoints import players, characters, guilds, quests, auth

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(players.router, prefix="/players", tags=["players"])
api_router.include_router(characters.router, prefix="/characters", tags=["characters"])
api_router.include_router(guilds.router, prefix="/guilds", tags=["guilds"])
api_router.include_router(quests.router, prefix="/quests", tags=["quests"])
