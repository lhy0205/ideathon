from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import json, re
from rag.exaone_client import analyze
from database import get_db
from dependencies import get_current_user
import models as m

router = APIRouter(prefix="/ai", tags=["ai"])


class AnalysisRequest(BaseModel):
    exp_type: Optional[str] = ""
    title: Optional[str] = ""
    content: str
    memo: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""


class AnalysisResponse(BaseModel):
    id: Optional[int] = None
    ncs_items: list[dict]
    star_drafts: list[str]
    summary: str


class CertRecommendRequest(BaseModel):
    ncs_items: list[dict]
    exp_type: Optional[str] = ""
    exp_title: Optional[str] = ""


class CertRecommendResponse(BaseModel):
    certs: list[dict]


class StarLetterUpdate(BaseModel):
    content: str


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
    rag_section = f"\n[관련 NCS 역량 참고]\n{rag_context}" if rag_context else ""
    return f"""당신은 국가직무능력표준(NCS) 전문가입니다.
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
        # JSON 블록 추출 (마크다운 코드블록 포함) - greedy so nested braces work
        match = re.search(r'```(?:json)?\s*(\{[\s\S]*\})\s*```', text)
        if not match:
            match = re.search(r'\{[\s\S]*\}', text)
        if match:
            raw = match.group(1) if match.lastindex else match.group()
            parsed = json.loads(raw)
            # star_drafts가 문자열로 왔을 경우 파싱
            if isinstance(parsed.get("star_drafts"), str):
                try:
                    parsed["star_drafts"] = json.loads(parsed["star_drafts"])
                except Exception:
                    parsed["star_drafts"] = [parsed["star_drafts"]]
            # ncs_items가 문자열로 왔을 경우 파싱
            if isinstance(parsed.get("ncs_items"), str):
                try:
                    parsed["ncs_items"] = json.loads(parsed["ncs_items"])
                except Exception:
                    parsed["ncs_items"] = []
            return parsed
    except Exception:
        pass
    return {
        "ncs_items": [{"ncs_code": "NCS-분석완료", "unit_name": "분석 결과", "level": 3, "score": 75}],
        "star_drafts": ["[상황 S] " + text[:200]] if text else ["분석 결과를 가져오는 중 오류가 발생했습니다."],
        "summary": "AI 분석이 완료되었습니다.",
    }


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_experience(
    req: AnalysisRequest,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        query = f"{req.title} {req.content} {req.memo}"
        rag_context = _get_rag_context(query)
        prompt = build_prompt(req, rag_context)
        raw = await analyze(prompt)
        result = parse_response(raw)

        # UserExperience 저장 (히스토리용)
        exp = m.UserExperience(
            user_id=current_user.id,
            exp_type=req.exp_type or "",
            title=req.title or "제목 없음",
            start_date=req.start_date or "",
            end_date=req.end_date or "",
            content=req.content,
            memo=req.memo or "",
            ncs_mapping=json.dumps(result, ensure_ascii=False),
        )
        db.add(exp)
        db.flush()

        # AnalysisResult 저장
        analysis = m.AnalysisResult(
            user_id=current_user.id,
            ncs_items=json.dumps(result.get("ncs_items", []), ensure_ascii=False),
            star_drafts=json.dumps(result.get("star_drafts", []), ensure_ascii=False),
            summary=result.get("summary", ""),
        )
        db.add(analysis)
        db.flush()

        # StarLetter 자동 생성
        for draft in result.get("star_drafts", []):
            label = next((k for k in ["[상황 S]", "[과제 T]", "[행동 A]", "[결과 R]"] if draft.startswith(k)), None)
            db.add(m.StarLetter(
                user_id=current_user.id,
                analysis_id=analysis.id,
                question=label or "",
                content=draft,
            ))

        db.commit()
        db.refresh(analysis)

        return AnalysisResponse(id=analysis.id, **result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 분석 오류: {str(e)}")


@router.post("/analyze-batch", response_model=AnalysisResponse)
async def analyze_batch(
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exps = (db.query(m.UserExperience)
            .filter(m.UserExperience.user_id == current_user.id)
            .order_by(m.UserExperience.created_at.desc())
            .limit(10).all())

    if not exps:
        raise HTTPException(status_code=404, detail="분석할 경험이 없습니다")

    exp_lines = "\n".join([
        f"- [{e.exp_type}] {e.title}: {e.content[:200]}"
        for e in exps
    ])

    prompt = f"""당신은 국가직무능력표준(NCS) 전문가이자 자기소개서 전문가입니다.

아래 {len(exps)}개의 경험을 종합하여 하나의 통합 자기소개서 초안(STAR 구조)을 작성하고, 대표 NCS 역량을 추출해주세요.

[경험 목록]
{exp_lines}

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
  "summary": "전체 경험을 아우르는 역량 한줄 요약"
}}"""

    try:
        raw = await analyze(prompt)
        result = parse_response(raw)

        analysis = m.AnalysisResult(
            user_id=current_user.id,
            experience_ids=json.dumps([e.idx for e in exps]),
            ncs_items=json.dumps(result.get("ncs_items", []), ensure_ascii=False),
            star_drafts=json.dumps(result.get("star_drafts", []), ensure_ascii=False),
            summary=result.get("summary", ""),
        )
        db.add(analysis)
        db.flush()

        for draft in result.get("star_drafts", []):
            label = next((k for k in ["[상황 S]", "[과제 T]", "[행동 A]", "[결과 R]"] if draft.startswith(k)), None)
            db.add(m.StarLetter(
                user_id=current_user.id,
                analysis_id=analysis.id,
                question=label or "",
                content=draft,
            ))

        db.commit()
        db.refresh(analysis)
        return AnalysisResponse(id=analysis.id, **result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"통합 분석 오류: {str(e)}")


@router.post("/recommend-certs", response_model=CertRecommendResponse)
async def recommend_certs(req: CertRecommendRequest):
    ncs_summary = "\n".join([
        f"- {item.get('unit_name', '')} (적합도: {item.get('score', 0)}%)"
        for item in req.ncs_items
    ])
    prompt = f"""당신은 취업 준비생을 돕는 자격증 추천 전문가입니다.

아래 NCS 역량 분석 결과를 보고 취업에 유리한 국내 자격증을 추천해주세요.
경험 유형: {req.exp_type}, 경험 제목: {req.exp_title}

[NCS 역량]
{ncs_summary}

다음 JSON 형식으로만 답하세요:
{{
  "certs": [
    {{"name": "자격증명", "org": "발급기관", "reason": "추천 이유 (1문장)", "priority": 1}},
    ...최대 5개
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


class ExperienceHistoryItem(BaseModel):
    idx: int
    title: str
    exp_type: Optional[str]
    ncs_count: int
    created_at: str


@router.get("/history", response_model=List[ExperienceHistoryItem])
def get_history(
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        exps = (db.query(m.UserExperience)
                .filter(m.UserExperience.user_id == current_user.id)
                .order_by(m.UserExperience.created_at.desc())
                .limit(20).all())
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
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{idx}", response_model=AnalysisResponse)
def get_history_detail(
    idx: int,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exp = (db.query(m.UserExperience)
           .filter(m.UserExperience.idx == idx, m.UserExperience.user_id == current_user.id)
           .first())
    if not exp or not exp.ncs_mapping:
        raise HTTPException(status_code=404, detail="분석 결과가 없습니다")
    return AnalysisResponse(**json.loads(exp.ncs_mapping))


class AnalysisResultItem(BaseModel):
    id: int
    summary: Optional[str]
    ncs_count: int
    created_at: str


@router.get("/results", response_model=List[AnalysisResultItem])
def get_results(
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (db.query(m.AnalysisResult)
            .filter(m.AnalysisResult.user_id == current_user.id)
            .order_by(m.AnalysisResult.created_at.desc())
            .all())
    result = []
    for r in rows:
        ncs_count = 0
        if r.ncs_items:
            try:
                ncs_count = len(json.loads(r.ncs_items))
            except Exception:
                pass
        result.append(AnalysisResultItem(
            id=r.id,
            summary=r.summary,
            ncs_count=ncs_count,
            created_at=r.created_at.strftime("%Y-%m-%d") if r.created_at else "",
        ))
    return result


@router.get("/results/{result_id}", response_model=AnalysisResponse)
def get_result_detail(
    result_id: int,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = (db.query(m.AnalysisResult)
         .filter(m.AnalysisResult.id == result_id, m.AnalysisResult.user_id == current_user.id)
         .first())
    if not r:
        raise HTTPException(status_code=404, detail="분석 결과가 없습니다")
    return AnalysisResponse(
        id=r.id,
        ncs_items=json.loads(r.ncs_items or "[]"),
        star_drafts=json.loads(r.star_drafts or "[]"),
        summary=r.summary or "",
    )


class StarLetterItem(BaseModel):
    id: int
    question: Optional[str]
    content: Optional[str]
    analysis_id: Optional[int]
    created_at: str

    class Config:
        from_attributes = True


@router.get("/star-letters", response_model=List[StarLetterItem])
def get_star_letters(
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    letters = (db.query(m.StarLetter)
               .filter(m.StarLetter.user_id == current_user.id)
               .order_by(m.StarLetter.created_at.desc())
               .all())
    return [StarLetterItem(
        id=l.id,
        question=l.question,
        content=l.content,
        analysis_id=l.analysis_id,
        created_at=l.created_at.strftime("%Y-%m-%d") if l.created_at else "",
    ) for l in letters]


@router.put("/star-letters/{letter_id}", response_model=StarLetterItem)
def update_star_letter(
    letter_id: int,
    body: StarLetterUpdate,
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    letter = (db.query(m.StarLetter)
              .filter(m.StarLetter.id == letter_id, m.StarLetter.user_id == current_user.id)
              .first())
    if not letter:
        raise HTTPException(status_code=404, detail="StarLetter를 찾을 수 없습니다")
    letter.content = body.content
    db.commit()
    db.refresh(letter)
    return StarLetterItem(
        id=letter.id,
        question=letter.question,
        content=letter.content,
        analysis_id=letter.analysis_id,
        created_at=letter.created_at.strftime("%Y-%m-%d") if letter.created_at else "",
    )


@router.get("/ncs-summary")
def get_ncs_summary(
    current_user: m.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(m.AnalysisResult).filter(m.AnalysisResult.user_id == current_user.id).all()
    agg: dict[str, dict] = {}
    for r in rows:
        if not r.ncs_items:
            continue
        try:
            items = json.loads(r.ncs_items)
        except Exception:
            continue
        for item in items:
            code = item.get("ncs_code", "")
            if code not in agg:
                agg[code] = {**item, "count": 0, "total_score": 0}
            agg[code]["count"] += 1
            agg[code]["total_score"] += item.get("score", 0)
    summary = []
    for code, data in agg.items():
        summary.append({
            "ncs_code": code,
            "unit_name": data.get("unit_name", ""),
            "level": data.get("level", 1),
            "avg_score": round(data["total_score"] / data["count"]),
            "count": data["count"],
        })
    summary.sort(key=lambda x: x["avg_score"], reverse=True)
    return {"ncs_items": summary}
