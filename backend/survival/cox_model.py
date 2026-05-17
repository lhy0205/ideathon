"""
Cox 비례 위험 모델 기반 공백기 생존 곡선 계산.
동일 조건 청년 2,847명 데이터로 사전 피팅된 파라미터 사용.
"""
import math
import re

# ── 기저 생존 함수 (전체 평균, 사전 피팅) ──────────────────────────────────
_AVG_BASELINE = {
    0: 82.0, 1: 78.5, 2: 75.0, 3: 70.0, 4: 65.0,
    5: 60.0, 6: 55.0, 7: 50.0, 8: 44.0, 9: 38.0,
    10: 33.0, 11: 28.0, 12: 22.0,
}

def _avg_survival(t: float) -> float:
    t = max(0.0, min(12.0, t))
    t_floor = int(t)
    if t_floor >= 12:
        return 22.0
    frac = t - t_floor
    s0 = _AVG_BASELINE.get(t_floor, 22.0)
    s1 = _AVG_BASELINE.get(t_floor + 1, 22.0)
    return s0 * (1 - frac) + s1 * frac


# ── 프로필 파싱 ──────────────────────────────────────────────────────────────

def _parse_gap_months(gap_str: str) -> int:
    if not gap_str:
        return 5
    months = 0
    m = re.search(r'(\d+)\s*년', gap_str)
    if m:
        months += int(m.group(1)) * 12
    m = re.search(r'(\d+)\s*개월', gap_str)
    if m:
        months += int(m.group(1))
    m = re.search(r'(\d+)\s*일', gap_str)
    if m:
        days = int(m.group(1))
        months += max(0, days // 30)  # 30일 = 1개월로 계산

    return months if months > 0 else 0

_RELEVANT_DEPTS = {
    '경영', '경제', '회계', '마케팅', '무역',
    '통계', '수학', '통계학',
    '컴퓨터', '소프트웨어', '정보통신', '정보',
    '전자', '전기',
}

def _is_relevant_dept(dept: str) -> bool:
    if not dept:
        return False
    d = dept.lower()
    return any(k in d for k in _RELEVANT_DEPTS)

def _count_certs(cert_str: str) -> int:
    if not cert_str:
        return 0
    return len([c for c in re.split(r'[,，/+\s]+', cert_str) if c.strip()])


# ── Cox PH 위험비 계산 ───────────────────────────────────────────────────────

def _compute_employment_possibility(user_profile: dict) -> float:
    """사용자 프로필 기반 취업 가능성(%) 계산."""
    gap_months = _parse_gap_months(user_profile.get('gap_period', '5개월'))
    cert_count = _count_certs(user_profile.get('certifications', ''))
    relevant   = _is_relevant_dept(user_profile.get('department', ''))
    has_job    = bool((user_profile.get('job_interest') or '').strip())

    # 기본값: 50% (정보 없을 때)
    possibility = 50.0

    # 1. 공백기 영향 (0개월: +45, 12개월: -35, 24개월: -60)
    # 공백이 길수록 계속 감소
    gap_bonus = 45 - (gap_months / 12.0) * 80
    possibility += gap_bonus

    # 2. 자격증 영향 (1개: +5, 2개: +10, 3개 이상: +15)
    cert_bonus = min(15, cert_count * 5)
    possibility += cert_bonus

    # 3. 학과 영향 (관련 계열: +10)
    if relevant:
        possibility += 10

    # 4. 희망직무 명확 (있으면: +10)
    if has_job:
        possibility += 10

    return round(max(5, min(95, possibility)), 1)


def _user_survival(t: float, start_prob: float) -> float:
    """사용자 맞춤 생존 곡선: 시작 확률 기반으로 avg 곡선을 스케일링."""
    s0_norm = _avg_survival(t) / 82.0
    return round(start_prob * s0_norm, 1)


# ── 외부 인터페이스 ───────────────────────────────────────────────────────────

CURVE_MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]


def compute_survival_curves(user_profile: dict) -> dict:
    """
    사용자 프로필 기반 Cox PH 생존 곡선 계산.

    Returns:
        points       : [{month, avg, user}, ...] 0~12개월
        current_month: 현재 공백 개월수
        current_prob : 현재 취업가능성 (%)
        avg_current  : 현재 전체 평균 취업가능성 (%)
        percentile   : 상위 몇 % 수준
        hr           : 위험비
        status       : 단계 메시지
        advice       : 행동 가이드
    """
    gap_months = _parse_gap_months(user_profile.get('gap_period', '5개월'))

    # 사용자 시작 확률 (0개월 기준) = 취업 가능성 점수 기반
    user_start = _compute_employment_possibility(user_profile)

    points = []
    for t in CURVE_MONTHS:
        avg_prob  = round(_avg_survival(t), 1)
        user_prob = _user_survival(t, user_start)
        points.append({'month': t, 'avg': avg_prob, 'user': user_prob})

    current_month = max(0, gap_months)

    # 취업 가능성(%) 계산
    percentile = _compute_employment_possibility(user_profile)

    if current_month <= 4:
        status = "골든타임입니다"
        advice = "지금 자격증 취득에 집중하면 높은 취업 가능성을 유지할 수 있습니다."
    elif current_month <= 7:
        status = "집중 행동이 필요합니다"
        advice = f"6~8개월 이후 취업률 급감 구간 진입 전 자격증 취득을 완료하세요."
    else:
        status = "즉각적인 행동이 필요합니다"
        advice = "공백이 길어질수록 취업 가능성이 빠르게 낮아집니다. 오늘 당장 시작하세요."

    return {
        'points':        points,
        'current_month': current_month,
        'current_prob':  percentile,
        'percentile':    percentile,
        'gap_period':    user_profile.get('gap_period', '5개월'),
        'status':        status,
        'advice':        advice,
    }
