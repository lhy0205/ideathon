from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
import models, schemas
from knn.knn_matcher import knn_match


router = APIRouter(prefix="/senior-personas", tags=["senior-personas"])


class UserProfileForKNN(BaseModel):
    gap_period: Optional[str] = None        # 예: "5개월"
    department: Optional[str] = None        # 예: "경영학과"
    certifications: Optional[str] = None    # 예: "ADsP, SQLD"
    job_interest: Optional[str] = None      # 예: "데이터 분석"


@router.get("/", response_model=List[schemas.SeniorPersonaResponse])
def get_senior_personas(
    limit: int = 3,
    department: Optional[str] = None,
    employment_field: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """단순 조회 (similarity_score 내림차순 정렬)"""
    query = db.query(models.SeniorPersona)

    if department:
        query = query.filter(models.SeniorPersona.department == department)
    if employment_field:
        query = query.filter(models.SeniorPersona.employment_field == employment_field)

    return (
        query
        .order_by(models.SeniorPersona.similarity_score.desc())
        .limit(limit)
        .all()
    )


@router.post("/match", response_model=List[schemas.SeniorPersonaResponse])
def match_senior_personas(
    profile: UserProfileForKNN,
    k: int = 3,
    db: Session = Depends(get_db),
):
    """
    KNN 기반 선배 페르소나 매칭.
    사용자 프로필(공백기간·학과·자격증·희망직무)을 입력받아
    가장 유사한 합격자 K명을 반환한다.
    """
    personas = (
        db.query(models.SeniorPersona)
        .filter(models.SeniorPersona.is_accepted == True)
        .all()
    )

    if not personas:
        return []

    matched = knn_match(profile.model_dump(), personas, k=k)
    return matched
