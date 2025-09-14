"""
Character model - Player's game characters
"""

from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class CharacterClass(enum.Enum):
    """Character classes"""
    WARRIOR = "warrior"
    ROGUE = "rogue"
    MAGE = "mage"

class CharacterSpec(enum.Enum):
    """Character specializations (unlocked at level 15)"""
    # Warrior specs
    KNIGHT = "knight"
    BERSERKER = "berserker"
    
    # Rogue specs  
    ASSASSIN = "assassin"
    RANGER = "ranger"
    
    # Mage specs
    ELEMENTALIST = "elementalist"
    NECROMANCER = "necromancer"

class Character(Base):
    """Player character model"""
    __tablename__ = "characters"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    
    # Basic info
    name = Column(String(50), nullable=False)
    character_class = Column(SQLEnum(CharacterClass), nullable=False)
    specialization = Column(SQLEnum(CharacterSpec), nullable=True)
    
    # Progression
    level = Column(Integer, default=1)
    experience = Column(Integer, default=0)
    
    # Base stats (STR, AGI, INT, VIT)
    strength = Column(Integer, default=10)
    agility = Column(Integer, default=10)
    intelligence = Column(Integer, default=10)
    vitality = Column(Integer, default=10)
    
    # Combat stats (calculated from base stats + gear)
    health_max = Column(Integer, default=100)
    mana_max = Column(Integer, default=50)
    
    # Skill loadout (3 actives, 1 ultimate, 2 passives)
    active_skills = Column(JSON, default=list)  # List of skill IDs
    ultimate_skill = Column(Integer, nullable=True)  # Single skill ID
    passive_skills = Column(JSON, default=list)  # List of skill IDs
    
    # Equipment slots
    equipped_weapon = Column(Integer, ForeignKey("items.id"), nullable=True)
    equipped_head = Column(Integer, ForeignKey("items.id"), nullable=True)
    equipped_chest = Column(Integer, ForeignKey("items.id"), nullable=True)
    equipped_charm = Column(Integer, ForeignKey("items.id"), nullable=True)
    
    # Relationships
    player = relationship("Player", back_populates="characters")
    inventory = relationship("Inventory", back_populates="character")
    
    def __repr__(self):
        return f"<Character(id={self.id}, name='{self.name}', class={self.character_class.value}, level={self.level})>"
