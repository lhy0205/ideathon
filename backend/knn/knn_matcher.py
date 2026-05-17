"""
KNN 기반 선배 페르소나 매칭 모듈.

사용자 프로필(공백기간, 학과, 자격증, 희망직무)과
선배 페르소나 데이터를 비교해 가장 유사한 K명을 반환한다.
"""
import re
import math


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
    '문과': 0, '인문': 0, '인문학': 0, '역사': 0, '철학': 0, '문학': 0, '언어': 0,
    '경영': 1, '경영학': 1, '경제': 1, '경제학': 1, '회계': 1, '마케팅': 1, '무역': 1,
    '통계': 2, '수학': 2, '통계학': 2, '수리': 2,
    '컴퓨터': 3, '컴퓨터공학': 3, '소프트웨어': 3, '정보통신': 3, '정보': 3,
    '전자': 4, '전자공학': 4, '전기': 4, '전기전자': 4,
    '디자인': 5, 'ui': 5, 'ux': 5,
    '비전공': 6,
}

def dept_to_category(dept: str) -> int:
    if not dept:
        return 7
    d = dept.lower()
    for key, val in _DEPT_MAP.items():
        if key in d:
            return val
    return 7  # 기타


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
    u_dept = dept_to_category(user_profile.get('department', ''))
    p_dept = dept_to_category(_get_attr(persona, 'department'))
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
        scored.append((sim, persona))

    scored.sort(key=lambda x: x[0], reverse=True)

    result = []
    for sim, persona in scored[:k]:
        if isinstance(persona, dict):
            persona['similarity_score'] = sim
        else:
            persona.similarity_score = sim
        result.append(persona)

    return result
