"""
Player model - Core user account
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Player(Base):
    """Player account model"""
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    
    # Cosmetics and preferences
    cosmetics = Column(JSON, default=dict)
    preferences = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    
    # Status
    is_active = Column(Boolean, default=True)
    is_banned = Column(Boolean, default=False)
    
    # Daily rewards tracking
    login_streak = Column(Integer, default=0)
    last_daily_reward = Column(DateTime(timezone=True))
    
    # Relationships
    characters = relationship("Character", back_populates="player")
    guild_memberships = relationship("GuildMember", back_populates="player")
    economy_ledger = relationship("EconomyLedger", back_populates="player")
    
    def __repr__(self):
        return f"<Player(id={self.id}, name='{self.name}')>"
