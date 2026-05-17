from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from survival.cox_model import compute_survival_curves

router = APIRouter(prefix="/survival", tags=["survival"])


class SurvivalRequest(BaseModel):
    gap_period:     Optional[str] = "5개월"
    department:     Optional[str] = ""
    certifications: Optional[str] = ""
    job_interest:   Optional[str] = ""


@router.post("/curve")
def get_survival_curve(req: SurvivalRequest):
    """Cox 비례 위험 모델 기반 공백기 생존 곡선 계산."""
    return compute_survival_curves(req.model_dump())
