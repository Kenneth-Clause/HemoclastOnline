"""
Leaderboard models - Competitive rankings
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class LeaderboardType(enum.Enum):
    """Types of leaderboards"""
    EXPERIENCE = "experience"
    LEVEL = "level"
    RAID_DAMAGE = "raid_damage"
    GUILD_PROGRESS = "guild_progress"
    SEASONAL_POINTS = "seasonal_points"

class Leaderboard(Base):
    """Leaderboard entries model"""
    __tablename__ = "leaderboards"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Type and season
    leaderboard_type = Column(SQLEnum(LeaderboardType), nullable=False)
    season_id = Column(String(50), nullable=False)  # e.g., "2024-winter"
    
    # Player/Guild reference
    player_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    guild_id = Column(Integer, ForeignKey("guilds.id"), nullable=True)
    
    # Score and ranking
    score = Column(Integer, nullable=False)
    rank = Column(Integer, nullable=False)
    
    # Additional data (JSON for flexibility)
    payload_json = Column(JSON, default=dict)
    
    # Timestamps
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    player = relationship("Player")
    guild = relationship("Guild")
    
    def __repr__(self):
        return f"<Leaderboard(type={self.leaderboard_type.value}, rank={self.rank}, score={self.score})>"
