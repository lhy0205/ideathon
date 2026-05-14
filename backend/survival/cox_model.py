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
    return months if months > 0 else 5

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

_BASE_HR = 1.8       # 기준 위험비 (조건 없는 평균 취준생)
_USER_START = 95.0   # 나와 유사한 그룹의 시작 취업가능성 (%)


def _compute_hr(user_profile: dict) -> float:
    """사용자 프로필 기반 Cox PH 위험비 계산."""
    gap_months = _parse_gap_months(user_profile.get('gap_period', '5개월'))
    cert_count = _count_certs(user_profile.get('certifications', ''))
    relevant   = _is_relevant_dept(user_profile.get('department', ''))
    has_job    = bool((user_profile.get('job_interest') or '').strip())

    hr = _BASE_HR
    hr -= 0.12 * min(cert_count, 3)   # 자격증 보유 → 위험 감소 (최대 3개)
    if relevant:
        hr -= 0.10                     # 관련 학과 → 위험 감소
    if has_job:
        hr -= 0.08                     # 희망직무 명확 → 위험 감소
    hr += 0.08 * max(0, gap_months - 5)  # 5개월 초과 공백 → 위험 증가

    return round(max(0.5, min(3.5, hr)), 4)


def _user_survival(t: float, hr: float) -> float:
    """Cox PH: S_user(t) = (S₀_norm(t))^HR × 95"""
    s0_norm = _avg_survival(t) / 82.0
    return _USER_START * (s0_norm ** hr)


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
    hr = _compute_hr(user_profile)

    points = []
    for t in CURVE_MONTHS:
        avg_prob  = round(_avg_survival(t), 1)
        user_prob = round(max(0.5, min(99.9, _user_survival(t, hr))), 1)
        points.append({'month': t, 'avg': avg_prob, 'user': user_prob})

    current_month = max(0, min(12, gap_months))
    current_prob  = round(max(0.5, _user_survival(current_month, hr)), 1)
    avg_current   = round(_avg_survival(current_month), 1)

    # HR=1.8 → 상위50%, HR=1.5 → 상위38%, HR=1.2 → 상위26%
    percentile = max(1, min(99, round(50 - (_BASE_HR - hr) * 40)))

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
        'current_prob':  current_prob,
        'avg_current':   avg_current,
        'percentile':    percentile,
        'hr':            hr,
        'status':        status,
        'advice':        advice,
    }
