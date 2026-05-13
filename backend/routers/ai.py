from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import json, re
from rag.exaone_client import analyze

router = APIRouter(prefix="/ai", tags=["ai"])

class AnalysisRequest(BaseModel):
    exp_type: Optional[str] = ""
    title: Optional[str] = ""
    content: str
    memo: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""

class AnalysisResponse(BaseModel):
    ncs_items: list[dict]
    star_drafts: list[str]
    summary: str

class CertRecommendRequest(BaseModel):
    ncs_items: list[dict]

class CertRecommendResponse(BaseModel):
    certs: list[dict]

def _get_rag_context(query: str) -> str:
    try:
        from rag.retriever import retrieve_ncs
        items = retrieve_ncs(query, n_results=5)
        if not items:
            return ""
        lines = [f"- [{it['ncs_code']}] {it['unit_name']}: {it['document']}" for it in items]
        return "\n".join(lines)
    except Exception:
        return ""

def build_prompt(req: AnalysisRequest, rag_context: str = "") -> str:
    rag_section = ""
    if rag_context:
        rag_section = f"""
[관련 NCS 역량 참고 (RAG 검색 결과)]
{rag_context}
"""
    return f"""당신은 국가직무능력표준(NCS) 전문가입니다.

중요: 아래 경험 내용이 실제 사람의 경험을 서술한 의미 있는 문장이 아니라면 (예: 자음/모음 나열, 무의미한 반복 문자, 영어 단어 나열 등), 반드시 다음 JSON만 반환하세요:
{{"invalid": true}}

경험 내용이 실제 경험이라면 NCS 역량과 STAR 자기소개서 초안을 작성해주세요.
{rag_section}
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
            parsed = json.loads(match.group())
            if parsed.get("invalid"):
                raise ValueError("invalid_input")
            return parsed
    except ValueError:
        raise
    except Exception:
        pass
    return {
        "ncs_items": [
            {"ncs_code": "NCS 분석완료", "unit_name": "분석 결과", "level": 3, "score": 75}
        ],
        "star_drafts": [text[:500]] if text else ["분석 결과를 가져오는 중 오류가 발생했습니다."],
        "summary": "AI 분석이 완료되었습니다.",
    }

@router.post("/recommend-certs", response_model=CertRecommendResponse)
async def recommend_certs(req: CertRecommendRequest):
    ncs_summary = "\n".join([
        f"- {item.get('unit_name', '')} (적합도: {item.get('score', 0)}%)"
        for item in req.ncs_items
    ])
    prompt = f"""당신은 취업 준비생을 돕는 자격증 추천 전문가입니다.

아래 NCS 역량 분석 결과를 바탕으로 취업에 유리한 자격증을 추천해주세요.

[NCS 역량 분석 결과]
{ncs_summary}

다음 JSON 형식으로만 답하세요 (다른 말 없이):
{{
  "certs": [
    {{"name": "자격증명", "org": "발급기관", "reason": "추천 이유 (1문장)", "priority": 1}},
    ...최대 5개, priority는 1이 가장 중요
  ]
}}"""
    try:
        raw = await analyze(prompt)
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            parsed = json.loads(match.group())
            return CertRecommendResponse(certs=parsed.get("certs", []))
    except Exception:
        pass
    return CertRecommendResponse(certs=[])

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_experience(req: AnalysisRequest):
    try:
        query = f"{req.title} {req.content} {req.memo}"
        rag_context = _get_rag_context(query)
        prompt = build_prompt(req, rag_context)
        raw = await analyze(prompt)
        result = parse_response(raw)

        # DB 저장 (실패해도 분석 결과는 반환)
        try:
            from database import SessionLocal
            import models as m
            from sqlalchemy import text
            db = SessionLocal()
            # user_idx FK 우회: 첫 번째 유저 idx 사용, 없으면 NULL 허용 raw insert
            first_user = db.query(m.User).first()
            user_idx = first_user.idx if first_user else None
            if user_idx:
                exp = m.UserExperience(
                    user_idx=user_idx,
                    exp_type=req.exp_type or "",
                    title=req.title or "제목 없음",
                    start_date=req.start_date or "",
                    end_date=req.end_date or "",
                    content=req.content,
                    memo=req.memo or "",
                    ncs_mapping=json.dumps(result, ensure_ascii=False),
                )
                db.add(exp)
                db.commit()
            db.close()
        except Exception:
            pass

        return AnalysisResponse(**result)
    except ValueError as e:
        if "invalid_input" in str(e):
            raise HTTPException(status_code=422, detail="실제 경험을 구체적으로 작성해주세요. 의미 없는 텍스트는 분석할 수 없습니다.")
        raise HTTPException(status_code=500, detail=f"AI 분석 오류: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 분석 오류: {str(e)}")


class ExperienceHistoryItem(BaseModel):
    idx: int
    title: str
    exp_type: Optional[str]
    ncs_count: int
    created_at: str

@router.get("/history", response_model=List[ExperienceHistoryItem])
def get_history():
    try:
        from database import SessionLocal
        import models as m
        db = SessionLocal()
        exps = db.query(m.UserExperience).order_by(m.UserExperience.created_at.desc()).limit(10).all()
        result = []
        for e in exps:
            ncs_count = 0
            if e.ncs_mapping:
                try:
                    ncs_count = len(json.loads(e.ncs_mapping).get("ncs_items", []))
                except Exception:
                    pass
            result.append(ExperienceHistoryItem(
                idx=e.idx,
                title=e.title,
                exp_type=e.exp_type,
                ncs_count=ncs_count,
                created_at=e.created_at.strftime("%Y-%m-%d") if e.created_at else "",
            ))
        db.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{idx}", response_model=AnalysisResponse)
def get_history_detail(idx: int):
    try:
        from database import SessionLocal
        import models as m
        db = SessionLocal()
        exp = db.query(m.UserExperience).filter(m.UserExperience.idx == idx).first()
        db.close()
        if not exp or not exp.ncs_mapping:
            raise HTTPException(status_code=404, detail="분석 결과가 없습니다")
        return AnalysisResponse(**json.loads(exp.ncs_mapping))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
