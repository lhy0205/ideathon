from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
import models, os
from dotenv import load_dotenv
from routers import auth, users, experiences, missions, community, notifications, pdf, ai, senior_personas, survival, certifications, cert_proofs, report_settings

load_dotenv()

def _migrate():
    from sqlalchemy import text
    from database import SessionLocal
    db = SessionLocal()
    for sql in [
        "ALTER TABLE users ADD COLUMN session_token VARCHAR(255) NULL",
        "ALTER TABLE users ADD UNIQUE INDEX uq_session_token (session_token)",
        "ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL",
        "ALTER TABLE users ADD COLUMN certifications TEXT NULL",
        "ALTER TABLE users MODIFY COLUMN name VARCHAR(100) NULL",
    ]:
        try:
            db.execute(text(sql))
            db.commit()
        except Exception:
            pass
    db.close()

_migrate()

# DB 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pause to Pass API", version="1.0.0")

# 외부 접속 시 backend/.env 파일에서 수정
# FRONTEND_URL=https://프론트ngrok주소.ngrok.io
_origins = [o.strip() for o in os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")]
if os.getenv("ENV") != "production":
    _origins += ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 업로드 파일 정적 서빙
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# 라우터 등록
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(experiences.router)
app.include_router(missions.router)
app.include_router(community.router)
app.include_router(notifications.router)
app.include_router(pdf.router)
app.include_router(ai.router)
app.include_router(senior_personas.router)
app.include_router(survival.router)
app.include_router(certifications.router)
app.include_router(cert_proofs.router)
app.include_router(report_settings.router)

@app.get("/")
def root():
    return {"message": "Pause to Pass API 서버 실행 중 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}
