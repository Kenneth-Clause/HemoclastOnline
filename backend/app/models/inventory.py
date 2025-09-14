"""
Inventory model - Player item storage
"""

from sqlalchemy import Column, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Inventory(Base):
    """Player inventory model"""
    __tablename__ = "inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    
    # Quantity for stackable items
    quantity = Column(Integer, default=1)
    
    # Equipment status
    is_equipped = Column(Boolean, default=False)
    
    # Relationships
    character = relationship("Character", back_populates="inventory")
    item = relationship("Item")
    
    def __repr__(self):
        return f"<Inventory(character_id={self.character_id}, item_id={self.item_id}, qty={self.quantity})>"
