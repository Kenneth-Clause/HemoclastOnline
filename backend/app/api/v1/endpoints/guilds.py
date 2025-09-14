"""
Guild management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.guild import Guild, GuildMember, GuildRole

router = APIRouter()

class GuildCreateRequest(BaseModel):
    name: str
    motto: str
    leader_id: int

@router.get("/{guild_id}")
async def get_guild(guild_id: int, db: AsyncSession = Depends(get_db)):
    """Get guild by ID"""
    result = await db.execute(select(Guild).where(Guild.id == guild_id))
    guild = result.scalar_one_or_none()
    
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")
    
    return {
        "id": guild.id,
        "name": guild.name,
        "motto": guild.motto,
        "created_at": guild.created_at,
        "member_count": len(guild.members)
    }

@router.post("/")
async def create_guild(
    request: GuildCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create a new guild"""
    guild = Guild(name=request.name, motto=request.motto)
    db.add(guild)
    await db.flush()  # Get guild ID
    
    # Add leader as first member
    leader_membership = GuildMember(
        guild_id=guild.id,
        player_id=request.leader_id,
        role=GuildRole.LEADER
    )
    db.add(leader_membership)
    
    await db.commit()
    await db.refresh(guild)
    
    return {
        "id": guild.id,
        "name": guild.name,
        "motto": guild.motto
    }
