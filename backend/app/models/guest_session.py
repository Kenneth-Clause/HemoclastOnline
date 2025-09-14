"""
Guest Session model - Persistent guest user sessions
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime


class GuestSession(Base):
    """Guest session model for persistent guest authentication"""
    __tablename__ = "guest_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    guest_name = Column(String(50), unique=True, index=True, nullable=False)
    
    # Link to player record (guest players still get Player records for characters, etc.)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    
    # Session management
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_accessed = Column(DateTime(timezone=True), server_default=func.now())
    
    # Conversion tracking
    converted_to_registered = Column(Boolean, default=False)
    converted_at = Column(DateTime(timezone=True))
    
    # Relationships
    player = relationship("Player", backref="guest_session")
    
    def __repr__(self):
        return f"<GuestSession(id={self.id}, guest_name='{self.guest_name}', active={self.is_active})>"
    
    @classmethod
    def generate_session_token(cls) -> str:
        """Generate a unique session token for guest authentication"""
        return f"guest_{str(uuid.uuid4()).replace('-', '')}"
    
    def deactivate(self):
        """Deactivate this guest session"""
        self.is_active = False
    
    def mark_as_converted(self):
        """Mark this guest session as converted to a registered account"""
        self.converted_to_registered = True
        self.converted_at = datetime.utcnow()
        self.is_active = False
