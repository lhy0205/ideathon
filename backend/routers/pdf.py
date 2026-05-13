from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models
from io import BytesIO
from datetime import datetime

router = APIRouter(prefix="/pdf", tags=["pdf"])

@router.get("/growth-report")
def generate_growth_report(db: Session = Depends(get_db),
                            current_user: models.User = Depends(get_current_user)):
    experiences = db.query(models.Experience).filter(
        models.Experience.user_id == current_user.id
    ).all()
    missions = db.query(models.Mission).filter(
        models.Mission.user_id == current_user.id,
        models.Mission.completed == True
    ).all()

    html = _build_report_html(current_user, experiences, missions)

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
    except Exception:
        return {"error": "weasyprint 설치 필요: pip install weasyprint"}

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=growth_report_{current_user.id}.pdf"}
    )

def _build_report_html(user, experiences, missions):
    exp_rows = "".join(
        f"<tr><td>{e.title}</td><td>{e.category or '-'}</td><td>{e.ncs_skills or '-'}</td></tr>"
        for e in experiences
    )
    mission_rows = "".join(
        f"<tr><td>{m.title}</td><td>{m.completed_at.strftime('%Y-%m-%d') if m.completed_at else '-'}</td></tr>"
        for m in missions
    )
    return f"""
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8"/>
      <style>
        body {{ font-family: 'Malgun Gothic', sans-serif; padding: 40px; color: #2D2017; }}
        h1 {{ color: #C75B3A; }} h2 {{ color: #C75B3A; border-bottom: 2px solid #C75B3A; padding-bottom: 6px; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; }}
        th {{ background: #FDF3EE; color: #C75B3A; padding: 10px; text-align: left; }}
        td {{ padding: 10px; border-bottom: 1px solid #E8D5CB; }}
        .header {{ display: flex; justify-content: space-between; margin-bottom: 32px; }}
        .stat {{ background: #FDF3EE; border-radius: 8px; padding: 16px; text-align: center; display: inline-block; width: 30%; }}
        .stat-num {{ font-size: 28px; font-weight: 800; color: #C75B3A; }}
      </style>
    </head>
    <body>
      <h1>Pause to Pass · 성장 리포트</h1>
      <p>{user.name}님 · 생성일: {datetime.now().strftime('%Y년 %m월 %d일')}</p>
      <div>
        <span class="stat"><div class="stat-num">{len(experiences)}</div>경험 기록</span>
        <span class="stat"><div class="stat-num">{len(missions)}</div>완료 미션</span>
      </div>
      <h2>경험 기록</h2>
      <table><tr><th>제목</th><th>카테고리</th><th>NCS 역량</th></tr>{exp_rows}</table>
      <h2>완료한 미션</h2>
      <table><tr><th>미션</th><th>완료일</th></tr>{mission_rows}</table>
    </body>
    </html>
    """
