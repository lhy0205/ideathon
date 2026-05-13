"""Seed senior persona sample data. Run once or rerun safely."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal, Base, engine
from models import SeniorPersona


SENIOR_PERSONAS = [
    {
        "user_id": "senior_kim_a",
        "user_name": "김A",
        "avatar_label": "김A",
        "avatar_color": "#f0ede7",
        "department": "문과",
        "gap_period": "7개월",
        "certifications": "ADsP, SQLD",
        "employment_field": "데이터 분석",
        "employment_company_type": "중견기업",
        "career_path_summary": "문과 -> 데이터 분석 취업",
        "similarity_score": 94.0,
        "is_accepted": True,
        "match_note": "KNN 기준 가장 유사한 합격자",
    },
    {
        "user_id": "senior_lee_b",
        "user_name": "이B",
        "avatar_label": "이B",
        "avatar_color": "#e8f0f7",
        "department": "비전공자",
        "gap_period": "6개월",
        "certifications": "정보처리기사, SQLD",
        "employment_field": "백엔드 개발",
        "employment_company_type": "SI기업",
        "career_path_summary": "비전공자 SQL 독학 -> SI기업",
        "similarity_score": 89.0,
        "is_accepted": True,
        "match_note": "SQL 역량 중심 전환 사례",
    },
    {
        "user_id": "senior_park_c",
        "user_name": "박C",
        "avatar_label": "박C",
        "avatar_color": "#f0f7ee",
        "department": "경영학",
        "gap_period": "5개월",
        "certifications": "ADsP",
        "employment_field": "서비스 기획",
        "employment_company_type": "스타트업",
        "career_path_summary": "경영학 -> 스타트업 기획",
        "similarity_score": 81.0,
        "is_accepted": True,
        "match_note": "기획 직무 전환 사례",
    },
    {
        "user_id": "senior_choi_d",
        "user_name": "최D",
        "avatar_label": "최D",
        "avatar_color": "#fff2dd",
        "department": "통계학",
        "gap_period": "4개월",
        "certifications": "빅데이터분석기사, SQLD",
        "employment_field": "데이터 엔지니어링",
        "employment_company_type": "대기업",
        "career_path_summary": "통계학 -> 데이터 엔지니어링",
        "similarity_score": 86.0,
        "is_accepted": True,
        "match_note": "통계 기반 데이터 직무 합격 사례",
    },
    {
        "user_id": "senior_jung_e",
        "user_name": "정E",
        "avatar_label": "정E",
        "avatar_color": "#edf3ff",
        "department": "컴퓨터공학",
        "gap_period": "3개월",
        "certifications": "정보처리기사, AWS SAA",
        "employment_field": "클라우드 인프라",
        "employment_company_type": "IT서비스",
        "career_path_summary": "컴퓨터공학 -> 클라우드 인프라",
        "similarity_score": 78.0,
        "is_accepted": True,
        "match_note": "자격증과 프로젝트를 함께 준비한 사례",
    },
    {
        "user_id": "senior_han_f",
        "user_name": "한F",
        "avatar_label": "한F",
        "avatar_color": "#f7edf5",
        "department": "디자인",
        "gap_period": "8개월",
        "certifications": "GTQ, 웹디자인기능사",
        "employment_field": "UI/UX 디자인",
        "employment_company_type": "에이전시",
        "career_path_summary": "디자인 -> UI/UX 디자인 취업",
        "similarity_score": 73.0,
        "is_accepted": True,
        "match_note": "포트폴리오 개선 중심 합격 사례",
    },
    {
        "user_id": "senior_oh_g",
        "user_name": "오G",
        "avatar_label": "오G",
        "avatar_color": "#eaf7f2",
        "department": "전자공학",
        "gap_period": "9개월",
        "certifications": "정보처리기사, 리눅스마스터",
        "employment_field": "임베디드 개발",
        "employment_company_type": "제조기업",
        "career_path_summary": "전자공학 -> 임베디드 개발",
        "similarity_score": 70.0,
        "is_accepted": True,
        "match_note": "전공 프로젝트를 직무 경험으로 전환한 사례",
    },
    {
        "user_id": "senior_yoon_h",
        "user_name": "윤H",
        "avatar_label": "윤H",
        "avatar_color": "#f5f1e8",
        "department": "인문학",
        "gap_period": "10개월",
        "certifications": "SQLD, 컴퓨터활용능력 1급",
        "employment_field": "CRM 마케팅",
        "employment_company_type": "커머스",
        "career_path_summary": "인문학 -> CRM 마케팅",
        "similarity_score": 76.0,
        "is_accepted": True,
        "match_note": "데이터 활용 마케팅 직무 전환 사례",
    },
    {
        "user_id": "senior_shin_i",
        "user_name": "신I",
        "avatar_label": "신I",
        "avatar_color": "#eef0f8",
        "department": "수학",
        "gap_period": "6개월",
        "certifications": "ADsP, 빅데이터분석기사",
        "employment_field": "AI 모델링",
        "employment_company_type": "AI 스타트업",
        "career_path_summary": "수학 -> AI 모델링",
        "similarity_score": 84.0,
        "is_accepted": True,
        "match_note": "수학적 강점을 머신러닝 프로젝트로 연결한 사례",
    },
    {
        "user_id": "senior_kang_j",
        "user_name": "강J",
        "avatar_label": "강J",
        "avatar_color": "#f3f6e8",
        "department": "경제학",
        "gap_period": "12개월",
        "certifications": "SQLD, 투자자산운용사",
        "employment_field": "핀테크 데이터 분석",
        "employment_company_type": "핀테크",
        "career_path_summary": "경제학 -> 핀테크 데이터 분석",
        "similarity_score": 68.0,
        "is_accepted": True,
        "match_note": "도메인 지식을 데이터 분석 강점으로 만든 사례",
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for item in SENIOR_PERSONAS:
            persona = (
                db.query(SeniorPersona)
                .filter(SeniorPersona.user_id == item["user_id"])
                .first()
            )
            if persona:
                for key, value in item.items():
                    setattr(persona, key, value)
            else:
                db.add(SeniorPersona(**item))
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("senior_personas seed complete")
