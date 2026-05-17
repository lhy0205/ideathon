"""
KNN 기반 선배 페르소나 매칭 모듈.

사용자 프로필(공백기간, 학과, 자격증, 희망직무)과
선배 페르소나 데이터를 비교해 가장 유사한 K명을 반환한다.
"""
import re
import math
import random


# ── 특성 추출 헬퍼 ────────────────────────────────────────────────

def parse_gap_months(gap_str: str) -> int:
    """'5개월' → 5 / '1년 3개월' → 15 / None → 0"""
    if not gap_str:
        return 0
    months = 0
    year_m = re.search(r'(\d+)\s*년', gap_str)
    month_m = re.search(r'(\d+)\s*개월', gap_str)
    if year_m:
        months += int(year_m.group(1)) * 12
    if month_m:
        months += int(month_m.group(1))
    return months or 0


# 학과 → 카테고리 번호 (같은 번호면 동일 계열)
_DEPT_MAP = {
    # 0: 인문·어문
    '문과': 0, '인문': 0, '인문학': 0, '역사': 0, '역사학': 0, '철학': 0,
    '문학': 0, '국문': 0, '국어': 0, '언어': 0, '언어학': 0, '영문': 0, '영어': 0,
    '불어': 0, '독어': 0, '중문': 0, '일어': 0, '일본어': 0, '중국어': 0,
    '서어': 0, '노어': 0, '아랍어': 0, '심리': 0, '심리학': 0,
    '사회': 0, '사회학': 0, '사회복지': 0, '복지': 0, '문화': 0, '미디어': 0,
    '신문': 0, '방송': 0, '광고': 0, '홍보': 0, '커뮤니케이션': 0,
    '지리': 0, '지리학': 0, '고고': 0, '종교': 0, '영어영문학': 0, '음악학': 0,
    # 1: 경영·경제·상경
    '경영': 1, '경영학': 1, '경제': 1, '경제학': 1, '회계': 1, '세무': 1,
    '마케팅': 1, '무역': 1, '국제경영': 1, '국제통상': 1, '통상': 1,
    '금융': 1, '재무': 1, '보험': 1, '유통': 1, '물류': 1, '상경': 1,
    '벤처': 1, '창업': 1, '부동산': 1, '호텔': 1, '관광': 1, '항공': 1,
    # 2: 수학·통계·데이터
    '통계': 2, '수학': 2, '통계학': 2, '수리': 2, '응용수학': 2,
    '데이터': 2, '빅데이터': 2, '인공지능': 2, 'ai': 2, '머신러닝': 2,
    '수리과학': 2,
    # 3: 컴퓨터·IT·소프트웨어
    '컴퓨터': 3, '컴퓨터공학': 3, '소프트웨어': 3, '정보통신': 3, '정보': 3,
    '소프트웨어공학': 3, '정보보안': 3, '보안': 3, '네트워크': 3, '클라우드': 3,
    'it': 3, '시스템': 3, '게임': 3, '멀티미디어': 3, '웹': 3, '사이버': 3,
    '전산': 3, '정보통신공학': 3, '경영정보': 3,
    # 4: 전기·전자·기계·공학
    '전자': 4, '전자공학': 4, '전기': 4, '전기전자': 4, '기계': 4, '기계공학': 4,
    '산업': 4, '산업공학': 4, '화학공학': 4, '화공': 4, '재료': 4, '신소재': 4,
    '토목': 4, '건축': 4, '환경': 4, '환경공학': 4, '항공우주': 4, '조선': 4,
    '자동차': 4, '로봇': 4, '반도체': 4, '바이오': 4, '생명공학': 4, '공학': 4,
    '에너지': 4, '신소재공학': 4, '항공우주공학': 4, '해양공학': 4, '에너지공학': 4,
    '토목공학': 4, '건축학': 4, '자동차공학': 4, '식품공학': 4,
    # 5: 예술·디자인
    '디자인': 5, 'ui': 5, 'ux': 5, '미술': 5, '시각디자인': 5, '산업디자인': 5,
    '패션': 5, '의상': 5, '음악': 5, '연극': 5, '영화': 5, '사진': 5,
    '애니메이션': 5, '게임디자인': 5, '예술': 5, '도예': 5, '순수미술': 5,
    '체육': 5, '스포츠': 5, '무용': 5, '미술학': 5, '음악학': 5, '체육학': 5, '공예학': 5,
    # 6: 비전공·기타명시
    '비전공': 6, '검정고시': 6, '고졸': 6,
    # 7: 의약·간호·보건
    '의학': 7, '의대': 7, '간호': 7, '약학': 7, '치의학': 7, '치대': 7,
    '한의': 7, '물리치료': 7, '작업치료': 7, '보건': 7, '의료': 7,
    # 8: 교육
    '교육': 8, '교육학': 8, '사범': 8, '유아': 8, '초등': 8,
    '특수교육': 8, '교직': 8,
    # 9: 법·행정
    '법학': 9, '법': 9, '행정': 9, '행정학': 9, '정치': 9, '정치학': 9,
    '정책': 9, '공공': 9, '외교': 9, '정치학': 9,
    # 10: 농·식품·생물
    '농업': 10, '식품': 10, '식품공학': 10, '생물': 10, '생명과학': 10,
    '생물학': 10, '축산': 10, '원예': 10, '산림': 10, '해양': 10,
}

_UNKNOWN_CATEGORY = 99  # 분류 불가

def dept_to_category(dept: str) -> int:
    if not dept:
        return _UNKNOWN_CATEGORY
    d = dept.lower().strip()
    # 완전 일치 우선
    if d in _DEPT_MAP:
        return _DEPT_MAP[d]
    # 부분 일치 (키가 입력에 포함되거나 입력이 키에 포함)
    for key, val in _DEPT_MAP.items():
        if key in d or d in key:
            return val
    return _UNKNOWN_CATEGORY


def parse_certs(cert_str: str) -> set:
    """'ADsP, SQLD' → {'ADsP', 'SQLD'}"""
    if not cert_str:
        return set()
    return {c.strip() for c in re.split(r'[,，/]', cert_str) if c.strip()}


def _jaccard(a: set, b: set) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _field_sim(user_field: str, persona_field: str) -> float:
    """희망직무 유사도: 키워드 오버랩 기반"""
    if not user_field or not persona_field:
        return 0.3
    uw = set(user_field.replace('/', ' ').split())
    pw = set(persona_field.replace('/', ' ').split())
    if uw & pw:
        return 1.0
    if user_field in persona_field or persona_field in user_field:
        return 0.7
    return 0.0


# ── KNN 핵심 로직 ────────────────────────────────────────────────

# 가중치 (합 = 1.0)
_W = {
    'gap':   0.30,   # 공백기간 유사도
    'dept':  0.20,   # 학과 계열 유사도
    'cert':  0.25,   # 자격증 자카드 유사도
    'field': 0.25,   # 희망직무 유사도
}

_MAX_GAP = 15.0  # 정규화 기준 최대 공백기간(개월)


def _get_attr(obj, key: str, default=''):
    """dict 또는 object에서 값 가져오기 (dict면 [], object면 .)"""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def compute_similarity(user_profile: dict, persona) -> float:
    """
    user_profile 키: gap_period, department, certifications, job_interest
    returns: 0~100 유사도 점수
    """
    # 1. 공백기간 유사도
    u_gap = parse_gap_months(user_profile.get('gap_period', ''))
    p_gap = parse_gap_months(_get_attr(persona, 'gap_period'))
    gap_sim = max(0.0, 1.0 - abs(u_gap - p_gap) / _MAX_GAP)

    # 2. 학과 계열 유사도
    # 사용자 학과가 분류 불가(99)면 해당 차원을 중립값(0.5)으로 처리해
    # 다른 차원이 결과를 결정하도록 한다.
    u_dept = dept_to_category(user_profile.get('department', ''))
    p_dept = dept_to_category(_get_attr(persona, 'department'))
    if u_dept == _UNKNOWN_CATEGORY:
        dept_sim = 0.5
    elif p_dept == _UNKNOWN_CATEGORY:
        dept_sim = 0.3
    else:
        dept_sim = 1.0 if u_dept == p_dept else 0.0

    # 3. 자격증 자카드 유사도
    u_certs = parse_certs(user_profile.get('certifications', ''))
    p_certs = parse_certs(_get_attr(persona, 'certifications'))
    cert_sim = _jaccard(u_certs, p_certs)

    # 4. 희망직무 유사도
    field_sim = _field_sim(
        user_profile.get('job_interest', ''),
        _get_attr(persona, 'employment_field')
    )

    score = (
        _W['gap']   * gap_sim +
        _W['dept']  * dept_sim +
        _W['cert']  * cert_sim +
        _W['field'] * field_sim
    ) * 100

    return round(score, 1)


def knn_match(user_profile: dict, personas: list, k: int = 3) -> list:
    """
    KNN 매칭 실행.
    - user_profile: 현재 사용자 프로필 dict
    - personas: SeniorPersona 모델 객체 또는 dict 리스트
    - k: 반환할 상위 K명
    반환: similarity_score가 갱신된 persona 객체 리스트 (상위 K개)
    """
    if not personas:
        return []

    scored = []
    for persona in personas:
        sim = compute_similarity(user_profile, persona)
        # 점수가 같은 페르소나끼리 순서가 항상 동일해지는 것을 방지
        jitter = random.uniform(-0.5, 0.5)
        scored.append((sim + jitter, sim, persona))

    scored.sort(key=lambda x: x[0], reverse=True)

    result = []
    for _, sim, persona in scored[:k]:
        if isinstance(persona, dict):
            persona['similarity_score'] = sim
        else:
            persona.similarity_score = sim
        result.append(persona)

    return result
