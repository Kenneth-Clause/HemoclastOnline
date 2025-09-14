"""
Player management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.player import Player

router = APIRouter()

@router.get("/{player_id}")
async def get_player(player_id: int, db: AsyncSession = Depends(get_db)):
    """Get player by ID"""
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    return {
        "id": player.id,
        "name": player.name,
        "created_at": player.created_at,
        "last_seen": player.last_seen,
        "login_streak": player.login_streak
    }

@router.get("/{player_id}/daily-reward")
async def claim_daily_reward(player_id: int, db: AsyncSession = Depends(get_db)):
    """Claim daily login reward"""
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # TODO: Implement daily reward logic
    return {
        "message": "Daily reward claimed",
        "reward": {"gold": 100, "experience": 50}
    }
