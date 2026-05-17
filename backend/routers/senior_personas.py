from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
import models, schemas
from knn.knn_matcher import knn_match


router = APIRouter(prefix="/senior-personas", tags=["senior-personas"])


DUMMY_SENIOR_PERSONAS = [
    {"user_id": "senior_kim_a", "user_name": "김A", "avatar_label": "김A", "avatar_color": "#f0ede7", "department": "문과", "gap_period": "7개월", "certifications": "ADsP, SQLD", "employment_field": "데이터 분석", "employment_company_type": "중견기업", "career_path_summary": "문과 -> 데이터 분석 취업", "similarity_score": 0},
    {"user_id": "senior_lee_b", "user_name": "이B", "avatar_label": "이B", "avatar_color": "#e8f0f7", "department": "비전공자", "gap_period": "6개월", "certifications": "정보처리기사, SQLD", "employment_field": "백엔드 개발", "employment_company_type": "SI기업", "career_path_summary": "비전공자 SQL 독학 -> SI기업", "similarity_score": 0},
    {"user_id": "senior_park_c", "user_name": "박C", "avatar_label": "박C", "avatar_color": "#f0f7ee", "department": "경영학", "gap_period": "5개월", "certifications": "ADsP", "employment_field": "서비스 기획", "employment_company_type": "스타트업", "career_path_summary": "경영학 -> 스타트업 기획", "similarity_score": 0},
    {"user_id": "senior_choi_d", "user_name": "최D", "avatar_label": "최D", "avatar_color": "#fff2dd", "department": "통계학", "gap_period": "4개월", "certifications": "빅데이터분석기사, SQLD", "employment_field": "데이터 엔지니어링", "employment_company_type": "대기업", "career_path_summary": "통계학 -> 데이터 엔지니어링", "similarity_score": 0},
    {"user_id": "senior_jung_e", "user_name": "정E", "avatar_label": "정E", "avatar_color": "#edf3ff", "department": "컴퓨터공학", "gap_period": "3개월", "certifications": "정보처리기사, AWS SAA", "employment_field": "클라우드 인프라", "employment_company_type": "IT서비스", "career_path_summary": "컴퓨터공학 -> 클라우드 인프라", "similarity_score": 0},
    {"user_id": "senior_han_f", "user_name": "한F", "avatar_label": "한F", "avatar_color": "#f7edf5", "department": "디자인", "gap_period": "8개월", "certifications": "GTQ, 웹디자인기능사", "employment_field": "UI/UX 디자인", "employment_company_type": "에이전시", "career_path_summary": "디자인 -> UI/UX 디자인 취업", "similarity_score": 0},
    {"user_id": "senior_oh_g", "user_name": "오G", "avatar_label": "오G", "avatar_color": "#eaf7f2", "department": "전자공학", "gap_period": "9개월", "certifications": "정보처리기사, 리눅스마스터", "employment_field": "임베디드 개발", "employment_company_type": "제조기업", "career_path_summary": "전자공학 -> 임베디드 개발", "similarity_score": 0},
    {"user_id": "senior_yoon_h", "user_name": "윤H", "avatar_label": "윤H", "avatar_color": "#f5f1e8", "department": "인문학", "gap_period": "10개월", "certifications": "SQLD, 컴퓨터활용능력 1급", "employment_field": "CRM 마케팅", "employment_company_type": "커머스", "career_path_summary": "인문학 -> CRM 마케팅", "similarity_score": 0},
    {"user_id": "senior_shin_i", "user_name": "신I", "avatar_label": "신I", "avatar_color": "#eef0f8", "department": "수학", "gap_period": "6개월", "certifications": "ADsP, 빅데이터분석기사", "employment_field": "AI 모델링", "employment_company_type": "AI 스타트업", "career_path_summary": "수학 -> AI 모델링", "similarity_score": 0},
    {"user_id": "senior_kang_j", "user_name": "강J", "avatar_label": "강J", "avatar_color": "#f3f6e8", "department": "경제학", "gap_period": "12개월", "certifications": "SQLD, 투자자산운용사", "employment_field": "핀테크 데이터 분석", "employment_company_type": "핀테크", "career_path_summary": "경제학 -> 핀테크 데이터 분석", "similarity_score": 0},
    {"user_id": "senior_lim_k", "user_name": "임K", "avatar_label": "임K", "avatar_color": "#f0e8f5", "department": "산업공학", "gap_period": "5개월", "certifications": "정보처리기사, 데이터분석 준전문가", "employment_field": "프로세스 개선", "employment_company_type": "대기업", "career_path_summary": "산업공학 -> 프로세스 개선", "similarity_score": 0},
    {"user_id": "senior_moon_l", "user_name": "문L", "avatar_label": "문L", "avatar_color": "#f7f3e8", "department": "영어영문학", "gap_period": "8개월", "certifications": "TOEIC 950, SQLD", "employment_field": "글로벌 비즈니스", "employment_company_type": "외국계기업", "career_path_summary": "영어영문학 -> 글로벌 비즈니스", "similarity_score": 0},
    {"user_id": "senior_song_m", "user_name": "송M", "avatar_label": "송M", "avatar_color": "#e8f5f0", "department": "물리학", "gap_period": "4개월", "certifications": "정보처리기사, 리눅스마스터", "employment_field": "반도체 소프트웨어", "employment_company_type": "반도체기업", "career_path_summary": "물리학 -> 반도체 소프트웨어", "similarity_score": 0},
    {"user_id": "senior_ahn_n", "user_name": "안N", "avatar_label": "안N", "avatar_color": "#f5f0e8", "department": "경영정보학", "gap_period": "7개월", "certifications": "정보처리기사, SQLD, ADsP", "employment_field": "ERP 컨설팅", "employment_company_type": "컨설팅펌", "career_path_summary": "경영정보학 -> ERP 컨설팅", "similarity_score": 0},
    {"user_id": "senior_baek_o", "user_name": "백O", "avatar_label": "백O", "avatar_color": "#e8e8f5", "department": "화학공학", "gap_period": "6개월", "certifications": "화학기사, 정보처리기사", "employment_field": "화학 데이터 분석", "employment_company_type": "화학기업", "career_path_summary": "화학공학 -> 화학 데이터 분석", "similarity_score": 0},
    {"user_id": "senior_jung_p", "user_name": "정P", "avatar_label": "정P", "avatar_color": "#f3e8f5", "department": "음악학", "gap_period": "9개월", "certifications": "GTQ, 프리미어 자격증", "employment_field": "영상 편집", "employment_company_type": "미디어제작사", "career_path_summary": "음악학 -> 영상 편집", "similarity_score": 0},
    {"user_id": "senior_hwang_q", "user_name": "황Q", "avatar_label": "황Q", "avatar_color": "#f0f5e8", "department": "식품공학", "gap_period": "5개월", "certifications": "식품기사, 품질관리사", "employment_field": "식품 품질관리", "employment_company_type": "식품회사", "career_path_summary": "식품공학 -> 식품 품질관리", "similarity_score": 0},
    {"user_id": "senior_park_r", "user_name": "박R", "avatar_label": "박R", "avatar_color": "#e8f0f3", "department": "토목공학", "gap_period": "7개월", "certifications": "토목기사, 정보처리기사", "employment_field": "스마트시티", "employment_company_type": "건설사", "career_path_summary": "토목공학 -> 스마트시티", "similarity_score": 0},
    {"user_id": "senior_lee_s", "user_name": "이S", "avatar_label": "이S", "avatar_color": "#f5e8f0", "department": "간호학", "gap_period": "4개월", "certifications": "간호사 면허, 보건정보관리사", "employment_field": "의료 정보시스템", "employment_company_type": "병원", "career_path_summary": "간호학 -> 의료 정보시스템", "similarity_score": 0},
    {"user_id": "senior_cho_t", "user_name": "조T", "avatar_label": "조T", "avatar_color": "#f0f3e8", "department": "농학", "gap_period": "11개월", "certifications": "농업기사, GIS 전문가", "employment_field": "정밀농업", "employment_company_type": "농업기술회사", "career_path_summary": "농학 -> 정밀농업", "similarity_score": 0},
    {"user_id": "senior_kim_w", "user_name": "김W", "avatar_label": "김W", "avatar_color": "#f0e8e8", "department": "미술학", "gap_period": "6개월", "certifications": "일러스트레이션, 포토샵 마스터", "employment_field": "그래픽 디자인", "employment_company_type": "디자인스튜디오", "career_path_summary": "미술학 -> 그래픽 디자인", "similarity_score": 0},
    {"user_id": "senior_choi_x", "user_name": "최X", "avatar_label": "최X", "avatar_color": "#f0f5e8", "department": "교육학", "gap_period": "4개월", "certifications": "교육행정직 공무원, 방과후 교사", "employment_field": "교육 행정", "employment_company_type": "교육청", "career_path_summary": "교육학 -> 교육 행정", "similarity_score": 0},
    {"user_id": "senior_roh_y", "user_name": "노Y", "avatar_label": "노Y", "avatar_color": "#e8f0f0", "department": "환경학", "gap_period": "7개월", "certifications": "환경기사, 환경영향평가사", "employment_field": "환경 컨설팅", "employment_company_type": "환경컨설팅회사", "career_path_summary": "환경학 -> 환경 컨설팅", "similarity_score": 0},
    {"user_id": "senior_jung_z", "user_name": "정Z", "avatar_label": "정Z", "avatar_color": "#f5f0e8", "department": "건축학", "gap_period": "9개월", "certifications": "건축사 자격시험, 건축기사", "employment_field": "건축 설계", "employment_company_type": "건축설계사무소", "career_path_summary": "건축학 -> 건축 설계", "similarity_score": 0},
    {"user_id": "senior_lim_ac", "user_name": "임AC", "avatar_label": "임AC", "avatar_color": "#f5f5e8", "department": "생명과학", "gap_period": "8개월", "certifications": "생명공학기사, 실험실관리사", "employment_field": "바이오 연구", "employment_company_type": "제약회사", "career_path_summary": "생명과학 -> 바이오 연구", "similarity_score": 0},
    {"user_id": "senior_son_ad", "user_name": "손AD", "avatar_label": "손AD", "avatar_color": "#e8f5e8", "department": "약학", "gap_period": "3개월", "certifications": "약사 면허, 의약분업", "employment_field": "약국 운영", "employment_company_type": "약국", "career_path_summary": "약학 -> 약국 운영", "similarity_score": 0},
    {"user_id": "senior_lee_ag", "user_name": "이AG", "avatar_label": "이AG", "avatar_color": "#f5f5f5", "department": "기계공학", "gap_period": "5개월", "certifications": "기계설계기사, CAD 전문가", "employment_field": "자동차 부품 설계", "employment_company_type": "자동차부품회사", "career_path_summary": "기계공학 -> 자동차 부품 설계", "similarity_score": 0},
    {"user_id": "senior_park_ah", "user_name": "박AH", "avatar_label": "박AH", "avatar_color": "#e8e8e8", "department": "기계공학", "gap_period": "6개월", "certifications": "기계설계기사, 산업용 로봇 자격증", "employment_field": "산업 로봇 설계", "employment_company_type": "로봇 제조사", "career_path_summary": "기계공학 -> 산업 로봇 설계", "similarity_score": 0},
    {"user_id": "senior_choi_ai", "user_name": "최AI", "avatar_label": "최AI", "avatar_color": "#f0f0f0", "department": "항공우주공학", "gap_period": "8개월", "certifications": "항공기사, CATIA 마스터", "employment_field": "항공기 설계", "employment_company_type": "항공우주회사", "career_path_summary": "항공우주공학 -> 항공기 설계", "similarity_score": 0},
    {"user_id": "senior_jung_aj", "user_name": "정AJ", "avatar_label": "정AJ", "avatar_color": "#f5f5f0", "department": "항공우주공학", "gap_period": "7개월", "certifications": "위성통신기사, 우주시스템 자격증", "employment_field": "우주 시스템", "employment_company_type": "우주항공청", "career_path_summary": "항공우주공학 -> 우주 시스템", "similarity_score": 0},
    {"user_id": "senior_roh_ak", "user_name": "노AK", "avatar_label": "노AK", "avatar_color": "#e8f0f0", "department": "소프트웨어공학", "gap_period": "4개월", "certifications": "게임프로그래밍기사, 정보처리기사", "employment_field": "게임 개발", "employment_company_type": "게임사", "career_path_summary": "소프트웨어공학 -> 게임 개발", "similarity_score": 0},
    {"user_id": "senior_kwon_al", "user_name": "권AL", "avatar_label": "권AL", "avatar_color": "#f0e8f5", "department": "소프트웨어공학", "gap_period": "5개월", "certifications": "임베디드시스템기사, 정보처리기사", "employment_field": "임베디드 소프트웨어", "employment_company_type": "임베디드기업", "career_path_summary": "소프트웨어공학 -> 임베디드 소프트웨어", "similarity_score": 0},
    {"user_id": "senior_shim_am", "user_name": "심AM", "avatar_label": "심AM", "avatar_color": "#e8f5f5", "department": "정보통신공학", "gap_period": "6개월", "certifications": "정보통신기사, 5G 전문가", "employment_field": "5G 통신 시스템", "employment_company_type": "통신사", "career_path_summary": "정보통신공학 -> 5G 통신 시스템", "similarity_score": 0},
    {"user_id": "senior_lim_an", "user_name": "임AN", "avatar_label": "임AN", "avatar_color": "#f5f5e8", "department": "정보통신공학", "gap_period": "7개월", "certifications": "정보통신기사, 네트워크보안전문가", "employment_field": "네트워크 보안", "employment_company_type": "보안회사", "career_path_summary": "정보통신공학 -> 네트워크 보안", "similarity_score": 0},
    {"user_id": "senior_son_ao", "user_name": "손AO", "avatar_label": "손AO", "avatar_color": "#f0f5e8", "department": "신소재공학", "gap_period": "5개월", "certifications": "신소재기사, 반도체설계기사", "employment_field": "반도체 소재", "employment_company_type": "반도체회사", "career_path_summary": "신소재공학 -> 반도체 소재", "similarity_score": 0},
    {"user_id": "senior_bae_ap", "user_name": "배AP", "avatar_label": "배AP", "avatar_color": "#f5e8f0", "department": "신소재공학", "gap_period": "8개월", "certifications": "신소재기사, 배터리전문가", "employment_field": "배터리 개발", "employment_company_type": "배터리회사", "career_path_summary": "신소재공학 -> 배터리 개발", "similarity_score": 0},
    {"user_id": "senior_oh_aq", "user_name": "오AQ", "avatar_label": "오AQ", "avatar_color": "#e8e8f5", "department": "해양공학", "gap_period": "9개월", "certifications": "해양공학기사, 해양구조설계사", "employment_field": "해양 구조물 설계", "employment_company_type": "해양플랜트회사", "career_path_summary": "해양공학 -> 해양 구조물 설계", "similarity_score": 0},
    {"user_id": "senior_lee_ar", "user_name": "이AR", "avatar_label": "이AR", "avatar_color": "#f5f5f5", "department": "에너지공학", "gap_period": "6개월", "certifications": "에너지관리사, 신재생에너지기사", "employment_field": "신재생 에너지", "employment_company_type": "에너지회사", "career_path_summary": "에너지공학 -> 신재생 에너지", "similarity_score": 0},
    {"user_id": "senior_park_as", "user_name": "박AS", "avatar_label": "박AS", "avatar_color": "#e8f0e8", "department": "바이오공학", "gap_period": "7개월", "certifications": "생명공학기사, 실험실관리사", "employment_field": "생명공학", "employment_company_type": "바이오기업", "career_path_summary": "바이오공학 -> 생명공학", "similarity_score": 0},
    {"user_id": "senior_choi_at", "user_name": "최AT", "avatar_label": "최AT", "avatar_color": "#f0f5f5", "department": "자동차공학", "gap_period": "5개월", "certifications": "자동차기사, 전기자동차전문가", "employment_field": "자동차 개발", "employment_company_type": "자동차제조사", "career_path_summary": "자동차공학 -> 자동차 개발", "similarity_score": 0},
    {"user_id": "senior_jung_au", "user_name": "정AU", "avatar_label": "정AU", "avatar_color": "#f5f0e8", "department": "자동차공학", "gap_period": "6개월", "certifications": "자동차기사, 자동차부품설계사", "employment_field": "자동차 부품", "employment_company_type": "자동차부품회사", "career_path_summary": "자동차공학 -> 자동차 부품", "similarity_score": 0},
    {"user_id": "senior_roh_av", "user_name": "노AV", "avatar_label": "노AV", "avatar_color": "#e8f5f0", "department": "원자력공학", "gap_period": "8개월", "certifications": "원자력기사, 원자력시스템전문가", "employment_field": "원자력 시스템", "employment_company_type": "원자력연구원", "career_path_summary": "원자력공학 -> 원자력 시스템", "similarity_score": 0},
    {"user_id": "senior_kwon_aw", "user_name": "권AW", "avatar_label": "권AW", "avatar_color": "#f5e8e8", "department": "지구과학", "gap_period": "7개월", "certifications": "지질기사, 석유탐사전문가", "employment_field": "석유 탐사", "employment_company_type": "에너지채굴회사", "career_path_summary": "지구과학 -> 석유 탐사", "similarity_score": 0},
    {"user_id": "senior_shim_ax", "user_name": "심AX", "avatar_label": "심AX", "avatar_color": "#f0f5f0", "department": "생물학", "gap_period": "4개월", "certifications": "생명정보학기사, 바이오인포매틱스", "employment_field": "생물 정보", "employment_company_type": "바이오IT회사", "career_path_summary": "생물학 -> 생물 정보", "similarity_score": 0},
    {"user_id": "senior_lee_ay", "user_name": "이AY", "avatar_label": "이AY", "avatar_color": "#f5f0e8", "department": "체육학", "gap_period": "6개월", "certifications": "생활체육지도자, 스포츠마케팅자격증", "employment_field": "스포츠 마케팅", "employment_company_type": "스포츠에이전시", "career_path_summary": "체육학 -> 스포츠 마케팅", "similarity_score": 0},
    {"user_id": "senior_park_az", "user_name": "박AZ", "avatar_label": "박AZ", "avatar_color": "#e8f5e8", "department": "공예학", "gap_period": "5개월", "certifications": "도자공예 전문가, 공예디자인기사", "employment_field": "공예 디자인", "employment_company_type": "공예스튜디오", "career_path_summary": "공예학 -> 공예 디자인", "similarity_score": 0},
    {"user_id": "senior_jung_ba", "user_name": "정BA", "avatar_label": "정BA", "avatar_color": "#f0f0f5", "department": "사회학", "gap_period": "7개월", "certifications": "사회조사분석사, 통계분석기사", "employment_field": "사회 연구", "employment_company_type": "연구기관", "career_path_summary": "사회학 -> 사회 연구", "similarity_score": 0},
    {"user_id": "senior_roh_bb", "user_name": "노BB", "avatar_label": "노BB", "avatar_color": "#f5f0f5", "department": "정치학", "gap_period": "6개월", "certifications": "행정고시, 정책분석사", "employment_field": "정책 입안", "employment_company_type": "정부기관", "career_path_summary": "정치학 -> 정책 입안", "similarity_score": 0},
    {"user_id": "senior_kwon_bc", "user_name": "권BC", "avatar_label": "권BC", "avatar_color": "#e8f5f5", "department": "철학", "gap_period": "8개월", "certifications": "독서치료 전문가, 교육심리사", "employment_field": "교육 콘텐츠", "employment_company_type": "출판사", "career_path_summary": "철학 -> 교육 콘텐츠", "similarity_score": 0},
    {"user_id": "senior_shim_bd", "user_name": "심BD", "avatar_label": "심BD", "avatar_color": "#f5e8f5", "department": "역사학", "gap_period": "5개월", "certifications": "학예사, 박물관 큐레이터", "employment_field": "문화 콘텐츠", "employment_company_type": "박물관", "career_path_summary": "역사학 -> 문화 콘텐츠", "similarity_score": 0},
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
