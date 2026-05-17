from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import re, json

from survival.cox_model import compute_survival_curves
from rag.exaone_client import analyze

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


class VerifyProfileRequest(BaseModel):
    gap_period:     Optional[str] = ""
    department:     Optional[str] = ""
    certifications: Optional[str] = ""
    job_interest:   Optional[str] = ""


@router.post("/verify-profile")
async def verify_profile(req: VerifyProfileRequest):
    """vLLM 기반 프로필 입력값 적절성 검증."""
    prompt = f"""당신은 취업 준비 전문가입니다. 아래 입력값이 실제로 의미 있는 내용인지만 판단하세요.

[사용자 입력]
- 공백기: {req.gap_period or '(비어있음)'}
- 전공/학과: {req.department or '(비어있음)'}
- 보유 자격증: {req.certifications or '(비어있음)'}
- 희망 직무: {req.job_interest or '(비어있음)'}

[판단 기준 - 엄격하게 적용하지 마세요]
- ok: false 조건: 명백히 무의미한 글자(예: ㅁㄴㅇ, asdf, 아무말, 랜덤 문자)를 입력한 경우만
- ok: true 조건: 비어있거나, 실제 존재할 법한 내용이면 무조건 true
- 공백기가 비어있거나 숫자+단위(1개월, 반년 등) 형태면 ok: true
- 희망 직무가 비어있거나 실제 직무명이면 ok: true

다음 JSON 형식으로만 답하세요 (다른 말 없이):
{{
  "overall": "종합 평가 1문장",
  "score": 전체 준비도 점수(0-100),
  "fields": {{
    "gap_period": {{"ok": true, "comment": "짧은 평가"}},
    "department": {{"ok": true, "comment": "짧은 평가"}},
    "certifications": {{"ok": true, "comment": "짧은 평가"}},
    "job_interest": {{"ok": true, "comment": "짧은 평가"}}
  }},
  "suggestions": ["개선 제안 1문장"]
}}"""

    try:
        raw = await analyze(prompt)
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            parsed = json.loads(match.group())
            if "overall" in parsed:
                return parsed
    except Exception:
        pass

    raise HTTPException(status_code=500, detail="AI 검증 중 오류가 발생했습니다")
