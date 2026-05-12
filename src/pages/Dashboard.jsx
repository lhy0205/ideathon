import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ExperienceInput from './ExperienceInput'
import GrowthReport from './GrowthReport'
import './Dashboard.css'

const NAV_ITEMS = [
  { key: 'home', label: '홈 대시보드', path: '/dashboard' },
  { key: 'mypage', label: '마이페이지', path: '/mypage' },
  { key: 'password', label: '비밀번호 변경', path: null },
  { key: 'experience', label: '경험 입력', path: null },
  { key: 'mapping', label: '경험 매핑 결과', path: null },
  { key: 'roadmap', label: '자격증 로드맵', path: null },
  { key: 'survival', label: '생존 진단', path: null },
  { key: 'mission', label: '오늘의 미션', path: null },
  { key: 'community', label: '커뮤니티', path: null },
  { key: 'report', label: '성장 리포트', path: null },
]

const TODOS = [
  { icon: '⚡', title: '오늘의 5분 미션', desc: '제큰 첫 글을 쓰기 · 127명 참여 중' },
  { icon: '📝', title: '새 경험 기록하기', desc: '이번 주 활동을 NCS로 반환' },
  { icon: '🧬', title: '생존 진단 확인', desc: '이번 달 취업 가능성 변화' },
]

const ACTIVITIES = [
  { avatar: '김A', title: 'ADsP 모의고사 완료!', time: '10분 전' },
  { avatar: '이B', title: 'GROUP BY 드디어 이해함!', time: '32분 전' },
]

const CERTS = [
  { name: 'ADsP', status: '합격', pct: 100 },
  { name: 'SQLD', status: '합격', pct: 100 },
  { name: '정처기', status: '진행중', pct: 55 },
]

function CircleProgress({ pct }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#f0ede7" strokeWidth="10" />
      <circle
        cx="48" cy="48" r={r}
        fill="none"
        stroke="#c4603d"
        strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="53" textAnchor="middle" fontSize="16" fontWeight="800" fill="#c4603d">{pct}%</text>
    </svg>
  )
}

function PasswordSection() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) setSent(true)
  }

  return (
    <div className="db-content">
      <div className="pw-card">
        <div className="pw-card-header">
          <div className="pw-brand">Pause to Pass</div>
          <div className="pw-brand-sub">공백기를 합격의 자산으로</div>
        </div>
        <div className="pw-tabs">
          <span className="pw-tab active">비밀번호 변경</span>
        </div>
        <form className="pw-form" onSubmit={handleSubmit}>
          <div className="pw-field">
            <label className="pw-label">가입 이메일</label>
            <input
              type="email"
              className="pw-input"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {sent && (
            <div className="pw-success">✓ 재설정 메일이 발송되었습니다.</div>
          )}
          <button type="submit" className="pw-btn">재설정 메일 보내기 ✉</button>
          <div className="pw-footer">
            <span className="pw-link" onClick={() => setSent(false)}>← 로그인으로 돌아가기</span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('home')
  const navigate = useNavigate()

  return (
    <div className="db-root">
      {/* Top header */}
      <header className="db-header">
        <span className="db-brand">Pause to Pass</span>
        <span className="db-tagline"> - 나의 오늘이 내일의 발판이 되지 못하는 불안</span>
      </header>

      <div className="db-body">
        {/* Sidebar */}
        <aside className="db-sidebar">
          <p className="db-pages-label">PAGES</p>
          <nav className="db-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                className={`db-nav-item ${activeNav === item.key ? 'active' : ''}`}
                onClick={() => { setActiveNav(item.key); if (item.path) navigate(item.path) }}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button
            className="db-logout"
            onClick={() => navigate('/login')}
          >
            로그아웃
          </button>
        </aside>

        {/* Main content */}
        <main className="db-main">
          {/* Breadcrumb bar */}
          <div className="db-topbar">
            <span className="db-breadcrumb">
              {activeNav === 'experience' ? '경험 입력'
                : activeNav === 'password' ? '비밀번호 변경'
                : activeNav === 'report' ? '성장 리포트'
                : '홈 대시보드'}
            </span>
            <span className="db-user">· 김지</span>
          </div>

          {activeNav === 'password' && <PasswordSection />}
          {activeNav === 'experience' && <div className="db-content"><ExperienceInput /></div>}
          {activeNav === 'report' && <div className="db-content"><GrowthReport /></div>}
          {activeNav !== 'password' && activeNav !== 'experience' && activeNav !== 'report' && <div className="db-content">
            <h2 className="db-welcome">안녕하세요, 김지현 님</h2>

            {/* Stats */}
            <div className="db-stats">
              <div className="db-stat">
                <span className="db-stat-num">5개월</span>
                <span className="db-stat-label">현재 공백기</span>
              </div>
              <div className="db-stat">
                <span className="db-stat-num">12개</span>
                <span className="db-stat-label">확보된 NCS 역량</span>
              </div>
              <div className="db-stat">
                <span className="db-stat-num">2/3</span>
                <span className="db-stat-label">목표 자격증 취득</span>
              </div>
              <div className="db-stat">
                <span className="db-stat-num">127일</span>
                <span className="db-stat-label">미션 연속 실천</span>
              </div>
            </div>

            {/* Row 1 */}
            <div className="db-row">
              {/* 합격 경로 진행률 */}
              <div className="db-card db-card-wide">
                <div className="db-card-header">
                  <p className="db-card-title">합격 경로 진행률</p>
                  <p className="db-card-sub">균형 경로 · 4개월 플랜</p>
                </div>
                <div className="db-progress-top">
                  <CircleProgress pct={65} />
                  <div className="db-progress-info">
                    <p className="db-progress-desc">ADsP · SQLD · 정처기 진행 중</p>
                    <div className="db-badges">
                      <span className="db-badge">4개월 플랜</span>
                      <span className="db-badge accent">진행률 62%</span>
                    </div>
                  </div>
                </div>
                <div className="db-cert-list">
                  {CERTS.map(c => (
                    <div key={c.name} className="db-cert-row">
                      <span className="db-cert-name">{c.name}</span>
                      <div className="db-cert-bar-wrap">
                        <div className="db-cert-bar" style={{ width: `${c.pct}%` }} />
                      </div>
                      <span className={`db-cert-status ${c.status === '합격' ? 'pass' : 'ing'}`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 오늘 할 일 */}
              <div className="db-card">
                <div className="db-card-header">
                  <p className="db-card-title">오늘 할 일</p>
                  <p className="db-card-sub">미완료 3개 · 완료 2개</p>
                </div>
                <div className="db-todo-list">
                  {TODOS.map((t, i) => (
                    <div key={i} className="db-todo-item">
                      <span className="db-todo-icon">{t.icon}</span>
                      <div>
                        <p className="db-todo-title">{t.title}</p>
                        <p className="db-todo-desc">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="db-row">
              {/* 커뮤니티 최근 활동 */}
              <div className="db-card db-card-wide">
                <div className="db-card-header">
                  <p className="db-card-title">커뮤니티 최근 활동</p>
                  <p className="db-card-sub">유사 페르소나 그룹 · 3개 시 인증</p>
                </div>
                <div className="db-activity-list">
                  {ACTIVITIES.map((a, i) => (
                    <div key={i} className="db-activity-item">
                      <div className="db-avatar">{a.avatar}</div>
                      <div>
                        <p className="db-activity-title">{a.title}</p>
                        <p className="db-activity-time">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="db-more-btn">피드 더 보기</button>
              </div>

              {/* 이번 달 실천 현황 */}
              <div className="db-card">
                <div className="db-card-header">
                  <p className="db-card-title">이번 달 실천 현황</p>
                </div>
                <div className="db-month-progress">
                  <div className="db-month-bar-wrap">
                    <div className="db-month-bar" style={{ width: '58%' }} />
                  </div>
                  <span className="db-month-pct">58%</span>
                </div>
              </div>
            </div>
          </div>}
        </main>
      </div>
    </div>
  )
}
