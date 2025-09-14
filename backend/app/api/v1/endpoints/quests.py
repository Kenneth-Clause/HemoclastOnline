"""
Quest and adventure endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.quest import QuestNode

router = APIRouter()

@router.get("/nodes")
async def get_quest_nodes(db: AsyncSession = Depends(get_db)):
    """Get all available quest nodes"""
    result = await db.execute(select(QuestNode))
    nodes = result.scalars().all()
    
    return [
        {
            "id": node.id,
            "name": node.name,
            "biome": node.biome.value,
            "difficulty_level": node.difficulty_level,
            "position": {"x": node.map_x, "y": node.map_y}
        }
        for node in nodes
    ]

@router.post("/nodes/{node_id}/adventure")
async def start_adventure(
    node_id: int,
    character_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Start an adventure at a quest node"""
    result = await db.execute(select(QuestNode).where(QuestNode.id == node_id))
    node = result.scalar_one_or_none()
    
    if not node:
        raise HTTPException(status_code=404, detail="Quest node not found")
    
    # TODO: Implement combat resolution logic
    # For now, return mock results
    return {
        "success": True,
        "rewards": {
            "experience": 100,
            "gold": 50,
            "items": []
        },
        "combat_log": ["You defeated a Goblin Scout!", "Victory!"]
    }
