from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import json, re, traceback, logging
from rag.exaone_client import analyze
from database import get_db
from dependencies import get_current_user
import models as m

logger = logging.getLogger(__name__)

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
    intro: Optional[str] = ""
    aspiration: Optional[str] = ""


class CertRecommendRequest(BaseModel):
    ncs_items: list[dict]
    exp_type: Optional[str] = ""
    exp_title: Optional[str] = ""
    count: Optional[int] = 5


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
    start = req.start_date or ""
    end = req.end_date or ""
    if start and end:
        period_line = f"\n- 기간: {start} ~ {end}"
    elif start:
        period_line = f"\n- 기간: {start} ~ 현재"
    else:
        period_line = ""
    return f"""당신은 국가직무능력표준(NCS) 전문가입니다.
{rag_section}
[경험 정보]
- 유형: {req.exp_type}
- 제목: {req.title}{period_line}
- 내용: {req.content}
- 역량 메모: {req.memo}

다음 JSON 형식으로만 답하세요 (다른 말 없이):
{{
  "ncs_items": [
    {{"ncs_code": "NCS 코드", "unit_name": "역량명", "level": 숙련도(1-5), "score": 점수(0-100)}},
    ...최대 5개
  ],
  "intro": "이 경험을 한 사람을 소개하는 2~3문장. 어떤 경험을 얼마나 했는지 구체적으로.",
  "star_drafts": [
    "[상황 S] 3~4문장. 언제, 어디서, 어떤 상황이었는지 구체적 배경을 서술. 팀 규모나 환경 등 맥락 포함.",
    "[과제 T] 2~3문장. 그 상황에서 본인이 맡은 역할과 해결해야 했던 핵심 과제를 구체적으로 서술.",
    "[행동 A] 4~5문장. 과제를 해결하기 위해 취한 구체적인 행동들을 상세히 서술. 어떤 방법을 선택했고 왜 그 방법을 택했는지 포함. 가능하면 수치나 빈도 포함.",
    "[결과 R] 2~3문장. 행동의 결과와 그 경험에서 얻은 역량 또는 교훈을 서술. 수치화된 성과가 있다면 포함."
  ],
  "aspiration": "이 경험을 바탕으로 앞으로 어떻게 성장하고 싶은지 2~3문장. 직무 연관성 포함.",
  "summary": "역량 한줄 요약"
}}"""


def _try_json(raw: str):
    """JSON 파싱 시도 - 일반 → 줄바꿈 이스케이프 → 제어문자 제거 순으로 시도"""
    for attempt in (raw, re.sub(r'\r\n|\r', '\n', raw)):
        try:
            return json.loads(attempt)
        except Exception:
            pass
    # 문자열 내부 리터럴 줄바꿈 이스케이프 처리
    try:
        fixed = re.sub(r'(?<=[^\\])\n', '\\n', raw)
        return json.loads(fixed)
    except Exception:
        pass
    return None


def parse_response(text: str) -> dict:
    candidates = []

    # 전략 1: 마크다운 코드블록 안의 JSON
    for m in re.finditer(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', text):
        candidates.append(m.group(1).strip())

    # 전략 2: 텍스트 전체에서 { } 블록 추출 (greedy)
    m = re.search(r'\{[\s\S]*\}', text)
    if m:
        candidates.append(m.group())

    for raw in candidates:
        parsed = _try_json(raw)
        if not parsed or not isinstance(parsed, dict):
            continue
        # ncs_items 문자열 → 리스트
        if isinstance(parsed.get("ncs_items"), str):
            try:
                parsed["ncs_items"] = json.loads(parsed["ncs_items"])
            except Exception:
                parsed["ncs_items"] = []
        # star_drafts 문자열 → 리스트
        if isinstance(parsed.get("star_drafts"), str):
            try:
                parsed["star_drafts"] = json.loads(parsed["star_drafts"])
            except Exception:
                parsed["star_drafts"] = [parsed["star_drafts"]]
        # 필수 키 확인
        if "ncs_items" in parsed or "star_drafts" in parsed:
            return parsed

    # 모든 전략 실패 → 최소 fallback (raw text를 star_drafts에 노출하지 않음)
    return {
        "ncs_items": [],
        "star_drafts": ["AI 응답 파싱에 실패했습니다. 다시 시도해주세요."],
        "summary": "분석 결과를 불러오지 못했습니다.",
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

        return AnalysisResponse(
            id=analysis.id,
            ncs_items=result.get("ncs_items", []),
            star_drafts=result.get("star_drafts", []),
            summary=result.get("summary", ""),
            intro=result.get("intro", ""),
            aspiration=result.get("aspiration", ""),
        )

    except Exception as e:
        logger.error("analyze_experience 오류:\n%s", traceback.format_exc())
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


_TYPE_CERT_HINT = {
    "아르바이트":    "아르바이트 직무(서비스, 외식, 유통, 물류, 사무 등)와 NCS 역량에 맞는 자격증을 추천하세요. 서비스·식음료 관련이면 서비스경영사·유통관리사, 사무 관련이면 컴퓨터활용능력·전산회계, 어학 역량이 높으면 TOEIC·OPIc 등 실제 직무와 연관된 자격증을 우선하세요.",
    "인턴":          "인턴 직무와 NCS 역량에 연관된 자격증을 우선 추천하세요. IT/개발이면 SQLD·ADsP·AWS, 경영/기획이면 ERP·사회조사분석사, 데이터면 빅데이터분석기사 등 실제 업무와 연결되는 자격증을 선택하세요.",
    "동아리/학생회": "활동 내용과 NCS 역량에 맞는 자격증을 추천하세요. 기획·마케팅 역량이면 사회조사분석사, IT 관련이면 SQLD·ADsP, 어학 역량이면 TOEIC·OPIc 등 구체적 활동과 연결하세요.",
    "프리랜서":      "프리랜서 직종과 NCS 역량에 직결되는 전문 자격증을 추천하세요. IT면 SQLD·AWS·ADsP, 디자인/기획이면 관련 전문 자격증, 어학이면 TOEIC·OPIc을 우선하세요.",
    "봉사활동":      "봉사 분야와 NCS 역량에 맞는 자격증을 추천하세요. 사회복지·상담 관련이면 사회조사분석사, 국제 활동이면 어학(TOEIC·OPIc), 행정 지원이면 컴퓨터활용능력을 고려하세요.",
    "개인 프로젝트": "프로젝트 내용과 NCS 역량에 연관된 자격증을 추천하세요. 데이터/AI면 ADsP·빅데이터분석기사·SQLD, 클라우드/개발이면 AWS·Azure, 기획이면 사회조사분석사를 우선하세요.",
    "독학/공부":     "학습 분야와 NCS 역량에 직결되는 자격증을 추천하세요. 학습 내용을 공식적으로 인정받을 수 있는 가장 적합한 자격증을 선택하세요.",
    "기타":          "NCS 역량 점수가 높은 분야와 가장 연관성 높은 자격증을 추천하세요.",
}


@router.post("/recommend-certs", response_model=CertRecommendResponse)
async def recommend_certs(req: CertRecommendRequest):
    ncs_summary = "\n".join([
        f"- {item.get('unit_name', '')} (적합도: {item.get('score', 0)}%)"
        for item in req.ncs_items
    ])

    type_hint = _TYPE_CERT_HINT.get(req.exp_type or "", "NCS 역량과 가장 연관성 높은 자격증을 추천하세요.")

    count = max(1, min(7, req.count or 5))
    prompt = f"""당신은 취업 준비생을 돕는 자격증 추천 전문가입니다.

아래 NCS 역량 분석 결과를 보고 취업에 유리한 국내 자격증을 추천해주세요.
경험 유형: {req.exp_type}, 경험 제목: {req.exp_title}

[추천 방향]
{type_hint}

[NCS 역량]
{ncs_summary}

다음 JSON 형식으로만 답하세요:
{{
  "certs": [
    {{"name": "자격증명", "org": "발급기관", "reason": "추천 이유 (1문장)", "priority": 1}},
    ...정확히 {count}개
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


class SurvivalInputValidation(BaseModel):
    gap_period: Optional[str] = ""
    department: Optional[str] = ""
    certifications: Optional[str] = ""
    job_interest: Optional[str] = ""


@router.post("/validate-survival-input")
async def validate_survival_input(req: SurvivalInputValidation):
    """생존 진단 입력값을 AI로 검증"""
    errors = []

    # 1. gap_period 검증: 숫자만 허용 (1일, 5개월, 1년 등)
    if req.gap_period and req.gap_period.strip():
        import re
        if not re.search(r'\d', req.gap_period):
            errors.append("공백기: 숫자를 포함해야 합니다 (예: 1일, 5개월, 1년)")
        elif not re.search(r'(일|개월|년)', req.gap_period):
            errors.append("공백기: 일, 개월, 년 중 하나를 포함해야 합니다")

    # 2. AI를 사용해서 department, certifications, job_interest 검증
    if (req.department and req.department.strip()) or \
       (req.certifications and req.certifications.strip()) or \
       (req.job_interest and req.job_interest.strip()):

        prompt = f"""당신은 한국 대학 학과, 자격증, 직무 정보 전문가입니다.
아래 입력값들이 실제로 존재하는 것인지 검증해주세요.

[입력값]
- 학과: {req.department or "없음"}
- 자격증: {req.certifications or "없음"}
- 희망직무: {req.job_interest or "없음"}

다음 JSON 형식으로만 답하세요 (다른 말 없이):
{{
  "department_valid": true/false,
  "department_msg": "학과에 대한 피드백 (존재하지 않으면 왜인지 설명)",
  "certifications_valid": true/false,
  "certifications_msg": "자격증에 대한 피드백",
  "job_interest_valid": true/false,
  "job_interest_msg": "희망직무에 대한 피드백"
}}"""

        try:
            result = await analyze(prompt)
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
                # JSON 파싱 실패 시 기본 검증 스킵 (사용자가 진행 가능)
                pass
        except Exception as e:
            logger.error(f"AI validation error: {e}")
            # AI 실패 시 계속 진행 가능
            pass

    return {
        "valid": len(errors) == 0,
        "errors": errors
    }
