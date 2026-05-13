import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ExperienceMapping.css'

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

const STEPS = ['① 경험 작성', '② AI 분석중', '③ NCS 매핑 결과', '④ 자기소개서 초안']

const NCS_CARDS = [
  {
    title: '판매관리',
    level: 3,
    pct: 88,
    code: 'NCS 02010101',
    desc: '재고 관리, 발주, 현금 정산 업무에서 판매 운영 역량 확인',
  },
  { title: '고객상담', level: 2, pct: 76, code: 'NCS 02010201', desc: null },
  { title: '물류관리', level: 2, pct: 62, code: 'NCS 06010101', desc: null },
  { title: '현금관리', level: 2, pct: 58, code: 'NCS 03010101', desc: null },
]

const STAR_TEXT = [
  { label: '상황 S', text: '야간에 혼자 매장을 운영하는 환경에서 재고 오류가 발생했습니다.' },
  { label: '과제 T', text: '다음 날 발주 전까지 정확한 실재고를 파악하고 손실 원인을 규명해야 했습니다.' },
  { label: '행동 A', text: '전산 기록과 실물 재고를 항목별로 대조하고, 유통기한 관리 체계를 새로 설계했습니다.' },
  { label: '결과 R', text: '재고 오차율을 기존 대비 40% 줄이고, 이 방식을 팀 전체 표준으로 채택했습니다.' },
]

const RADAR_LABELS = ['판매관리', '고객', '물류', '현금관리', '재고']
const RADAR_VALUES = [0.88, 0.76, 0.62, 0.58, 0.70]

function RadarChart({ labels = RADAR_LABELS, values = RADAR_VALUES }) {
  const cx = 130, cy = 130, r = 90
  const n = labels.length
  const angles = labels.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2)

  const gridLevels = [0.25, 0.5, 0.75, 1]

  const toXY = (angle, val) => ({
    x: cx + r * val * Math.cos(angle),
    y: cy + r * val * Math.sin(angle),
  })

  const dataPoints = angles.map((a, i) => toXY(a, values[i] ?? 0.5))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z'

  return (
    <svg width="260" height="260" viewBox="0 0 260 260">
      {gridLevels.map(lvl =>
        angles.map((a, i) => {
          const next = angles[(i + 1) % n]
          const p1 = toXY(a, lvl)
          const p2 = toXY(next, lvl)
          return <line key={`${lvl}-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#e8ddd8" strokeWidth="1" />
        })
      )}
      {angles.map((a, i) => {
        const outer = toXY(a, 1)
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e8ddd8" strokeWidth="1" />
      })}
      <path d={dataPath} fill="rgba(196,96,61,0.2)" stroke="#c4603d" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#c4603d" />
      ))}
      {angles.map((a, i) => {
        const lp = toXY(a, 1.22)
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fill="#555" fontFamily="inherit">
            {labels[i]}
          </text>
        )
      })}
    </svg>
  )
}

export default function ExperienceMapping() {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('mapping')
  const [copied, setCopied] = useState(false)
  const [ncsResult, setNcsResult] = useState(null)
  const [expInfo, setExpInfo] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('ncs_result')
    const exp = localStorage.getItem('ncs_experience')
    if (saved) setNcsResult(JSON.parse(saved))
    if (exp) setExpInfo(JSON.parse(exp))
  }, [])

  const handleNav = (item) => {
    setActiveNav(item.key)
    if (item.path) navigate(item.path)
  }

  const ncsCards = ncsResult ? ncsResult.ncs_items : NCS_CARDS
  const STAR_KEY_LABELS = ['상황 S', '과제 T', '행동 A', '결과 R']
  const STAR_PREFIXES = ['[상황 S]', '[과제 T]', '[행동 A]', '[결과 R]']
  const starItems = ncsResult
    ? ncsResult.star_drafts.map((draft, i) => {
        const prefix = STAR_PREFIXES.find(p => draft.startsWith(p))
        return { label: STAR_KEY_LABELS[i] || `항목 ${i+1}`, text: prefix ? draft.slice(prefix.length).trim() : draft }
      })
    : STAR_TEXT
  const summary = ncsResult?.summary || ''
  const expTitle = expInfo?.title || '편의점 아르바이트 2년'
  const expContent = expInfo?.content || '야간 혼자 편의점 운영, 재고 체크, 발주, 고객 트러블 대응, 현금 정산'

  const radarLabels = ncsCards.slice(0, 5).map(c => c.unit_name || c.title)
  const radarValues = ncsCards.slice(0, 5).map(c => (c.score ?? c.pct ?? 70) / 100)

  const handleCopy = () => {
    const text = starItems.map(s => `[${s.label}] ${s.text}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="em-root">
      {/* Top header */}
      <header className="em-header">
        <span className="em-brand">Pause to Pass</span>
        <span className="em-tagline"> - 나의 오늘이 내일의 발판이 되지 못하는 불안</span>
      </header>

      <div className="em-body">
        {/* Sidebar */}
        <aside className="em-sidebar">
          <p className="em-pages-label">PAGES</p>
          <nav className="em-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                className={`em-nav-item ${activeNav === item.key ? 'active' : ''}`}
                onClick={() => handleNav(item)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button className="em-logout" onClick={() => navigate('/login')}>
            로그아웃
          </button>
        </aside>

        {/* Main */}
        <main className="em-main">
          <div className="em-topbar">
            <span className="em-breadcrumb">경험 매핑 결과</span>
            <span className="em-user">· 김지</span>
          </div>

          <div className="em-content">
            <h2 className="em-title">경험 매핑 결과</h2>
            <p className="em-subtitle">AI가 당신의 경험에서 추출한 NCS 역량입니다</p>

            {/* Steps */}
            <div className="em-steps">
              {STEPS.map((s, i) => (
                <div key={i} className={`em-step ${i === 2 ? 'active' : i < 2 ? 'done' : ''}`}>
                  {s}
                </div>
              ))}
            </div>

            {/* Two-column layout */}
            <div className="em-columns">
              {/* Left */}
              <div className="em-left">
                {/* Input experience */}
                <div className="em-exp-card">
                  <p className="em-exp-label">입력 경험</p>
                  <p className="em-exp-title">{expTitle}</p>
                  <p className="em-exp-desc">{expContent.slice(0, 80)}{expContent.length > 80 ? '...' : ''}</p>
                </div>

                {/* NCS cards */}
                <div className="em-ncs-section">
                  <p className="em-ncs-header">
                    <span className="em-ncs-icon">⚙️</span> NCS 역량 카드
                  </p>
                  <p className="em-ncs-sub">1,000+ 능력단위 중 {ncsCards.length}개 매핑됨</p>
                  <div className="em-ncs-list">
                    {ncsCards.map((c, i) => (
                      <div key={i} className="em-ncs-card">
                        <div className="em-ncs-top">
                          <span className="em-ncs-title">{c.unit_name || c.title}</span>
                          <span className={`em-level lv${c.level}`}>숙련도 Lv.{c.level}</span>
                        </div>
                        <div className="em-bar-row">
                          <div className="em-bar-wrap">
                            <div className="em-bar" style={{ width: `${c.score ?? c.pct}%` }} />
                          </div>
                          <span className="em-pct">{c.score ?? c.pct}%</span>
                        </div>
                        <span className="em-code">{c.ncs_code || c.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="em-right">
                {/* 자기소개서 초안 */}
                <div className="em-card">
                  <div className="em-card-header">
                    <p className="em-card-title">📋 자기소개서 초안</p>
                    <p className="em-card-sub">STAR 구조 기반 · 클릭하여 편집 가능</p>
                  </div>
                  {summary && <p style={{ fontSize: '13px', color: '#C75B3A', marginBottom: '10px', fontWeight: '600' }}>{summary}</p>}
                  <div className="em-star-list">
                    {starItems.map((s, i) => (
                      <p key={i} className="em-star-item">
                        <span className="em-star-label">【{s.label}】</span> {s.text}
                      </p>
                    ))}
                  </div>
                  <div className="em-btn-row">
                    <button className="em-btn-primary">✏️ 내용 편집</button>
                    <button className="em-btn-secondary" onClick={handleCopy}>
                      {copied ? '✓ 복사됨' : '📋 복사'}
                    </button>
                  </div>
                </div>

                {/* 레이더 */}
                <div className="em-card">
                  <p className="em-card-title">⭐ 전체 역량 레이더</p>
                  <div className="em-radar-wrap">
                    <RadarChart labels={radarLabels} values={radarValues} />
                  </div>
                  <button className="em-btn-full">⚙️ 자격증 로드맵 설계하기</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
