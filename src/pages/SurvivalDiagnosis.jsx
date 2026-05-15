import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './SurvivalDiagnosis.css'

const NAV_ITEMS = [
  { key: 'home',       label: '홈 대시보드',   path: '/dashboard' },
  { key: 'mypage',     label: '마이페이지',     path: '/mypage' },
  { key: 'password',   label: '비밀번호 변경',  path: '/dashboard?tab=password' },
  { key: 'experience', label: '경험 입력',      path: '/dashboard?tab=experience' },
  { key: 'mapping',    label: '경험 매핑 결과', path: '/mapping' },
  { key: 'roadmap',    label: '자격증 로드맵',  path: '/dashboard?tab=roadmap' },
  { key: 'survival',   label: '생존 진단',      path: '/survival' },
  { key: 'mission',    label: '오늘의 미션',    path: '/dashboard?tab=mission' },
  { key: 'community',  label: '커뮤니티',       path: '/dashboard?tab=community' },
  { key: 'report',     label: '성장 리포트',    path: '/dashboard?tab=report' },
]

/* ── Cox PH 더미 데이터 (20명의 user 프로필) ── */
const FALLBACK_COX_DATA = [
  { name: '김A', gap_period: '7개월', department: '경영학', certifications: 'ADsP, SQLD', job_interest: '데이터 분석' },
  { name: '이B', gap_period: '6개월', department: '컴퓨터과학', certifications: '정처기, SQLD', job_interest: '소프트웨어 개발' },
  { name: '박C', gap_period: '5개월', department: '경영학', certifications: 'ADsP', job_interest: '스타트업 기획' },
  { name: '최D', gap_period: '8개월', department: '통계학', certifications: '', job_interest: '데이터 분석' },
  { name: '정E', gap_period: '4개월', department: '정보통신', certifications: '정처기, SQLD, ADsP', job_interest: '웹 개발' },
  { name: '한F', gap_period: '9개월', department: '마케팅', certifications: 'ADsP', job_interest: '디지털 마케팅' },
  { name: '조G', gap_period: '3개월', department: '경제학', certifications: '', job_interest: '금융' },
  { name: '유H', gap_period: '10개월', department: '컴퓨터과학', certifications: 'SQLD', job_interest: '데이터베이스' },
  { name: '윤I', gap_period: '5개월', department: '통계학', certifications: 'ADsP, 정처기', job_interest: '데이터 분석' },
  { name: '강J', gap_period: '6개월', department: '회계학', certifications: '', job_interest: '회계' },
  { name: '송K', gap_period: '4개월', department: '정보', certifications: '정처기', job_interest: '정보보안' },
  { name: '임L', gap_period: '7개월', department: '전자공학', certifications: 'SQLD', job_interest: '임베디드' },
  { name: '홍M', gap_period: '5개월', department: '경영학', certifications: 'ADsP, SQLD, 정처기', job_interest: '데이터 분석' },
  { name: '신N', gap_period: '8개월', department: '컴퓨터과학', certifications: '', job_interest: '게임 개발' },
  { name: '곽O', gap_period: '6개월', department: '통신공학', certifications: 'SQLD', job_interest: '통신' },
  { name: '오P', gap_period: '3개월', department: '경영학', certifications: '', job_interest: '경영컨설팅' },
  { name: '문Q', gap_period: '9개월', department: '통계학', certifications: 'ADsP', job_interest: '리서치' },
  { name: '백R', gap_period: '5개월', department: '소프트웨어', certifications: '정처기, SQLD', job_interest: '백엔드 개발' },
  { name: '손S', gap_period: '7개월', department: '수학', certifications: 'ADsP', job_interest: '데이터 분석' },
  { name: '노T', gap_period: '4개월', department: '정보통신', certifications: 'SQLD', job_interest: '네트워크' },
]

const FALLBACK_CURVE_DATA = {
  points: [
    { month: 0, avg: 82, user: 95 }, { month: 1, avg: 78.5, user: 89.1 },
    { month: 2, avg: 75, user: 83.6 }, { month: 3, avg: 70, user: 76.5 },
    { month: 4, avg: 65, user: 69.2 }, { month: 5, avg: 60, user: 62.3 },
    { month: 6, avg: 55, user: 55.4 }, { month: 7, avg: 50, user: 48.9 },
    { month: 8, avg: 44, user: 41.8 }, { month: 9, avg: 38, user: 35.2 },
    { month: 10, avg: 33, user: 29.4 }, { month: 11, avg: 28, user: 24.1 },
    { month: 12, avg: 22, user: 18.5 },
  ],
  current_month: 5,
  current_prob: 62.3,
  percentile: 38,
  status: '집중 행동이 필요합니다',
  advice: '6~8개월 이후 취업률 급감 구간 진입 전 자격증 취득을 완료하세요.',
}

function SurvivalCurve({ curveData }) {
  const data = curveData || FALLBACK_CURVE_DATA
  const { points, current_month, current_prob } = data

  const W = 520, H = 260
  const px = (mo) => 60 + (mo / 12) * 420
  const py = (pct) => 240 - (pct / 100) * 200

  const solidPts = points.map(p => [p.month, p.user])
  const dashPts  = points.map(p => [p.month, p.avg])

  const toPath = (pts) =>
    pts
      .map(([m, p], i) => `${i === 0 ? 'M' : 'L'}${px(m).toFixed(1)},${py(p).toFixed(1)}`)
      .join(' ')

  const fillPath =
    toPath(solidPts) +
    ` L${px(12)},${py(0)} L${px(0)},${py(0)} Z`

  const markerX = px(current_month)
  const markerY = py(current_prob)
  const gridLines = [Math.round(current_prob / 30) * 30 || 60, 30].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[60, 30].map((pct) => (
        <line key={pct} x1={60} y1={py(pct)} x2={px(12)} y2={py(pct)}
          stroke="#e8ddd8" strokeWidth="1" strokeDasharray="4 4" />
      ))}

      {/* Filled area */}
      <path d={fillPath} fill="rgba(196,96,61,0.08)" />

      {/* Solid line (나와 유사한 그룹) */}
      <path d={toPath(solidPts)} fill="none" stroke="#c4603d" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Dashed line (전체 평균) */}
      <path d={toPath(dashPts)} fill="none" stroke="#aaa" strokeWidth="1.8"
        strokeDasharray="6 4" strokeLinejoin="round" />

      {/* Vertical dashed line at current month */}
      <line x1={markerX} y1={markerY} x2={markerX} y2={py(0)}
        stroke="#c4603d" strokeWidth="1.5" strokeDasharray="5 3" />

      {/* Marker dot */}
      <circle cx={markerX} cy={markerY} r="6" fill="#c4603d" stroke="#fff" strokeWidth="2" />

      {/* Tooltip */}
      <rect x={markerX + 10} y={markerY - 18} width="90" height="26"
        rx="6" fill="#3b1a0e" />
      <text x={markerX + 55} y={markerY - 1} textAnchor="middle"
        fontSize="12" fontWeight="700" fill="#fff" fontFamily="inherit">
        나 ({current_month}개월)
      </text>

      {/* Y-axis labels */}
      <text x="52" y={py(100) + 4} textAnchor="end" fontSize="11" fill="#888">취업</text>
      <text x="52" y={py(60) + 4} textAnchor="end" fontSize="11" fill="#888">60%</text>
      <text x="52" y={py(30) + 4} textAnchor="end" fontSize="11" fill="#888">30%</text>
      <text x="52" y={py(0) + 4} textAnchor="end" fontSize="11" fill="#888">0</text>

      {/* X-axis labels */}
      <text x={px(3)} y={py(0) + 18} textAnchor="middle" fontSize="11" fill="#888">3개월</text>
      <text x={px(current_month)} y={py(0) + 18} textAnchor="middle" fontSize="12"
        fontWeight="700" fill="#c4603d">{current_month}개월</text>
      {current_month !== 9 && (
        <text x={px(9)} y={py(0) + 18} textAnchor="middle" fontSize="11" fill="#888">9개월</text>
      )}

      {/* Legend */}
      <line x1={W - 160} y1={28} x2={W - 135} y2={28} stroke="#c4603d" strokeWidth="2.5" />
      <text x={W - 130} y={32} fontSize="11" fill="#555">나와 유사한 그룹</text>
      <line x1={W - 160} y1={46} x2={W - 135} y2={46}
        stroke="#aaa" strokeWidth="1.8" strokeDasharray="6 4" />
      <text x={W - 130} y={50} fontSize="11" fill="#555">전체 평균</text>
    </svg>
  )
}

export default function SurvivalDiagnosis() {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('survival')
  const [personas, setPersonas] = useState([])
  const [personaLoading, setPersonaLoading] = useState(true)
  const [curveData, setCurveData] = useState(null)
  const [curveLoading, setCurveLoading] = useState(true)

  useEffect(() => {
    const profile = {
      gap_period:     localStorage.getItem('gap_period')     || '5개월',
      department:     localStorage.getItem('department')     || '경영학과',
      certifications: localStorage.getItem('certifications') || '',
      job_interest:   localStorage.getItem('job_interest')   || '데이터 분석',
    }

    const fetchAll = async () => {
      const { api } = await import('../api')

      // 현재 사용자의 생존 곡선 계산
      api.getSurvivalCurve(profile)
        .then(data => setCurveData(data))
        .catch(() => setCurveLoading(false))
        .finally(() => setCurveLoading(false))

      // 더미 데이터에서 처음 3명을 선택해서 각각 Cox 모델에 계산
      Promise.all(
        FALLBACK_COX_DATA.slice(0, 3).map(dummyUser =>
          api.getSurvivalCurve(dummyUser).catch(() => null)
        )
      )
        .then(results => {
          const personaList = results
            .map((data, idx) => ({
              ...FALLBACK_COX_DATA[idx],
              similarity_score: data?.percentile || 80,
              avatar_label: FALLBACK_COX_DATA[idx].name,
              avatar_color: ['#f0ede7', '#e8f0f7', '#f0f7ee'][idx],
              career_path_summary: `${FALLBACK_COX_DATA[idx].department} → ${FALLBACK_COX_DATA[idx].job_interest}`,
              gap_period: FALLBACK_COX_DATA[idx].gap_period,
            }))
            .filter(p => p)
          if (personaList.length > 0) setPersonas(personaList)
        })
        .catch(() => {})
        .finally(() => setPersonaLoading(false))
    }

    fetchAll()
  }, [])

  const handleNav = (item) => {
    setActiveNav(item.key)
    if (item.path) navigate(item.path)
  }

  return (
    <div className="sv-root">
      {/* Top header */}
      <header className="sv-header">
        <span className="sv-brand">Pause to Pass</span>
        <span className="sv-tagline"> - 나의 오늘이 내일의 발판이 되지 못하는 불안</span>
      </header>

      <div className="sv-body">
        {/* Sidebar */}
        <aside className="sv-sidebar">
          <p className="sv-pages-label">PAGES</p>
          <nav className="sv-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                className={`sv-nav-item ${activeNav === item.key ? 'active' : ''}`}
                onClick={() => handleNav(item)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button className="sv-logout" onClick={() => navigate('/login')}>
            로그아웃
          </button>
        </aside>

        {/* Main */}
        <main className="sv-main">
          <div className="sv-topbar">
            <span className="sv-breadcrumb">생존 진단</span>
            <span className="sv-user">· 김지</span>
          </div>

          <div className="sv-content">
            <h2 className="sv-title">생존 진단</h2>
            <p className="sv-subtitle">나의 공백기 위치를 객관적으로 확인하고 행동 가이드를 받으세요</p>

            <div className="sv-columns">
              {/* Left */}
              <div className="sv-left">
                <div className="sv-card">
                  <p className="sv-card-title">≈ 공백기 생존 곡선</p>
                  <p className="sv-card-sub">Cox 비례 위험 모델 기반 · 동일 조건 청년 2,847명 데이터</p>
                  <div className="sv-chart-wrap">
                    {curveLoading
                      ? <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '60px 0' }}>곡선 계산 중...</p>
                      : <SurvivalCurve curveData={curveData} />
                    }
                  </div>
                  {(() => {
                    const d = curveData || FALLBACK_CURVE_DATA
                    return (
                      <div className="sv-alert">
                        <p className="sv-alert-title">
                          현재 {d.current_month}개월 공백기 → 상위 {d.percentile}% 수준
                        </p>
                        <p className="sv-alert-desc">{d.advice}</p>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Right */}
              <div className="sv-right">
                {/* 선배 페르소나 매칭 */}
                <div className="sv-card">
                  <p className="sv-card-title">👥 선배 페르소나 매칭</p>
                  <p className="sv-card-sub">KNN으로 나와 가장 유사한 합격자 3인 매칭</p>
                  <div className="sv-persona-list">
                    {personaLoading ? (
                      <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>매칭 중...</p>
                    ) : (
                      personas.slice(0, 3).map((p, i) => (
                        <div key={i} className="sv-persona-item">
                          <div className="sv-persona-avatar" style={{ background: p.avatar_color || p.color || '#f0ede7' }}>
                            {p.avatar_label || p.avatar}
                          </div>
                          <div className="sv-persona-info">
                            <p className="sv-persona-title">{p.career_path_summary || p.title}</p>
                            <p className="sv-persona-desc">{p.gap_period} · {p.certifications || p.desc}</p>
                            <span className="sv-similarity">유사도 {p.similarity_score}%</span>
                          </div>
                          <span className="sv-pass-badge">합격</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 심리 안전망 */}
                <div className="sv-card sv-mental-card">
                  <p className="sv-card-title">♡ 심리 안전망</p>
                  <p className="sv-card-sub">
                    공백기 중 무기력하거나 불안감을 느끼는 것은 자연스러운 반응입니다.
                  </p>
                  <p className="sv-mental-msg">혼자 버티지 않아도 됩니다.</p>
                  <div className="sv-mental-btns">
                    <button className="sv-mental-btn">
                      <span>🫶</span> 교내 상담 센터 연결하기
                    </button>
                    <button className="sv-mental-btn">
                      <span>📞</span> 청년 마음건강 지원 1393
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
