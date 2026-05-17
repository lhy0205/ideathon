from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

router = APIRouter(prefix="/pdf", tags=["pdf"])

ORANGE = colors.HexColor("#C75B3A")
ORANGE_LIGHT = colors.HexColor("#FDF3EE")
ORANGE_MID = colors.HexColor("#E8956C")
GRAY = colors.HexColor("#555555")
LIGHT_BORDER = colors.HexColor("#E8D5CB")

def _register_font() -> str:
    candidates = [
        "C:\\Windows\\Fonts\\malgun.ttf",
        "C:\\Windows\\Fonts\\NanumGothic.ttf",
        "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
        "/System/Library/Fonts/AppleGothic.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont("KR", path))
                return "KR"
            except Exception:
                continue
    return "Helvetica"

FONT = _register_font()

def _style(name, **kwargs) -> ParagraphStyle:
    base = dict(fontName=FONT, fontSize=10, leading=14, textColor=colors.HexColor("#2D2017"))
    base.update(kwargs)
    return ParagraphStyle(name, **base)

H1 = _style("h1", fontSize=20, leading=26, textColor=ORANGE, spaceAfter=4)
H2 = _style("h2", fontSize=13, leading=18, textColor=ORANGE, spaceBefore=10, spaceAfter=4)
BODY = _style("body", fontSize=9, leading=14, spaceAfter=2)
SMALL = _style("small", fontSize=8, leading=12, textColor=GRAY)
LABEL = _style("label", fontSize=8, leading=12, textColor=ORANGE)
CELL = _style("cell", fontSize=8, leading=12)

# ── Request schema ─────────────────────────────────────────────────────────────

class NCSItem(BaseModel):
    ncs_code: str = ""
    unit_name: str = ""
    level: int = 3
    score: int = 75

class CertItem(BaseModel):
    name: str
    status: str
    exam_date: Optional[str] = ""
    pass_date: Optional[str] = ""

class ExperienceItem(BaseModel):
    exp_type: str = ""
    title: str = ""

class AiCertItem(BaseModel):
    name: str = ""
    org: Optional[str] = ""
    reason: Optional[str] = ""
    priority: Optional[int] = 1

class PDFRequest(BaseModel):
    user_name: Optional[str] = "사용자"
    summary: Optional[str] = ""
    ncs_items: Optional[List[NCSItem]] = []
    star_drafts: Optional[List[str]] = []
    certs: Optional[List[CertItem]] = []
    experiences: Optional[List[ExperienceItem]] = []
    ai_certs: Optional[List[AiCertItem]] = []
    missions_active_days: Optional[int] = 0
    # report_settings 기반 섹션 포함 여부
    show_ncs: Optional[bool] = True
    show_cert: Optional[bool] = True
    show_experience: Optional[bool] = True
    show_mission: Optional[bool] = True
    show_experiences: Optional[bool] = True
    show_ai_certs: Optional[bool] = True

# ── Table helpers ──────────────────────────────────────────────────────────────

def _ncs_table(items: List[NCSItem]):
    if not items:
        return Paragraph("NCS 역량 분석 결과가 없습니다.", SMALL)

    header = ["NCS 코드", "역량명", "숙련도", "점수"]
    rows = [header]
    for it in items:
        stars = "★" * it.level + "☆" * (5 - it.level)
        rows.append([it.ncs_code or "-", it.unit_name or "-", stars, f"{it.score}점"])

    t = Table(rows, colWidths=[35*mm, 75*mm, 30*mm, 25*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE_LIGHT),
        ("TEXTCOLOR",  (0, 0), (-1, 0), ORANGE),
        ("FONTNAME",   (0, 0), (-1, -1), FONT),
        ("FONTSIZE",   (0, 0), (-1, -1), 8),
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
        ("ALIGN",      (1, 1), (1, -1), "LEFT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ORANGE_LIGHT]),
        ("GRID",       (0, 0), (-1, -1), 0.5, LIGHT_BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t

def _experience_table(experiences: List[ExperienceItem]):
    if not experiences:
        return Paragraph("입력된 경험이 없습니다.", SMALL)
    header = ["유형", "경험 제목"]
    rows = [header] + [[e.exp_type or "-", e.title or "-"] for e in experiences]
    t = Table(rows, colWidths=[35*mm, 130*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE_LIGHT),
        ("TEXTCOLOR",  (0, 0), (-1, 0), ORANGE),
        ("FONTNAME",   (0, 0), (-1, -1), FONT),
        ("FONTSIZE",   (0, 0), (-1, -1), 8),
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
        ("ALIGN",      (1, 1), (1, -1), "LEFT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ORANGE_LIGHT]),
        ("GRID",       (0, 0), (-1, -1), 0.5, LIGHT_BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t

def _ai_cert_table(ai_certs: List[AiCertItem]):
    if not ai_certs:
        return Paragraph("AI 추천 자격증 정보가 없습니다.", SMALL)
    PRIORITY_MAP = {1: "★ 1순위", 2: "2순위", 3: "3순위", 4: "4순위", 5: "5순위"}
    header = ["순위", "자격증명", "발급기관", "추천 이유"]
    rows = [header]
    for c in ai_certs:
        rows.append([
            PRIORITY_MAP.get(c.priority, f"{c.priority}순위"),
            c.name or "-",
            c.org or "-",
            c.reason or "-",
        ])
    t = Table(rows, colWidths=[18*mm, 32*mm, 38*mm, 77*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE_LIGHT),
        ("TEXTCOLOR",  (0, 0), (-1, 0), ORANGE),
        ("FONTNAME",   (0, 0), (-1, -1), FONT),
        ("FONTSIZE",   (0, 0), (-1, -1), 8),
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
        ("ALIGN",      (3, 1), (3, -1), "LEFT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ORANGE_LIGHT]),
        ("GRID",       (0, 0), (-1, -1), 0.5, LIGHT_BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("WORDWRAP",   (3, 1), (3, -1), "CJK"),
    ]))
    return t

def _cert_table(certs: List[CertItem]):
    if not certs:
        return Paragraph("자격증 정보가 없습니다.", SMALL)

    header = ["자격증명", "상태", "시험일", "합격일"]
    rows = [header]
    for c in certs:
        rows.append([c.name, c.status, c.exam_date or "-", c.pass_date or "-"])

    t = Table(rows, colWidths=[65*mm, 20*mm, 30*mm, 30*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE_LIGHT),
        ("TEXTCOLOR",  (0, 0), (-1, 0), ORANGE),
        ("FONTNAME",   (0, 0), (-1, -1), FONT),
        ("FONTSIZE",   (0, 0), (-1, -1), 8),
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
        ("ALIGN",      (0, 1), (0, -1), "LEFT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ORANGE_LIGHT]),
        ("GRID",       (0, 0), (-1, -1), 0.5, LIGHT_BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t

# ── PDF build ──────────────────────────────────────────────────────────────────

def _build_pdf(req: PDFRequest) -> BytesIO:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=20*mm,
    )

    story = []

    # ── 헤더 ──────────────────────────────────────────────────────────────────
    story.append(Paragraph("Pause to Pass · 포트폴리오 리포트", H1))
    story.append(Paragraph(
        f"{req.user_name}님 · 생성일: {datetime.now().strftime('%Y년 %m월 %d일')}",
        SMALL,
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=ORANGE, spaceAfter=8))

    # ── 역량 요약 ─────────────────────────────────────────────────────────────
    if req.summary:
        story.append(Paragraph("역량 한줄 요약", H2))
        summary_table = Table(
            [[Paragraph(req.summary, _style("sum", fontSize=10, leading=15, textColor=ORANGE))]],
            colWidths=[170*mm],
        )
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), ORANGE_LIGHT),
            ("BOX",        (0, 0), (-1, -1), 1, ORANGE),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 6))

    # ── NCS 역량 ──────────────────────────────────────────────────────────────
    if req.show_ncs:
        story.append(Paragraph("NCS 역량 분석 결과", H2))
        story.append(HRFlowable(width="100%", thickness=1, color=ORANGE, spaceAfter=4))
        story.append(_ncs_table(req.ncs_items or []))
        story.append(Spacer(1, 8))

    # ── 경험 목록 ─────────────────────────────────────────────────────────────
    if req.show_experiences and req.experiences:
        story.append(Paragraph("경험 목록", H2))
        story.append(HRFlowable(width="100%", thickness=1, color=ORANGE, spaceAfter=4))
        story.append(_experience_table(req.experiences))
        story.append(Spacer(1, 8))

    # ── STAR 자기소개서 ───────────────────────────────────────────────────────
    if req.show_experience and req.star_drafts:
        story.append(Paragraph("자기소개서 추천 문구", H2))
        story.append(HRFlowable(width="100%", thickness=1, color=ORANGE, spaceAfter=4))
        STAR_LABELS = ["[상황 S]", "[과제 T]", "[행동 A]", "[결과 R]"]
        for i, draft in enumerate(req.star_drafts):
            label = STAR_LABELS[i] if i < len(STAR_LABELS) else f"[{i+1}]"
            story.append(Paragraph(label, LABEL))
            story.append(Paragraph(draft, BODY))
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 4))

    # ── AI 추천 자격증 ────────────────────────────────────────────────────────
    if req.show_ai_certs and req.ai_certs:
        story.append(Paragraph("AI 추천 자격증", H2))
        story.append(HRFlowable(width="100%", thickness=1, color=ORANGE, spaceAfter=4))
        story.append(_ai_cert_table(req.ai_certs))
        story.append(Spacer(1, 8))

    # ── 자격증 이력 ───────────────────────────────────────────────────────────
    if req.show_cert and req.certs:
        story.append(Paragraph("자격증 이력", H2))
        story.append(HRFlowable(width="100%", thickness=1, color=ORANGE, spaceAfter=4))
        story.append(_cert_table(req.certs))
        story.append(Spacer(1, 8))

    # ── 미션 달성 현황 ────────────────────────────────────────────────────────
    if req.show_mission and req.missions_active_days:
        story.append(Paragraph("미션 달성 현황", H2))
        story.append(HRFlowable(width="100%", thickness=1, color=ORANGE, spaceAfter=4))
        mission_table = Table(
            [[Paragraph(f"총 활동일: {req.missions_active_days}일", _style("ms", fontSize=10, leading=15, textColor=ORANGE))]],
            colWidths=[170*mm],
        )
        mission_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), ORANGE_LIGHT),
            ("BOX",        (0, 0), (-1, -1), 1, ORANGE),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ]))
        story.append(mission_table)
        story.append(Spacer(1, 8))

    # ── 푸터 ──────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=LIGHT_BORDER, spaceBefore=12))
    story.append(Paragraph(
        "본 리포트는 Pause to Pass 서비스에서 자동 생성되었습니다.",
        _style("footer", fontSize=7, textColor=GRAY),
    ))

    doc.build(story)
    buf.seek(0)
    return buf

# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.post("/generate")
def generate_pdf(req: PDFRequest):
    buf = _build_pdf(req)
    filename = f"portfolio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
