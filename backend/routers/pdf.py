from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models
from io import BytesIO
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/pdf", tags=["pdf"])

# ── Request schema ──
class AnalysisReportRequest(BaseModel):
    experience_id: Optional[int] = None
    analysis_result: Optional[dict] = None   # {ncs_items, star_drafts, summary}
    user_name: Optional[str] = None

# ── Dummy fallback data ──
_DUMMY_ANALYSIS = {
    "ncs_items": [
        {"ncs_code": "NCS 02010101", "unit_name": "판매관리",  "level": 3, "score": 88},
        {"ncs_code": "NCS 02010201", "unit_name": "고객상담",  "level": 2, "score": 76},
        {"ncs_code": "NCS 06010101", "unit_name": "물류관리",  "level": 2, "score": 62},
        {"ncs_code": "NCS 03010101", "unit_name": "현금관리",  "level": 2, "score": 58},
    ],
    "star_drafts": [
        "[상황 S] 야간에 혼자 매장을 운영하는 환경에서 재고 오류가 발생했습니다.",
        "[과제 T] 다음 날 발주 전까지 정확한 실재고를 파악하고 손실 원인을 규명해야 했습니다.",
        "[행동 A] 전산 기록과 실물 재고를 항목별로 대조하고, 유통기한 관리 체계를 새로 설계했습니다.",
        "[결과 R] 재고 오차율을 기존 대비 40% 줄이고, 이 방식을 팀 전체 표준으로 채택했습니다.",
    ],
    "summary": "물류·판매 운영 전반에 걸친 실무 역량 보유자",
}

_DUMMY_CERTS = [
    {"name": "ADsP (데이터분석준전문가)", "status": "취득 완료", "date": "2024-03"},
    {"name": "SQLD (SQL 개발자)",         "status": "준비중",   "date": "-"},
]

_DUMMY_USER = {"name": "김지현", "job_interest": "데이터 분석", "gap_period": "5개월"}
_DUMMY_EXP  = {"title": "편의점 아르바이트 2년", "exp_type": "아르바이트"}


# ─────────────────────────────────────────────
# GET /pdf/growth-report  (기존, 모델명 수정)
# ─────────────────────────────────────────────
@router.get("/growth-report")
def generate_growth_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    experiences = db.query(models.UserExperience).filter(
        models.UserExperience.user_idx == current_user.idx
    ).all()

    html = _build_report_html(current_user, experiences)

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
    except Exception as e:
        return {"error": f"weasyprint 오류: {str(e)}"}

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=growth_report_{current_user.idx}.pdf"},
    )


# ─────────────────────────────────────────────
# POST /pdf/analysis-report  (신규)
# ─────────────────────────────────────────────
@router.post("/analysis-report")
def generate_analysis_report(
    body: AnalysisReportRequest,
    db: Session = Depends(get_db),
):
    # 경험 데이터
    exp_data = _DUMMY_EXP.copy()
    if body.experience_id:
        exp = db.query(models.UserExperience).filter(
            models.UserExperience.idx == body.experience_id
        ).first()
        if exp:
            exp_data = {"title": exp.title, "exp_type": exp.exp_type or "경험"}

    # AI 분석 결과 (없으면 더미)
    analysis = body.analysis_result if body.analysis_result else _DUMMY_ANALYSIS

    # 사용자 정보 (더미 fallback)
    user_info = {
        "name":         body.user_name or _DUMMY_USER["name"],
        "job_interest": _DUMMY_USER["job_interest"],
        "gap_period":   _DUMMY_USER["gap_period"],
    }

    html = _build_analysis_html(user_info, exp_data, analysis, _DUMMY_CERTS)

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
    except Exception as e:
        return {"error": f"weasyprint 오류: {str(e)}"}

    fname = f"analysis_report_{body.experience_id or 'demo'}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )


# ─────────────────────────────────────────────
# HTML builders
# ─────────────────────────────────────────────
_BASE_STYLE = """
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
    background: #fff;
    color: #2d2017;
    padding: 48px 52px;
    font-size: 13px;
    line-height: 1.6;
  }
  /* ── Header ── */
  .doc-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    border-bottom: 3px solid #c4603d;
    padding-bottom: 16px;
    margin-bottom: 32px;
  }
  .brand { font-size: 22px; font-weight: 800; color: #c4603d; }
  .brand-sub { font-size: 11px; color: #888; margin-top: 2px; }
  .doc-meta { font-size: 11px; color: #888; text-align: right; }
  /* ── Section ── */
  .section { margin-bottom: 36px; }
  .section-title {
    font-size: 15px; font-weight: 800; color: #c4603d;
    border-left: 4px solid #c4603d;
    padding-left: 10px;
    margin-bottom: 16px;
  }
  /* ── User info ── */
  .user-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .info-box {
    background: #fdf5f1;
    border-radius: 8px;
    padding: 14px 16px;
  }
  .info-label { font-size: 10px; color: #c4603d; font-weight: 700; letter-spacing: .5px; margin-bottom: 4px; }
  .info-value { font-size: 14px; font-weight: 700; color: #3b1a0e; }
  /* ── NCS cards ── */
  .ncs-list { display: flex; flex-direction: column; gap: 10px; }
  .ncs-card {
    background: #fdf9f7;
    border-radius: 8px;
    padding: 14px 16px;
    border-left: 3px solid #c4603d;
  }
  .ncs-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .ncs-name { font-size: 14px; font-weight: 700; color: #3b1a0e; }
  .ncs-badge {
    font-size: 10px;
    background: #c4603d;
    color: #fff;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 700;
  }
  .ncs-code { font-size: 10px; color: #aaa; margin-bottom: 6px; }
  .bar-wrap { background: #e8ddd8; border-radius: 4px; height: 8px; width: 100%; }
  .bar-fill { background: #c4603d; border-radius: 4px; height: 8px; }
  .bar-meta {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #888;
    margin-top: 4px;
  }
  /* ── STAR ── */
  .star-list { display: flex; flex-direction: column; gap: 10px; }
  .star-item {
    background: #fdf9f7;
    border-radius: 8px;
    padding: 14px 16px;
  }
  .star-label {
    font-size: 11px;
    font-weight: 800;
    color: #c4603d;
    margin-bottom: 4px;
  }
  .star-text { font-size: 13px; color: #3b1a0e; }
  /* ── Certs ── */
  .cert-table { width: 100%; border-collapse: collapse; }
  .cert-table th {
    background: #fdf5f1;
    color: #c4603d;
    font-size: 11px;
    font-weight: 700;
    padding: 10px 14px;
    text-align: left;
    border-bottom: 2px solid #e8ddd8;
  }
  .cert-table td {
    padding: 10px 14px;
    font-size: 13px;
    border-bottom: 1px solid #e8ddd8;
    color: #3b1a0e;
  }
  .status-done  { color: #2d7a4f; font-weight: 700; }
  .status-ready { color: #c4603d; font-weight: 700; }
  /* ── Summary ── */
  .summary-box {
    background: #3b1a0e;
    color: #fff;
    border-radius: 10px;
    padding: 18px 22px;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.7;
  }
  /* ── Footer ── */
  .doc-footer {
    margin-top: 40px;
    border-top: 1px solid #e8ddd8;
    padding-top: 12px;
    font-size: 10px;
    color: #bbb;
    text-align: center;
  }
"""


def _build_analysis_html(user_info: dict, exp_data: dict, analysis: dict, certs: list) -> str:
    now_str = datetime.now().strftime("%Y년 %m월 %d일")

    # ── 섹션 1: 사용자 기본 정보 ──
    user_section = f"""
    <div class="section">
      <p class="section-title">사용자 기본 정보</p>
      <div class="user-grid">
        <div class="info-box">
          <p class="info-label">이름</p>
          <p class="info-value">{user_info['name']}</p>
        </div>
        <div class="info-box">
          <p class="info-label">목표 직무</p>
          <p class="info-value">{user_info['job_interest']}</p>
        </div>
        <div class="info-box">
          <p class="info-label">공백 기간</p>
          <p class="info-value">{user_info['gap_period']}</p>
        </div>
      </div>
      <div style="margin-top:12px; background:#fdf5f1; border-radius:8px; padding:14px 16px;">
        <p class="info-label">분석 경험</p>
        <p class="info-value">{exp_data['title']}</p>
        <p style="font-size:11px;color:#888;margin-top:2px;">{exp_data.get('exp_type','')}</p>
      </div>
    </div>
    """

    # ── 섹션 2: NCS 역량 카드 ──
    ncs_cards = ""
    for item in analysis.get("ncs_items", []):
        score = item.get("score", 0)
        level = item.get("level", 1)
        ncs_cards += f"""
        <div class="ncs-card">
          <div class="ncs-top">
            <span class="ncs-name">{item.get('unit_name','')}</span>
            <span class="ncs-badge">숙련도 Lv.{level}</span>
          </div>
          <p class="ncs-code">{item.get('ncs_code','')}</p>
          <div class="bar-wrap">
            <div class="bar-fill" style="width:{score}%;"></div>
          </div>
          <div class="bar-meta"><span>0%</span><span>{score}%</span><span>100%</span></div>
        </div>
        """

    ncs_section = f"""
    <div class="section">
      <p class="section-title">NCS 역량 카드</p>
      <div class="ncs-list">{ncs_cards}</div>
    </div>
    """

    # ── 섹션 3: STAR 자기소개서 초안 ──
    label_map = {"[상황 S]": "상황 (Situation)", "[과제 T]": "과제 (Task)",
                 "[행동 A]": "행동 (Action)",  "[결과 R]": "결과 (Result)"}
    star_items = ""
    for draft in analysis.get("star_drafts", []):
        label = draft[:6] if draft.startswith("[") else ""
        text  = draft[7:].strip() if label else draft
        display_label = label_map.get(label, label)
        star_items += f"""
        <div class="star-item">
          <p class="star-label">{display_label}</p>
          <p class="star-text">{text}</p>
        </div>
        """

    star_section = f"""
    <div class="section">
      <p class="section-title">STAR 자기소개서 초안</p>
      <div class="star-list">{star_items}</div>
    </div>
    """

    # ── 섹션 4: 자격증 이력 ──
    cert_rows = ""
    for c in certs:
        status_class = "status-done" if "완료" in c["status"] else "status-ready"
        cert_rows += f"""
        <tr>
          <td>{c['name']}</td>
          <td class="{status_class}">{c['status']}</td>
          <td>{c['date']}</td>
        </tr>
        """

    cert_section = f"""
    <div class="section">
      <p class="section-title">자격증 이력</p>
      <table class="cert-table">
        <tr><th>자격증명</th><th>상태</th><th>취득일</th></tr>
        {cert_rows}
      </table>
    </div>
    """

    # ── 역량 요약 ──
    summary = analysis.get("summary", "")
    summary_section = f"""
    <div class="section">
      <p class="section-title">역량 종합 요약</p>
      <div class="summary-box">{summary}</div>
    </div>
    """ if summary else ""

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <style>{_BASE_STYLE}</style>
</head>
<body>
  <div class="doc-header">
    <div>
      <p class="brand">Pause to Pass</p>
      <p class="brand-sub">공백기 NCS 역량 분석 리포트</p>
    </div>
    <div class="doc-meta">
      <p>생성일: {now_str}</p>
      <p>분석 경험: {exp_data['title']}</p>
    </div>
  </div>

  {user_section}
  {ncs_section}
  {star_section}
  {cert_section}
  {summary_section}

  <div class="doc-footer">
    본 리포트는 Pause to Pass AI 분석 시스템에 의해 자동 생성되었습니다.
    NCS 매핑 결과는 참고용이며 실제 채용 기준과 다를 수 있습니다.
  </div>
</body>
</html>"""


def _build_report_html(user, experiences):
    exp_rows = "".join(
        f"<tr><td>{e.title}</td><td>{e.exp_type or '-'}</td><td>{e.content[:80] + '...' if e.content and len(e.content) > 80 else (e.content or '-')}</td></tr>"
        for e in experiences
    )
    now_str = datetime.now().strftime("%Y년 %m월 %d일")
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <style>{_BASE_STYLE}
    .stat-row {{ display: flex; gap: 16px; margin-bottom: 32px; }}
    .stat-box {{ flex: 1; background: #fdf5f1; border-radius: 10px; padding: 20px; text-align: center; }}
    .stat-num {{ font-size: 32px; font-weight: 800; color: #c4603d; }}
    .stat-lbl {{ font-size: 12px; color: #888; margin-top: 4px; }}
    table {{ width: 100%; border-collapse: collapse; }}
    th {{ background: #fdf5f1; color: #c4603d; font-size: 11px; font-weight: 700;
          padding: 10px 14px; text-align: left; border-bottom: 2px solid #e8ddd8; }}
    td {{ padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #e8ddd8; }}
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <p class="brand">Pause to Pass</p>
      <p class="brand-sub">성장 리포트</p>
    </div>
    <div class="doc-meta">
      <p>생성일: {now_str}</p>
      <p>{user.name}님</p>
    </div>
  </div>

  <div class="stat-row">
    <div class="stat-box">
      <p class="stat-num">{len(experiences)}</p>
      <p class="stat-lbl">등록 경험</p>
    </div>
    <div class="stat-box">
      <p class="stat-num">{user.gap_period or '-'}</p>
      <p class="stat-lbl">공백 기간</p>
    </div>
    <div class="stat-box">
      <p class="stat-num">{user.interest or '-'}</p>
      <p class="stat-lbl">관심 분야</p>
    </div>
  </div>

  <div class="section">
    <p class="section-title">경험 기록</p>
    <table>
      <tr><th>제목</th><th>유형</th><th>내용 요약</th></tr>
      {exp_rows if exp_rows else '<tr><td colspan="3" style="color:#aaa;text-align:center;">등록된 경험이 없습니다</td></tr>'}
    </table>
  </div>

  <div class="doc-footer">
    본 리포트는 Pause to Pass에 의해 자동 생성되었습니다.
  </div>
</body>
</html>"""
