from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class OAuthProvider(str, enum.Enum):
    local = "local"
    kakao = "kakao"
    naver = "naver"
    google = "google"

class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(255), unique=True, index=True, nullable=False)
    password_hash   = Column(String(255), nullable=True)
    name            = Column(String(100), nullable=False)
    job_interest    = Column(String(100), nullable=True)
    gap_start_date  = Column(String(20), nullable=True)
    profile_image   = Column(String(500), nullable=True)
    phone           = Column(String(20), nullable=True)
    oauth_provider  = Column(Enum(OAuthProvider), default=OAuthProvider.local)
    oauth_id        = Column(String(255), nullable=True)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, server_default=func.now())
    updated_at      = Column(DateTime, server_default=func.now(), onupdate=func.now())

    experiences     = relationship("Experience", back_populates="user")
    missions        = relationship("Mission", back_populates="user")
    posts           = relationship("CommunityPost", back_populates="user")
    notifications   = relationship("Notification", back_populates="user")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    token      = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used       = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class Experience(Base):
    __tablename__ = "experiences"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    title       = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category    = Column(String(100), nullable=True)
    ncs_skills  = Column(Text, nullable=True)
    start_date  = Column(String(20), nullable=True)
    end_date    = Column(String(20), nullable=True)
    created_at  = Column(DateTime, server_default=func.now())
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="experiences")

class Mission(Base):
    __tablename__ = "missions"
    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    title        = Column(String(200), nullable=False)
    content      = Column(Text, nullable=True)
    mission_type = Column(String(50), nullable=True)
    image_url    = Column(String(500), nullable=True)
    completed    = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    streak       = Column(Integer, default=0)
    created_at   = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="missions")

class CommunityPost(Base):
    __tablename__ = "community_posts"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    content    = Column(Text, nullable=False)
    image_url  = Column(String(500), nullable=True)
    likes      = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user       = relationship("User", back_populates="posts")
    post_likes = relationship("PostLike", back_populates="post")

class PostLike(Base):
    __tablename__ = "post_likes"
    id         = Column(Integer, primary_key=True)
    post_id    = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    post = relationship("CommunityPost", back_populates="post_likes")

class Notification(Base):
    __tablename__ = "notifications"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    message    = Column(String(500), nullable=False)
    type       = Column(String(50), nullable=True)
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="notifications")
