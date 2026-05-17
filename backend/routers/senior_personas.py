from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
import models, schemas
from knn.knn_matcher import knn_match


router = APIRouter(prefix="/senior-personas", tags=["senior-personas"])


DUMMY_SENIOR_PERSONAS = [
    {"user_id": "senior_kim_a", "user_name": "김A", "avatar_label": "김A", "avatar_color": "#f0ede7", "department": "문과", "gap_period": "7개월", "certifications": "ADsP, SQLD", "employment_field": "데이터 분석", "employment_company_type": "중견기업", "career_path_summary": "문과 -> 데이터 분석 취업", "similarity_score": 94},
    {"user_id": "senior_lee_b", "user_name": "이B", "avatar_label": "이B", "avatar_color": "#e8f0f7", "department": "비전공자", "gap_period": "6개월", "certifications": "정보처리기사, SQLD", "employment_field": "백엔드 개발", "employment_company_type": "SI기업", "career_path_summary": "비전공자 SQL 독학 -> SI기업", "similarity_score": 89},
    {"user_id": "senior_park_c", "user_name": "박C", "avatar_label": "박C", "avatar_color": "#f0f7ee", "department": "경영학", "gap_period": "5개월", "certifications": "ADsP", "employment_field": "서비스 기획", "employment_company_type": "스타트업", "career_path_summary": "경영학 -> 스타트업 기획", "similarity_score": 81},
    {"user_id": "senior_choi_d", "user_name": "최D", "avatar_label": "최D", "avatar_color": "#fff2dd", "department": "통계학", "gap_period": "4개월", "certifications": "빅데이터분석기사, SQLD", "employment_field": "데이터 엔지니어링", "employment_company_type": "대기업", "career_path_summary": "통계학 -> 데이터 엔지니어링", "similarity_score": 86},
    {"user_id": "senior_jung_e", "user_name": "정E", "avatar_label": "정E", "avatar_color": "#edf3ff", "department": "컴퓨터공학", "gap_period": "3개월", "certifications": "정보처리기사, AWS SAA", "employment_field": "클라우드 인프라", "employment_company_type": "IT서비스", "career_path_summary": "컴퓨터공학 -> 클라우드 인프라", "similarity_score": 78},
    {"user_id": "senior_han_f", "user_name": "한F", "avatar_label": "한F", "avatar_color": "#f7edf5", "department": "디자인", "gap_period": "8개월", "certifications": "GTQ, 웹디자인기능사", "employment_field": "UI/UX 디자인", "employment_company_type": "에이전시", "career_path_summary": "디자인 -> UI/UX 디자인 취업", "similarity_score": 73},
    {"user_id": "senior_oh_g", "user_name": "오G", "avatar_label": "오G", "avatar_color": "#eaf7f2", "department": "전자공학", "gap_period": "9개월", "certifications": "정보처리기사, 리눅스마스터", "employment_field": "임베디드 개발", "employment_company_type": "제조기업", "career_path_summary": "전자공학 -> 임베디드 개발", "similarity_score": 70},
    {"user_id": "senior_yoon_h", "user_name": "윤H", "avatar_label": "윤H", "avatar_color": "#f5f1e8", "department": "인문학", "gap_period": "10개월", "certifications": "SQLD, 컴퓨터활용능력 1급", "employment_field": "CRM 마케팅", "employment_company_type": "커머스", "career_path_summary": "인문학 -> CRM 마케팅", "similarity_score": 76},
    {"user_id": "senior_shin_i", "user_name": "신I", "avatar_label": "신I", "avatar_color": "#eef0f8", "department": "수학", "gap_period": "6개월", "certifications": "ADsP, 빅데이터분석기사", "employment_field": "AI 모델링", "employment_company_type": "AI 스타트업", "career_path_summary": "수학 -> AI 모델링", "similarity_score": 84},
    {"user_id": "senior_kang_j", "user_name": "강J", "avatar_label": "강J", "avatar_color": "#f3f6e8", "department": "경제학", "gap_period": "12개월", "certifications": "SQLD, 투자자산운용사", "employment_field": "핀테크 데이터 분석", "employment_company_type": "핀테크", "career_path_summary": "경제학 -> 핀테크 데이터 분석", "similarity_score": 68},
    {"user_id": "senior_lim_k", "user_name": "임K", "avatar_label": "임K", "avatar_color": "#f0e8f5", "department": "산업공학", "gap_period": "5개월", "certifications": "정보처리기사, 데이터분석 준전문가", "employment_field": "프로세스 개선", "employment_company_type": "대기업", "career_path_summary": "산업공학 -> 프로세스 개선", "similarity_score": 79},
    {"user_id": "senior_moon_l", "user_name": "문L", "avatar_label": "문L", "avatar_color": "#f7f3e8", "department": "영어영문학", "gap_period": "8개월", "certifications": "TOEIC 950, SQLD", "employment_field": "글로벌 비즈니스", "employment_company_type": "외국계기업", "career_path_summary": "영어영문학 -> 글로벌 비즈니스", "similarity_score": 72},
    {"user_id": "senior_song_m", "user_name": "송M", "avatar_label": "송M", "avatar_color": "#e8f5f0", "department": "물리학", "gap_period": "4개월", "certifications": "정보처리기사, 리눅스마스터", "employment_field": "반도체 소프트웨어", "employment_company_type": "반도체기업", "career_path_summary": "물리학 -> 반도체 소프트웨어", "similarity_score": 83},
    {"user_id": "senior_ahn_n", "user_name": "안N", "avatar_label": "안N", "avatar_color": "#f5f0e8", "department": "경영정보학", "gap_period": "7개월", "certifications": "정보처리기사, SQLD, ADsP", "employment_field": "ERP 컨설팅", "employment_company_type": "컨설팅펌", "career_path_summary": "경영정보학 -> ERP 컨설팅", "similarity_score": 85},
    {"user_id": "senior_baek_o", "user_name": "백O", "avatar_label": "백O", "avatar_color": "#e8e8f5", "department": "화학공학", "gap_period": "6개월", "certifications": "화학기사, 정보처리기사", "employment_field": "화학 데이터 분석", "employment_company_type": "화학기업", "career_path_summary": "화학공학 -> 화학 데이터 분석", "similarity_score": 75},
    {"user_id": "senior_jung_p", "user_name": "정P", "avatar_label": "정P", "avatar_color": "#f3e8f5", "department": "음악학", "gap_period": "9개월", "certifications": "GTQ, 프리미어 자격증", "employment_field": "영상 편집", "employment_company_type": "미디어제작사", "career_path_summary": "음악학 -> 영상 편집", "similarity_score": 67},
    {"user_id": "senior_hwang_q", "user_name": "황Q", "avatar_label": "황Q", "avatar_color": "#f0f5e8", "department": "식품공학", "gap_period": "5개월", "certifications": "식품기사, 품질관리사", "employment_field": "식품 품질관리", "employment_company_type": "식품회사", "career_path_summary": "식품공학 -> 식품 품질관리", "similarity_score": 77},
    {"user_id": "senior_park_r", "user_name": "박R", "avatar_label": "박R", "avatar_color": "#e8f0f3", "department": "토목공학", "gap_period": "7개월", "certifications": "토목기사, 정보처리기사", "employment_field": "스마트시티", "employment_company_type": "건설사", "career_path_summary": "토목공학 -> 스마트시티", "similarity_score": 74},
    {"user_id": "senior_lee_s", "user_name": "이S", "avatar_label": "이S", "avatar_color": "#f5e8f0", "department": "간호학", "gap_period": "4개월", "certifications": "간호사 면허, 보건정보관리사", "employment_field": "의료 정보시스템", "employment_company_type": "병원", "career_path_summary": "간호학 -> 의료 정보시스템", "similarity_score": 80},
    {"user_id": "senior_cho_t", "user_name": "조T", "avatar_label": "조T", "avatar_color": "#f0f3e8", "department": "농학", "gap_period": "11개월", "certifications": "농업기사, GIS 전문가", "employment_field": "정밀농업", "employment_company_type": "농업기술회사", "career_path_summary": "농학 -> 정밀농업", "similarity_score": 65},
]


class UserProfileForKNN(BaseModel):
    gap_period: Optional[str] = None        # 예: "5개월"
    department: Optional[str] = None        # 예: "경영학과"
    certifications: Optional[str] = None    # 예: "ADsP, SQLD"
    job_interest: Optional[str] = None      # 예: "데이터 분석"


@router.get("/", response_model=List[schemas.SeniorPersonaResponse])
def get_senior_personas(
    limit: int = 3,
    department: Optional[str] = None,
    employment_field: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """단순 조회 (similarity_score 내림차순 정렬)"""
    query = db.query(models.SeniorPersona)

    if department:
        query = query.filter(models.SeniorPersona.department == department)
    if employment_field:
        query = query.filter(models.SeniorPersona.employment_field == employment_field)

    return (
        query
        .order_by(models.SeniorPersona.similarity_score.desc())
        .limit(limit)
        .all()
    )


@router.post("/match")
def match_senior_personas(
    profile: UserProfileForKNN,
    k: int = 3,
    db: Session = Depends(get_db),
):
    """
    KNN 기반 선배 페르소나 매칭.
    사용자 프로필(공백기간·학과·자격증·희망직무)을 입력받아
    가장 유사한 합격자 K명을 반환한다.
    """
    from datetime import datetime

    personas = (
        db.query(models.SeniorPersona)
        .filter(models.SeniorPersona.is_accepted == True)
        .all()
    )

    if not personas:
        personas = DUMMY_SENIOR_PERSONAS

    matched = knn_match(profile.model_dump(), personas, k=k)

    # dict인 경우 SeniorPersonaResponse 필드 추가
    result = []
    for item in matched:
        if isinstance(item, dict):
            item['id'] = item.get('user_id', '')
            item['is_accepted'] = True
            item['match_note'] = None
            item['created_at'] = datetime.now()
        result.append(item)

    return result
