from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"
    idx          = Column(Integer, primary_key=True, index=True)
    name         = Column(String(100), nullable=False)
    user_id      = Column(String(100), unique=True, nullable=False)
    password     = Column(String(255), nullable=False)
    department   = Column(String(100), nullable=True)   # 학과
    interest     = Column(String(100), nullable=True)   # 관심분야
    certificate  = Column(String(500), nullable=True)   # 자격증
    gap_period   = Column(String(50),  nullable=True)   # 공백기간
    created_at   = Column(DateTime, server_default=func.now())

    experiences  = relationship("UserExperience", back_populates="user")


class UserExperience(Base):
    __tablename__ = "user_experiences"
    idx          = Column(Integer, primary_key=True, index=True)
    user_idx     = Column(Integer, ForeignKey("users.idx"), nullable=False)  # 사용자 IDX (FK)
    exp_type     = Column(String(100), nullable=True)   # 경험유형
    title        = Column(String(200), nullable=False)  # 경험제목
    start_date   = Column(String(20),  nullable=True)   # 시작시기
    end_date     = Column(String(20),  nullable=True)   # 종료시기
    content      = Column(Text,        nullable=True)   # 경험내용
    memo         = Column(Text,        nullable=True)   # 경험메모
    created_at   = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="experiences")


class NCSInfo(Base):
    __tablename__ = "ncs_info"
    idx           = Column(Integer, primary_key=True, index=True)
    ncs_code      = Column(String(50),  unique=True, nullable=False)  # NCS코드
    large_cat     = Column(String(100), nullable=True)                # 대분류
    middle_cat    = Column(String(100), nullable=True)                # 중분류
    small_cat     = Column(String(100), nullable=True)                # 소분류
    unit_name     = Column(String(200), nullable=False)               # 능력단위명
    unit_desc     = Column(Text,        nullable=True)                # 능력단위설명


class Certification(Base):
    __tablename__ = "certifications"
    cert_id       = Column(Integer, primary_key=True, index=True)  # 자격증ID
    cert_name     = Column(String(200), nullable=False)            # 자격증명
    category      = Column(String(100), nullable=True)             # category
    pass_rate     = Column(Float,       nullable=True)             # 합격률
    exam_cost     = Column(Integer,     nullable=True)             # 응시비용
    related_job   = Column(String(300), nullable=True)             # 관련직무
    exam_schedule = Column(String(300), nullable=True)             # 시험일정
    score_schedule= Column(String(300), nullable=True)             # 점수일정
