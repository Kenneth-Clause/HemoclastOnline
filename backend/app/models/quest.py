"""
Quest and world node models
"""

from sqlalchemy import Column, Integer, String, JSON, Enum as SQLEnum
from app.core.database import Base
import enum

class BiomeType(enum.Enum):
    """World biome types"""
    FOREST = "forest"
    CAVE = "cave"
    RUINS = "ruins"
    SWAMP = "swamp"
    CRYPT = "crypt"

class Quest(Base):
    """Quest template model"""
    __tablename__ = "quests"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic info
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    
    # Requirements
    level_requirement = Column(Integer, default=1)
    prerequisite_quests = Column(JSON, default=list)  # List of quest IDs
    
    # Rewards
    experience_reward = Column(Integer, default=0)
    gold_reward = Column(Integer, default=0)
    item_rewards = Column(JSON, default=list)  # List of item IDs
    
    def __repr__(self):
        return f"<Quest(id={self.id}, name='{self.name}')>"

class QuestNode(Base):
    """World map node model"""
    __tablename__ = "quest_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic info
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    biome = Column(SQLEnum(BiomeType), nullable=False)
    
    # Positioning
    map_x = Column(Integer, nullable=False)
    map_y = Column(Integer, nullable=False)
    
    # Difficulty and rewards
    difficulty_level = Column(Integer, default=1)
    enemy_types = Column(JSON, default=list)  # List of enemy IDs
    
    # Loot tables
    drop_table = Column(JSON, default=dict)  # Item ID -> drop chance
    
    # Requirements
    unlock_requirements = Column(JSON, default=dict)  # Level, completed quests, etc.
    
    def __repr__(self):
        return f"<QuestNode(id={self.id}, name='{self.name}', biome={self.biome.value})>"
