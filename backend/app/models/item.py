"""
Item model - Equipment and consumables
"""

from sqlalchemy import Column, Integer, String, JSON, Enum as SQLEnum
from app.core.database import Base
import enum

class ItemSlot(enum.Enum):
    """Equipment slots"""
    WEAPON = "weapon"
    HEAD = "head"
    CHEST = "chest"
    CHARM = "charm"
    CONSUMABLE = "consumable"

class ItemRarity(enum.Enum):
    """Item rarity tiers"""
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"

class Item(Base):
    """Item template model"""
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic info
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    slot = Column(SQLEnum(ItemSlot), nullable=False)
    rarity = Column(SQLEnum(ItemRarity), default=ItemRarity.COMMON)
    
    # Level requirements
    level_requirement = Column(Integer, default=1)
    
    # Stats (JSON for flexibility)
    # Example: {"strength": 5, "vitality": 3, "damage": 15}
    stats = Column(JSON, default=dict)
    
    # Visual reference for sprites
    art_reference = Column(String(100))  # Sprite/texture reference
    
    # Market value
    base_value = Column(Integer, default=1)  # In gold
    
    def __repr__(self):
        return f"<Item(id={self.id}, name='{self.name}', slot={self.slot.value}, rarity={self.rarity.value})>"
