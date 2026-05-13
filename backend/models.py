from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Enum
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
    ai_experiences  = relationship("UserExperience", back_populates="user")


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


class UserExperience(Base):
    """AI 분석 이력 저장 테이블"""
    __tablename__ = "user_experiences"
    idx          = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=True)
    exp_type     = Column(String(100), nullable=True)
    title        = Column(String(200), nullable=False)
    start_date   = Column(String(20),  nullable=True)
    end_date     = Column(String(20),  nullable=True)
    content      = Column(Text,        nullable=True)
    memo         = Column(Text,        nullable=True)
    ncs_mapping  = Column(Text,        nullable=True)
    created_at   = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="ai_experiences")


class NCSInfo(Base):
    __tablename__ = "ncs_info"
    idx           = Column(Integer, primary_key=True, index=True)
    ncs_code      = Column(String(50),  unique=True, nullable=False)
    large_cat     = Column(String(100), nullable=True)
    middle_cat    = Column(String(100), nullable=True)
    small_cat     = Column(String(100), nullable=True)
    unit_name     = Column(String(200), nullable=False)
    unit_desc     = Column(Text,        nullable=True)


class Certification(Base):
    __tablename__ = "certifications"
    cert_id       = Column(Integer, primary_key=True, index=True)
    cert_name     = Column(String(200), nullable=False)
    category      = Column(String(100), nullable=True)
    pass_rate     = Column(Float,       nullable=True)
    exam_cost     = Column(Integer,     nullable=True)
    related_job   = Column(String(300), nullable=True)
    exam_schedule = Column(String(300), nullable=True)
    score_schedule= Column(String(300), nullable=True)
