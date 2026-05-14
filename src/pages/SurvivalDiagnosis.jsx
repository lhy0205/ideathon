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

const DEFAULT_PERSONAS = [
  {
    avatar: '김A',
    title: '문과 → 데이터 분석 취업',
    desc: '공백기 7개월 · ADsP + SQLD 취득',
    similarity_score: 94,
    color: '#f0ede7',
  },
  {
    avatar: '이B',
    title: '비전공자 SQL 독학 → SI기업',
    desc: '공백기 6개월 · 정처기 + SQLD',
    similarity_score: 89,
    color: '#e8f0f7',
  },
  {
    avatar: '박C',
    title: '경영학 → 스타트업 기획',
    desc: '공백기 5개월 · ADsP 취득',
    similarity_score: 81,
    color: '#f0f7ee',
  },
]

/* ── SVG 생존 곡선 ── */
function SurvivalCurve() {
  const W = 520, H = 260
  const px = (mo) => 60 + (mo / 12) * 420
  const py = (pct) => 240 - (pct / 100) * 200

  // 나와 유사한 그룹 (solid orange)
  const solidPts = [
    [0, 95], [2, 85], [3, 76], [4, 68], [5, 60], [7, 42], [9, 24], [11, 12], [12, 8],
  ]
  // 전체 평균 (dashed gray)
  const dashPts = [
    [0, 82], [2, 75], [3, 70], [4, 65], [5, 60], [7, 50], [9, 38], [11, 28], [12, 22],
  ]

  const toPath = (pts) =>
    pts
      .map(([m, p], i) => `${i === 0 ? 'M' : 'L'}${px(m).toFixed(1)},${py(p).toFixed(1)}`)
      .join(' ')

  const fillPath =
    toPath(solidPts) +
    ` L${px(12)},${py(0)} L${px(0)},${py(0)} Z`

  const markerX = px(5)
  const markerY = py(60)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[60, 30].map((pct) => (
        <line key={pct} x1={60} y1={py(pct)} x2={px(12)} y2={py(pct)}
          stroke="#e8ddd8" strokeWidth="1" strokeDasharray="4 4" />
      ))}

      {/* Filled area */}
      <path d={fillPath} fill="rgba(196,96,61,0.08)" />

      {/* Solid line */}
      <path d={toPath(solidPts)} fill="none" stroke="#c4603d" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Dashed line */}
      <path d={toPath(dashPts)} fill="none" stroke="#aaa" strokeWidth="1.8"
        strokeDasharray="6 4" strokeLinejoin="round" />

      {/* Vertical dashed line at 5개월 */}
      <line x1={markerX} y1={markerY} x2={markerX} y2={py(0)}
        stroke="#c4603d" strokeWidth="1.5" strokeDasharray="5 3" />

      {/* Marker dot */}
      <circle cx={markerX} cy={markerY} r="6" fill="#c4603d" stroke="#fff" strokeWidth="2" />

      {/* Tooltip */}
      <rect x={markerX + 10} y={markerY - 18} width="82" height="26"
        rx="6" fill="#3b1a0e" />
      <text x={markerX + 51} y={markerY - 1} textAnchor="middle"
        fontSize="12" fontWeight="700" fill="#fff" fontFamily="inherit">
        나 (5개월)
      </text>

      {/* Y-axis labels */}
      <text x="52" y={py(100) + 4} textAnchor="end" fontSize="11" fill="#888">취업</text>
      <text x="52" y={py(60) + 4} textAnchor="end" fontSize="11" fill="#888">60%</text>
      <text x="52" y={py(30) + 4} textAnchor="end" fontSize="11" fill="#888">30%</text>
      <text x="52" y={py(0) + 4} textAnchor="end" fontSize="11" fill="#888">0</text>

      {/* X-axis labels */}
      <text x={px(3)} y={py(0) + 18} textAnchor="middle" fontSize="11" fill="#888">3개월</text>
      <text x={px(5)} y={py(0) + 18} textAnchor="middle" fontSize="12"
        fontWeight="700" fill="#c4603d">5개월</text>
      <text x={px(9)} y={py(0) + 18} textAnchor="middle" fontSize="11" fill="#888">9개월</text>

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
  const [personas, setPersonas] = useState(DEFAULT_PERSONAS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPersonas = async () => {
      try {
        const { api } = await import('../api')
        const data = await api.getSeniorPersonas(3)
        if (data && data.length > 0) {
          setPersonas(data.map((p, i) => ({
            ...p,
            avatar: p.name || ['김A', '이B', '박C'][i] || '선배',
            title: p.career_path || '경력 경로',
            desc: `공백기 ${p.gap_period}개월 · ${p.acquired_certs || '자격증 미입력'}`,
            similarity: p.similarity_score || 0,
            color: ['#f0ede7', '#e8f0f7', '#f0f7ee'][i] || '#f0ede7',
          })))
        }
      } catch (e) {
        console.log('선배 데이터 로드 실패, 기본값 사용:', e)
      } finally {
        setLoading(false)
      }
    }
    loadPersonas()
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
                    <SurvivalCurve />
                  </div>
                  <div className="sv-alert">
                    <p className="sv-alert-title">현재 5개월 공백기 → 상위 38% 수준</p>
                    <p className="sv-alert-desc">
                      지금이 집중 행동의 골든타임입니다. 6~8개월 이후 취업률 급감 구간에 진입하기 전
                      자격증 취득을 완료하는 것이 중요합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="sv-right">
                {/* 선배 페르소나 매칭 */}
                <div className="sv-card">
                  <p className="sv-card-title">👥 선배 페르소나 매칭</p>
                  <p className="sv-card-sub">KNN으로 나와 가장 유사한 합격자 3인 매칭</p>
                  <div className="sv-persona-list">
                    {personas.map((p, i) => (
                      <div key={i} className="sv-persona-item">
                        <div className="sv-persona-avatar" style={{ background: p.color }}>
                          {p.avatar}
                        </div>
                        <div className="sv-persona-info">
                          <p className="sv-persona-title">{p.title}</p>
                          <p className="sv-persona-desc">{p.desc}</p>
                          <span className="sv-similarity">유사도 {p.similarity || p.similarity_score}%</span>
                        </div>
                        <span className="sv-pass-badge">합격</span>
                      </div>
                    ))}
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
