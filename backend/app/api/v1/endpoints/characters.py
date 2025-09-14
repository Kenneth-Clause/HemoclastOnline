"""
Character management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.character import Character, CharacterClass
from app.api.v1.endpoints.auth import get_current_user
from app.models.player import Player

router = APIRouter()

class CharacterCreateRequest(BaseModel):
    name: str
    character_class: CharacterClass

@router.get("/{character_id}")
async def get_character(character_id: int, db: AsyncSession = Depends(get_db)):
    """Get character by ID"""
    result = await db.execute(select(Character).where(Character.id == character_id))
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    return {
        "id": character.id,
        "name": character.name,
        "character_class": character.character_class.value,
        "level": character.level,
        "experience": character.experience,
        "stats": {
            "strength": character.strength,
            "agility": character.agility,
            "intelligence": character.intelligence,
            "vitality": character.vitality
        }
    }

@router.get("/")
async def get_player_characters(current_user: Player = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get all characters for the current player"""
    result = await db.execute(select(Character).where(Character.player_id == current_user.id))
    characters = result.scalars().all()
    
    return [
        {
            "id": character.id,
            "name": character.name,
            "character_class": character.character_class.value,
            "level": character.level,
            "experience": character.experience,
            "stats": {
                "strength": character.strength,
                "agility": character.agility,
                "intelligence": character.intelligence,
                "vitality": character.vitality
            }
        }
        for character in characters
    ]

@router.post("/")
async def create_character(
    request: CharacterCreateRequest,
    current_user: Player = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new character for the current player"""
    # Check if player already has 3 characters (limit)
    result = await db.execute(select(Character).where(Character.player_id == current_user.id))
    existing_characters = result.scalars().all()
    
    if len(existing_characters) >= 3:
        raise HTTPException(status_code=400, detail="Maximum of 3 characters per account")
    
    # Check if character name is already taken
    result = await db.execute(select(Character).where(Character.name == request.name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Character name already taken")
    
    character = Character(
        player_id=current_user.id,
        name=request.name,
        character_class=request.character_class
    )
    
    db.add(character)
    await db.commit()
    await db.refresh(character)
    
    return {
        "id": character.id,
        "name": character.name,
        "character_class": character.character_class.value,
        "level": character.level
    }

@router.delete("/{character_id}")
async def delete_character(
    character_id: int,
    current_user: Player = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a character (must belong to current user)"""
    # Find the character
    result = await db.execute(select(Character).where(Character.id == character_id))
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Verify ownership
    if character.player_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own characters")
    
    # Delete the character
    await db.delete(character)
    await db.commit()
    
    return {
        "message": f"Character '{character.name}' has been deleted",
        "deleted_character_id": character_id
    }
