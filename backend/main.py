from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
import models, os
from dotenv import load_dotenv
from routers import auth, users, experiences, missions, community, notifications, pdf, ai, senior_personas, survival

load_dotenv()

# DB 마이그레이션 (create_all 이전: users 스키마 정규화)
def _pre_migrate():
    from sqlalchemy import text
    from database import SessionLocal
    db = SessionLocal()
    for sql in [
        # PK 컬럼명 통일
        "ALTER TABLE users CHANGE idx id INT NOT NULL AUTO_INCREMENT",
        # email 컬럼 추가 (없는 경우)
        "ALTER TABLE users ADD COLUMN email VARCHAR(255)",
        # user_id(이메일값)를 email로 복사
        "UPDATE users SET email = user_id WHERE email IS NULL AND user_id LIKE '%@%'",
        # email unique 인덱스
        "ALTER TABLE users ADD UNIQUE INDEX uq_users_email (email)",
        # password → password_hash
        "ALTER TABLE users CHANGE password password_hash VARCHAR(255)",
        # 누락 컬럼 추가
        "ALTER TABLE users ADD COLUMN job_interest VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN gap_start_date VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN profile_image VARCHAR(500)",
        "ALTER TABLE users ADD COLUMN phone VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(20) DEFAULT 'local'",
        "ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL",
        "ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT NOW()",
    ]:
        try:
            db.execute(text(sql))
            db.commit()
        except Exception:
            pass
    db.close()

_pre_migrate()

# DB 테이블 자동 생성
Base.metadata.create_all(bind=engine)

# DB 마이그레이션
def _migrate():
    from sqlalchemy import text
    from database import SessionLocal
    db = SessionLocal()
    migrations = [
        # user_idx → user_id 컬럼명 수정 (스키마 재설계 이전 버전 호환)
        "ALTER TABLE user_experiences CHANGE user_idx user_id INT",
        # user_id 컬럼 추가 (테이블이 새로 생성된 경우)
        "ALTER TABLE user_experiences ADD COLUMN user_id INT",
        # ncs_mapping 컬럼 추가
        "ALTER TABLE user_experiences ADD COLUMN ncs_mapping TEXT",
    ]
    for sql in migrations:
        try:
            db.execute(text(sql))
            db.commit()
        except Exception:
            pass
    db.close()

_migrate()

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
app.include_router(survival.router)

@app.get("/")
def root():
    return {"message": "Pause to Pass API 서버 실행 중 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}
