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
    prompt = f"""당신은 한국 대학 학과 및 자격증 전문가입니다. 아래 입력값이 실제로 존재하는 내용인지 판단하세요.

[사용자 입력]
- 전공/학과: {req.department or '(비어있음)'}
- 보유 자격증: {req.certifications or '(비어있음)'}

[판단 기준 - 반드시 준수]
- 비어있으면: 무조건 ok: true
- 전공/학과: 실제 존재하는 대학 학과명이면 ok: true. 완전히 무의미한 글자(ㅁㄴㅇ, asdf, ㅇㄴㄹㄱ 등 자음/모음만 나열)면 ok: false
- 자격증: 실제 존재하는 국내외 자격증·어학시험(정보처리기사, SQLD, TOEIC, ADsP 등)이면 ok: true. 존재하지 않는 이름이거나 무의미한 글자면 ok: false

다음 JSON 형식으로만 답하세요 (다른 말 없이):
{{
  "overall": "한 문장 요약",
  "score": 70,
  "fields": {{
    "gap_period": {{"ok": true, "comment": ""}},
    "department": {{"ok": true, "comment": "학과 평가 한 문장"}},
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
