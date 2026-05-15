from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ── Auth ──
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    job_interest: Optional[str] = None
    gap_start_date: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# ── User ──
class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    job_interest: Optional[str]
    gap_start_date: Optional[str]
    profile_image: Optional[str]
    phone: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    job_interest: Optional[str] = None
    gap_start_date: Optional[str] = None
    phone: Optional[str] = None

# ── Experience ──
class ExperienceCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class ExperienceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    ncs_skills: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class ExperienceResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    ncs_skills: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ── Mission ──
class MissionCreate(BaseModel):
    title: str
    content: Optional[str] = None
    mission_type: Optional[str] = None

class MissionResponse(BaseModel):
    id: int
    title: str
    content: Optional[str]
    mission_type: Optional[str]
    image_url: Optional[str]
    completed: bool
    completed_at: Optional[datetime]
    streak: int
    verified: bool
    verification_note: Optional[str]
    verified_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class MissionVerifyRequest(BaseModel):
    text: Optional[str] = None

class MissionLogResponse(BaseModel):
    id: int
    mission_id: int
    user_id: int
    completed_at: datetime
    note: Optional[str]

    class Config:
        from_attributes = True

# ── Community ──
class PostCreate(BaseModel):
    content: str

class PostResponse(BaseModel):
    id: int
    user_id: int
    content: str
    image_url: Optional[str]
    likes: int
    created_at: datetime
    user_name: Optional[str] = None
    user_image: Optional[str] = None

    class Config:
        from_attributes = True

# ── AI Analysis ──
class NCSItem(BaseModel):
    ncs_code: str
    unit_name: str
    level: int
    score: int

class AnalysisResponse(BaseModel):
    ncs_items: List[dict]
    star_drafts: List[str]
    summary: str

# ── Notification ──
class NotificationResponse(BaseModel):
    id: int
    message: str
    type: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SeniorPersonaResponse(BaseModel):
    id: int
    user_id: str
    user_name: str
    avatar_label: Optional[str]
    avatar_color: Optional[str]
    department: Optional[str]
    gap_period: Optional[str]
    certifications: Optional[str]
    employment_field: str
    employment_company_type: Optional[str]
    career_path_summary: Optional[str]
    similarity_score: Optional[float]
    is_accepted: bool
    match_note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
