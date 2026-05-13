import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ExperienceInput from './ExperienceInput'
import CertRoadmap from './CertRoadmap'
import GrowthReport from './GrowthReport'
import './Dashboard.css'

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

const MOODS = [
  { icon: '😊', label: '기분이 좋음' },
  { icon: '😐', label: '보통' },
  { icon: '😟', label: '의욕 없음' },
]

const EXTRA_MISSIONS = [
  { title: '자격증 문제 5개', time: '10분', mood: '기분 상관없음', count: 43 },
  { title: '채용공고 1개 정독', time: '3분', mood: '기분무관', count: 69 },
  { title: '5분 영상보기', time: '5분', mood: '자신감 낮을 때', count: 33 },
  { title: '목표 직무 리서치', time: '15분', mood: '의욕이 충분할때', count: 37 },
]

const MISSION_LOGS = [
  { title: '빠른 첫 번째 글쓰기', status: '완료', done: true },
  { title: '자격증 문제 5개', status: '진행 중', done: false },
]

const FEED_POSTS = [
  { avatar: '김A', name: '문과 출신 데이터 전향 중', persona: true, content: 'ADsP 오늘 모의고사 3회 풀었어요. 데이터 분석 기획 화면이 계속 헷갈리지만 조금씩 나아지고 있어요!', hasImage: true, likes: 12, time: '10분 전' },
  { avatar: '이B', name: '비전공자 SQL 독학 중', persona: true, content: '오늘 배운 것: GROUP BY 절과 HAVING 절의 차이, 드디어 이해했다!', hasImage: false, likes: 15, time: '32분 전' },
  { avatar: '방KC', name: '경영학 출신 분석 전향', persona: false, content: '채용공고 5개 정독 완료. 공통적으로 SQL과 Python 기초를 요구하는군. 다음 주부터 Python 시작!', hasImage: false, likes: 3, time: '12시간 전' },
]

const GROUP_STATS = [
  { label: '데이터 분석', count: 34, pct: 90 },
  { label: '자격증 공부', count: 27, pct: 70 },
  { label: '채용공고 탐색', count: 21, pct: 55 },
  { label: '자기소개서', count: 14, pct: 37 },
]

const CERT_TAGS = [
  { name: 'ADsP', count: 35 },
  { name: 'SQLD', count: 28 },
  { name: '정처기', count: 27 },
  { name: 'IRP', count: 11 },
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

function MissionSection() {
  const [mood, setMood] = useState(1)
  const [missionText, setMissionText] = useState('')
  const [selectedExtra, setSelectedExtra] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [logs, setLogs] = useState(MISSION_LOGS)
  const [streak, setStreak] = useState(127)
  const [totalDone, setTotalDone] = useState(342)
  const [monthDone, setMonthDone] = useState(28)
  const [showAllLogs, setShowAllLogs] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [missionError, setMissionError] = useState('')
  const fileInputRef = useState(null)

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleMissionComplete = () => {
    if (!missionText.trim()) {
      setMissionError('미션 내용을 작성해주세요.')
      return
    }
    setMissionError('')
    const newLog = { title: missionText.trim(), status: '완료', done: true }
    setLogs(prev => [newLog, ...prev])
    setStreak(s => s + 1)
    setTotalDone(t => t + 1)
    setMonthDone(m => m + 1)
    setMissionText('')
    setPhotoPreview(null)
    setCompleted(true)
    setTimeout(() => setCompleted(false), 3000)
  }

  const handleExtraSelect = (i) => {
    if (selectedExtra === i) { setSelectedExtra(null); return }
    setSelectedExtra(i)
    const m = EXTRA_MISSIONS[i]
    const alreadyIn = logs.some(l => l.title === m.title)
    if (!alreadyIn) {
      setLogs(prev => [...prev, { title: m.title, status: '진행 중', done: false }])
    }
  }

  const handleExtraDone = (title) => {
    setLogs(prev => prev.map(l =>
      l.title === title ? { ...l, status: '완료', done: true } : l
    ))
    setTotalDone(t => t + 1)
    setMonthDone(m => m + 1)
  }

  const visibleLogs = showAllLogs ? logs : logs.slice(0, 3)

  return (
    <div className="db-content">
      <h2 className="db-welcome">오늘의 미션</h2>

      {completed && (
        <div className="ms-complete-banner">
          🎉 미션 완료! 오늘도 한 걸음 나아갔어요. 연속 {streak}일째입니다!
        </div>
      )}

      <div className="ms-layout">
        {/* Left column */}
        <div className="ms-left">
          {/* 기분 선택 */}
          <div className="ms-card">
            <p className="ms-card-title">지금 어떤 기분이에요?</p>
            <div className="ms-moods">
              {MOODS.map((m, i) => (
                <button
                  key={i}
                  className={`ms-mood-btn ${mood === i ? 'active' : ''}`}
                  onClick={() => setMood(i)}
                >
                  <span className="ms-mood-icon">{m.icon}</span>
                  <span className="ms-mood-label">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI 추천 미션 */}
          <div className="ms-card">
            <div className="ms-ai-header">
              <p className="ms-card-title">AI 추천 미션</p>
              <span className="ms-participant">· 127명 지금 참여중</span>
            </div>
            <p className="ms-mission-title">오늘 배운 것 한 줄 쓰기</p>
            <p className="ms-mission-desc">
              자신의 말로 생각을 정리하는 힘, 오늘 첫 발걸음을 내디뎌 보세요.
            </p>
            <textarea
              className="ms-textarea"
              placeholder="예) ADsP 시험 범위의 중요한 데이터 분석 기법을 공부했어. 전체적 사고의 틀이 생기는 느낌..."
              value={missionText}
              onChange={(e) => { setMissionText(e.target.value); setMissionError('') }}
              rows={4}
            />
            {missionError && <p className="ms-error">{missionError}</p>}

            {photoPreview && (
              <div className="ms-photo-preview">
                <img src={photoPreview} alt="인증 사진" />
                <button className="ms-photo-remove" onClick={() => setPhotoPreview(null)}>✕</button>
              </div>
            )}

            <div className="ms-mission-actions">
              <label className="ms-btn-outline ms-photo-label">
                📷 인증 사진
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
              </label>
              <button className="ms-btn-primary" onClick={handleMissionComplete}>
                ✓ 미션 완료
              </button>
            </div>
          </div>

          {/* 추가 미션 선택 */}
          <div className="ms-card">
            <p className="ms-card-title">추가 미션 선택</p>
            <p className="ms-card-sub">선택하면 로그에 추가됩니다</p>
            <div className="ms-extra-grid">
              {EXTRA_MISSIONS.map((m, i) => (
                <div
                  key={i}
                  className={`ms-extra-item ${selectedExtra === i ? 'active' : ''}`}
                  onClick={() => handleExtraSelect(i)}
                >
                  <p className="ms-extra-title">{m.title}</p>
                  <p className="ms-extra-meta">{m.time} · {m.mood}</p>
                  <span className="ms-extra-count">+{m.count}명</span>
                  {selectedExtra === i && (
                    <button
                      className="ms-extra-done-btn"
                      onClick={(e) => { e.stopPropagation(); handleExtraDone(m.title) }}
                    >
                      완료
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="ms-right">
          {/* 나의 미션 현황 */}
          <div className="ms-card ms-status-card">
            <p className="ms-card-title">나의 미션 현황</p>
            <div className="ms-status-stats">
              <div className="ms-status-stat">
                <span className="ms-status-num">{streak}회</span>
                <span className="ms-status-label">연속 실천</span>
              </div>
              <div className="ms-status-stat">
                <span className="ms-status-num">{totalDone}개</span>
                <span className="ms-status-label">총 완료 미션</span>
              </div>
              <div className="ms-status-stat">
                <span className="ms-status-num">{monthDone}개</span>
                <span className="ms-status-label">이번 달 완료</span>
              </div>
            </div>
          </div>

          {/* 최근 인증 로그 */}
          <div className="ms-card">
            <p className="ms-card-title">최근 인증 로그</p>
            <div className="ms-logs">
              {visibleLogs.map((log, i) => (
                <div key={i} className="ms-log-item">
                  <div className={`ms-log-icon ${log.done ? 'done' : ''}`}>{log.done ? '✓' : '→'}</div>
                  <p className="ms-log-title">{log.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!log.done && (
                      <button className="ms-log-done-btn" onClick={() => handleExtraDone(log.title)}>완료</button>
                    )}
                    <span className={`ms-log-badge ${log.done ? 'done' : 'ing'}`}>{log.status}</span>
                  </div>
                </div>
              ))}
            </div>
            {logs.length > 3 && (
              <button className="db-more-btn" onClick={() => setShowAllLogs(v => !v)}>
                {showAllLogs ? '접기 ▲' : `전체 로그 보기 (${logs.length}개) ▼`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CommunitySection() {
  const [shareText, setShareText] = useState('')

  return (
    <div className="db-content">
      <div>
        <h2 className="db-welcome">커뮤니티</h2>
        <p className="cm-subtitle">유사 페르소나 그룹의 실시간 인증 피드입니다</p>
      </div>

      <div className="ms-layout">
        {/* Left - 실시간 피드 */}
        <div className="ms-left">
          <div className="ms-card">
            <div className="cm-feed-header">
              <p className="ms-card-title">실시간 피드</p>
              <span className="cm-live-badge">+ 127명 참여중</span>
            </div>
            <div className="cm-posts">
              {FEED_POSTS.map((post, i) => (
                <div key={i} className="cm-post">
                  <div className="cm-post-head">
                    <div className="db-avatar">{post.avatar}</div>
                    <div className="cm-post-info">
                      <span className="cm-post-name">{post.name}</span>
                      {post.persona && <span className="cm-persona-badge">우리 페르소나</span>}
                    </div>
                  </div>
                  <p className="cm-post-content">{post.content}</p>
                  {post.hasImage && <div className="cm-img-placeholder">인증 사진</div>}
                  <div className="cm-post-footer">
                    <button className="cm-like-btn">좋아요 {post.likes}</button>
                    <span className="cm-time">{post.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="db-more-btn">피드 더 보기</button>
          </div>
        </div>

        {/* Right */}
        <div className="ms-right">
          {/* 나도 인증하기 */}
          <div className="ms-card">
            <p className="ms-card-title">나도 인증하기</p>
            <p className="cm-share-label">오늘의 미션 완료 내용:</p>
            <textarea
              className="ms-textarea"
              placeholder="오늘 어떤 미션을 완료했나요? 자유롭게 공유해보세요!"
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              rows={4}
            />
            <div className="ms-mission-actions">
              <button className="ms-btn-outline">인증 사진</button>
              <button className="ms-btn-primary">피드에 공유</button>
            </div>
          </div>

          {/* 그룹 통계 */}
          <div className="ms-card">
            <p className="ms-card-title">그룹 통계</p>
            <div className="cm-stats">
              {GROUP_STATS.map((s, i) => (
                <div key={i} className="cm-stat-row">
                  <span className="cm-stat-label">{s.label}</span>
                  <div className="db-cert-bar-wrap" style={{ flex: 1 }}>
                    <div className="db-cert-bar" style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className="cm-stat-count">{s.count}명</span>
                </div>
              ))}
            </div>
            <div>
              <p className="cm-cert-label">가장 많이 공부하는 자격증:</p>
              <div className="cm-cert-tags">
                {CERT_TAGS.map((t, i) => (
                  <span key={i} className="cm-cert-tag">{t.name} {t.count}명</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  const [searchParams] = useSearchParams()
  const activeNav = searchParams.get('tab') || 'home'
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
                onClick={() => navigate(item.path)}
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
                : activeNav === 'roadmap' ? '자격증 로드맵'
                : activeNav === 'mission' ? '오늘의 미션'
                : activeNav === 'community' ? '커뮤니티'
                : activeNav === 'report' ? '성장 리포트'
                : '홈 대시보드'}
            </span>
            <span className="db-user">· 김지</span>
          </div>

          {activeNav === 'password' && <PasswordSection />}
          {activeNav === 'experience' && <div className="db-content"><ExperienceInput /></div>}
          {activeNav === 'roadmap' && <div className="db-content"><CertRoadmap /></div>}
          {activeNav === 'mission' && <MissionSection />}
          {activeNav === 'community' && <CommunitySection />}
          {activeNav === 'report' && <div className="db-content"><GrowthReport /></div>}
          {activeNav !== 'password' && activeNav !== 'experience' && activeNav !== 'roadmap' && activeNav !== 'mission' && activeNav !== 'community' && activeNav !== 'report' && <div className="db-content">
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
