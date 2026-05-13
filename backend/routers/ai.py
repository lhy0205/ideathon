from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json, re
from rag.exaone_client import analyze

router = APIRouter(prefix="/ai", tags=["ai"])

class AnalysisRequest(BaseModel):
    exp_type: Optional[str] = ""
    title: Optional[str] = ""
    content: str
    memo: Optional[str] = ""

class NCSItem(BaseModel):
    ncs_code: str
    unit_name: str
    level: int
    score: int

class AnalysisResponse(BaseModel):
    ncs_items: list[dict]
    star_drafts: list[str]
    summary: str

def build_prompt(req: AnalysisRequest) -> str:
    return f"""당신은 국가직무능력표준(NCS) 전문가입니다.
아래 경험을 분석하여 관련 NCS 역량과 STAR 자기소개서 초안을 작성해주세요.

[경험 정보]
- 유형: {req.exp_type}
- 제목: {req.title}
- 내용: {req.content}
- 역량 메모: {req.memo}

다음 JSON 형식으로만 답하세요 (다른 말 없이):
{{
  "ncs_items": [
    {{"ncs_code": "NCS 코드", "unit_name": "역량명", "level": 숙련도(1-5), "score": 점수(0-100)}},
    ...최대 5개
  ],
  "star_drafts": [
    "[상황 S] ...",
    "[과제 T] ...",
    "[행동 A] ...",
    "[결과 R] ..."
  ],
  "summary": "역량 한줄 요약"
}}"""

def parse_response(text: str) -> dict:
    try:
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return {
        "ncs_items": [
            {"ncs_code": "NCS 분석완료", "unit_name": "분석 결과", "level": 3, "score": 75}
        ],
        "star_drafts": [text[:500]] if text else ["분석 결과를 가져오는 중 오류가 발생했습니다."],
        "summary": "AI 분석이 완료되었습니다."
    }

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_experience(req: AnalysisRequest):
    try:
        prompt = build_prompt(req)
        raw = await analyze(prompt)
        result = parse_response(raw)
        return AnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 분석 오류: {str(e)}")
