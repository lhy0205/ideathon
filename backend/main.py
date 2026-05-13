from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
import models, os
from dotenv import load_dotenv
from routers import auth, users, experiences, missions, community, notifications, pdf, ai, senior_personas

load_dotenv()

# DB 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pause to Pass API", version="1.0.0")

# CORS 설정 (React 프론트와 연결)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
    ],
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

@app.get("/")
def root():
    return {"message": "Pause to Pass API 서버 실행 중 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}
