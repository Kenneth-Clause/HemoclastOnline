"""
Economy models - Currency and transaction tracking
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class CurrencyType(enum.Enum):
    """Currency types"""
    GOLD = "gold"  # Soft currency
    GEMS = "gems"  # Premium currency
    CRAFTING_MATERIALS = "crafting_materials"

class EconomyLedger(Base):
    """Economy transaction ledger"""
    __tablename__ = "economy_ledger"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    
    # Transaction details
    currency_type = Column(SQLEnum(CurrencyType), nullable=False)
    delta = Column(Integer, nullable=False)  # Positive for gain, negative for spend
    balance_after = Column(Integer, nullable=False)
    
    # Transaction context
    reason = Column(String(200), nullable=False)  # e.g., "quest_reward", "shop_purchase"
    reference_id = Column(String(100))  # Optional reference to quest, item, etc.
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    player = relationship("Player", back_populates="economy_ledger")
    
    def __repr__(self):
        return f"<EconomyLedger(player_id={self.player_id}, currency={self.currency_type.value}, delta={self.delta})>"
