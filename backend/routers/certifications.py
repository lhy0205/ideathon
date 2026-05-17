from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
import models

router = APIRouter(prefix="/certifications", tags=["certifications"])


class CertScheduleResponse(BaseModel):
    cert_id: int
    cert_name: str
    category: Optional[str]
    pass_rate: Optional[float]
    exam_cost: Optional[int]
    related_job: Optional[str]
    apply_start: Optional[str]
    apply_end: Optional[str]
    exam_start: Optional[str]
    exam_end: Optional[str]
    result_date: Optional[str]

    class Config:
        from_attributes = True


@router.get("/schedule", response_model=List[CertScheduleResponse])
def get_cert_schedule(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """자격증 시험 일정 조회 (category 필터 선택)"""
    query = db.query(models.Certification)
    if category:
        query = query.filter(models.Certification.category == category)
    return query.all()
