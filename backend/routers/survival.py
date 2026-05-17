from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import re
import json
import logging
import asyncio

from survival.cox_model import compute_survival_curves
from rag.exaone_client import analyze

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
def validate_survival_input(req: SurvivalRequest):
    """생존 진단 입력값 검증 - 공백기는 클라이언트에서 검증, 학과/자격증/직무는 AI로 검증"""
    errors = []

    # 공백기 검증: 클라이언트에서 이미 검증했으므로 여기서는 스킵

    # AI를 사용해서 department, certifications, job_interest 검증
    if (req.department and req.department.strip()) or \
       (req.certifications and req.certifications.strip()) or \
       (req.job_interest and req.job_interest.strip()):

        prompt = f"""당신은 한국 대학 학과, 자격증, 직무 정보 전문가입니다.
아래 입력값들이 실제로 존재하는 것인지 검증해주세요. 유사한 표현도 인정합니다.

[입력값]
- 학과: {req.department or "없음"}
- 자격증: {req.certifications or "없음"}
- 희망직무: {req.job_interest or "없음"}

다음 JSON 형식으로만 답하세요 (다른 말 없이):
{{
  "department_valid": true/false,
  "department_msg": "유효하지 않으면 올바른 형식 제안",
  "certifications_valid": true/false,
  "certifications_msg": "유효하지 않으면 올바른 형식 제안",
  "job_interest_valid": true/false,
  "job_interest_msg": "유효하지 않으면 올바른 형식 제안"
}}"""

        try:
            # 동기 함수에서 비동기 함수 실행
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(analyze(prompt))
            loop.close()

            try:
                validation_result = json.loads(result)
                if not validation_result.get("department_valid") and req.department:
                    errors.append(f"학과: {validation_result.get('department_msg', '유효하지 않은 학과입니다')}")
                if not validation_result.get("certifications_valid") and req.certifications:
                    errors.append(f"자격증: {validation_result.get('certifications_msg', '유효하지 않은 자격증입니다')}")
                if not validation_result.get("job_interest_valid") and req.job_interest:
                    errors.append(f"희망직무: {validation_result.get('job_interest_msg', '유효하지 않은 직무입니다')}")
            except json.JSONDecodeError:
                logger.error(f"AI validation response parsing failed: {result}")
        except Exception as e:
            logger.error(f"AI validation error: {e}")

    return ValidationResponse(valid=len(errors) == 0, errors=errors)
