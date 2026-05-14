from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

if os.getenv('DB_PORT'):
    DB_URL = (
        f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
        f"?charset=utf8mb4"
    )
    engine = create_engine(DB_URL, echo=False)
else:
    DB_URL = "sqlite:///./local.db"
    engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    from models import SeniorPersona
    db = SessionLocal()
    try:
        if db.query(SeniorPersona).count() == 0:
            seniors = [
                {'user_id': 'senior_kim_a', 'name': '김A', 'career_path': '문과 → 데이터 분석 취업', 'gap_period': 7, 'acquired_certs': 'ADsP, SQLD', 'employment_field': '데이터 분석', 'similarity_score': 94},
                {'user_id': 'senior_lee_b', 'name': '이B', 'career_path': '비전공자 SQL 독학 → SI기업', 'gap_period': 6, 'acquired_certs': '정처기, SQLD', 'employment_field': '백엔드 개발', 'similarity_score': 89},
                {'user_id': 'senior_park_c', 'name': '박C', 'career_path': '경영학 → 스타트업 기획', 'gap_period': 5, 'acquired_certs': 'ADsP', 'employment_field': '서비스 기획', 'similarity_score': 81},
            ]
            for s in seniors:
                db.add(SeniorPersona(**s))
            db.commit()
    except Exception as e:
        print(f"DB 초기화 에러: {e}")
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
