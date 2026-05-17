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
    prompt = f"""당신은 취업 준비 전문가입니다. 공백기 취업 준비생의 프로필 입력값을 검토하고 적절성을 평가해주세요.

[사용자 프로필]
- 공백기: {req.gap_period or '미입력'}
- 전공/학과: {req.department or '미입력'}
- 보유 자격증: {req.certifications or '없음'}
- 희망 직무: {req.job_interest or '미입력'}

[평가 기준]
1. 각 항목이 분석에 충분히 구체적인지 확인하세요.
2. 자격증과 희망 직무의 연관성을 평가하세요.
3. 공백기 기간이 명확하게 표현되어 있는지 확인하세요.
4. 미입력 항목은 ok: false로 표시하세요.

다음 JSON 형식으로만 답하세요 (다른 말 없이):
{{
  "overall": "종합 평가 1~2문장",
  "score": 전체 준비도 점수(0-100),
  "fields": {{
    "gap_period": {{"ok": true, "comment": "평가 한 문장"}},
    "department": {{"ok": true, "comment": "평가 한 문장"}},
    "certifications": {{"ok": true, "comment": "평가 한 문장"}},
    "job_interest": {{"ok": true, "comment": "평가 한 문장"}}
  }},
  "suggestions": ["개선 제안 한 문장", "개선 제안 한 문장"]
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
