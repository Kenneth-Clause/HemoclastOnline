"""
Raid boss models - Guild cooperative content
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class RaidBoss(Base):
    """Raid boss instance model"""
    __tablename__ = "raid_bosses"
    
    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id"), nullable=False)
    
    # Boss info
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    art_reference = Column(String(100))  # Sprite reference
    
    # Health pool
    health_max = Column(Integer, nullable=False)
    health_current = Column(Integer, nullable=False)
    
    # Timing
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    
    # Rewards
    reward_table = Column(JSON, default=dict)  # Tiered rewards based on damage
    
    # Status
    is_defeated = Column(Boolean, default=False)
    
    # Relationships
    damage_records = relationship("RaidDamage", back_populates="raid_boss")
    
    def __repr__(self):
        return f"<RaidBoss(id={self.id}, name='{self.name}', hp={self.health_current}/{self.health_max})>"

class RaidDamage(Base):
    """Individual damage records for raid bosses"""
    __tablename__ = "raid_damage"
    
    id = Column(Integer, primary_key=True, index=True)
    raid_boss_id = Column(Integer, ForeignKey("raid_bosses.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    
    # Damage dealt
    damage_dealt = Column(Integer, default=0)
    
    # Timestamp
    dealt_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    raid_boss = relationship("RaidBoss", back_populates="damage_records")
    player = relationship("Player")
    
    def __repr__(self):
        return f"<RaidDamage(raid_boss_id={self.raid_boss_id}, player_id={self.player_id}, damage={self.damage_dealt})>"
