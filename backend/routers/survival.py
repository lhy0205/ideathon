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
    prompt = f"""당신은 한국 자격증 전문가입니다. 사용자가 입력한 자격증이 실제로 존재하는 국내 자격증인지만 판단하세요.

[사용자 입력]
- 보유 자격증: {req.certifications or '(비어있음)'}

[판단 기준]
- 비어있으면: ok: true (입력 안 해도 됨)
- 실제 존재하는 국내 자격증이면: ok: true (예: 정보처리기사, SQLD, ADsP, 컴퓨터활용능력, TOEIC 등)
- 존재하지 않는 자격증명이거나 완전히 무의미한 글자(ㅁㄴㅇ, asdf 등)면: ok: false

다음 JSON 형식으로만 답하세요 (다른 말 없이):
{{
  "overall": "한 문장 요약",
  "score": 70,
  "fields": {{
    "gap_period": {{"ok": true, "comment": ""}},
    "department": {{"ok": true, "comment": ""}},
    "certifications": {{"ok": true, "comment": "자격증 평가 한 문장"}},
    "job_interest": {{"ok": true, "comment": ""}}
  }},
  "suggestions": []
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
