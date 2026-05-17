from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import re
import json
import logging

from survival.cox_model import compute_survival_curves

router = APIRouter(prefix="/survival", tags=["survival"])
logger = logging.getLogger(__name__)


class SurvivalRequest(BaseModel):
    gap_period:     Optional[str] = "5개월"
    department:     Optional[str] = ""
    certifications: Optional[str] = ""
    job_interest:   Optional[str] = ""


class ValidationResponse(BaseModel):
    valid: bool
    errors: list[str] = []


@router.post("/curve")
def get_survival_curve(req: SurvivalRequest):
    """Cox 비례 위험 모델 기반 공백기 생존 곡선 계산."""
    return compute_survival_curves(req.model_dump())


@router.post("/validate-input", response_model=ValidationResponse)
async def validate_survival_input(req: SurvivalRequest):
    """생존 진단 입력값 검증"""
    errors = []

    # 공백기 검증: 숫자와 시간 단위 필요
    if req.gap_period and req.gap_period.strip():
        if not re.search(r'\d', req.gap_period):
            errors.append("공백기: 숫자를 포함해야 합니다 (예: 1일, 5개월, 1년)")
        elif not re.search(r'(일|개월|년)', req.gap_period):
            errors.append("공백기: 일, 개월, 년 중 하나를 포함해야 합니다")

    return ValidationResponse(valid=len(errors) == 0, errors=errors)
