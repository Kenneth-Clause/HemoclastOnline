"""
Player management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.player import Player
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

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
    
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # TODO: Implement daily reward logic
    return {
        "message": "Daily reward claimed",
        "reward": {"gold": 100, "experience": 50}
    }
