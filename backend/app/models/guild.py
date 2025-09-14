"""
Guild models - Social system
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class GuildRole(enum.Enum):
    """Guild member roles"""
    MEMBER = "member"
    OFFICER = "officer"
    LEADER = "leader"

class Guild(Base):
    """Guild model"""
    __tablename__ = "guilds"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic info
    name = Column(String(50), unique=True, nullable=False)
    motto = Column(String(200))
    description = Column(String(1000))
    
    # Settings
    max_members = Column(Integer, default=25)
    is_recruiting = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    members = relationship("GuildMember", back_populates="guild")
    
    def __repr__(self):
        return f"<Guild(id={self.id}, name='{self.name}')>"

class GuildMember(Base):
    """Guild membership model"""
    __tablename__ = "guild_members"
    
    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    
    # Role and status
    role = Column(SQLEnum(GuildRole), default=GuildRole.MEMBER)
    
    # Timestamps
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    guild = relationship("Guild", back_populates="members")
    player = relationship("Player", back_populates="guild_memberships")
    
    def __repr__(self):
        return f"<GuildMember(guild_id={self.guild_id}, player_id={self.player_id}, role={self.role.value})>"
