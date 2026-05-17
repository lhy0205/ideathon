import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './MyPage.css'

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

const BADGES = [
  { icon: '🔥', label: '30일 연속', earned: true },
  { icon: '🏆', label: '첫 자격증', earned: true },
  { icon: '⭐', label: 'NCS 10개', earned: true },
  { icon: '🎯', label: '목표', earned: false },
]

const EXPERIENCES = [
  { title: '편의점 아르바이트 2년', ncs: 'NCS 6개 추출됨' },
  { title: '대학 동아리 기획팀장', ncs: 'NCS 4개 추출됨' },
  { title: '카페 바리스타 6개월', ncs: 'NCS 3개 추출됨' },
]

const SETTINGS = [
  { icon: '🔒', label: '비밀번호 변경', sub: null },
  { icon: '🔔', label: '알림 설정', sub: '미션 리마인더, 커뮤니티 알림' },
  { icon: '🎯', label: '목표 직무 변경', sub: '현재: 데이터 분석' },
  { icon: '🚪', label: '로그아웃', sub: null, isLogout: true },
]

export default function MyPage() {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('mypage')
  const [showModal, setShowModal] = useState(false)
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({
    name: '',
    department: '',
    certifications: '',
    job_interest: '',
    gap_start_date: '',
  })

  useEffect(() => {
    import('../api').then(({ api }) => {
      api.getMe().then(data => {
        setUser(data)
        setForm({
          name: data.name || '',
          department: data.department || '',
          certifications: data.certifications || '',
          job_interest: data.job_interest || '',
          gap_start_date: data.gap_start_date || '',
        })
      }).catch(() => {})
    })
  }, [])

  const handleNav = (item) => {
    setActiveNav(item.key)
    if (item.path) navigate(item.path)
  }

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <div className="mp-root">
      {/* Top header */}
      <header className="mp-header">
        <span className="mp-brand">Pause to Pass</span>
        <span className="mp-tagline"> - 나의 오늘이 내일의 발판이 되지 못하는 불안</span>
      </header>

      <div className="mp-body">
      {/* Sidebar */}
      <aside className="mp-sidebar">
        <p className="mp-pages-label">PAGES</p>
        <nav className="mp-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`mp-nav-item ${activeNav === item.key ? 'active' : ''}`}
              onClick={() => handleNav(item)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="mp-logout" onClick={async () => {
          const { api, clearSession } = await import('../api')
          try { await api.endSession() } catch {}
          clearSession()
          navigate('/')
        }}>
          종료
        </button>
      </aside>

      {/* Main */}
      <div className="mp-main">
        {/* Topbar */}
        <div className="mp-topbar">
          <span className="mp-breadcrumb">마이페이지</span>
          <div className="mp-topbar-right">
            <span className="mp-bell">🔔</span>
            <span className="mp-topuser">{user?.name?.slice(0, 2) || ''}</span>
          </div>
        </div>

        {/* Content */}
        <div className="mp-content">
          <h2 className="mp-title">마이페이지</h2>
          <p className="mp-subtitle">내 프로필과 활동 현황을 확인하세요</p>

          {/* Profile + Badges row */}
          <div className="mp-row">
            {/* Profile card */}
            <div className="mp-card mp-profile-card">
              <div className="mp-profile-avatar">{user?.name?.slice(0, 2) || ''}</div>
              <div className="mp-profile-info">
                <p className="mp-profile-name">{user?.name || ''}</p>
                <p className="mp-profile-email">{user?.email || ''}</p>
                <div className="mp-profile-tags">
                  {user?.job_interest && <span className="mp-tag">{user.job_interest} 지망</span>}
                  {user?.gap_start_date && <span className="mp-tag">공백기 시작 {user.gap_start_date}</span>}
                </div>
              </div>
              <button className="mp-edit-btn" onClick={() => setShowModal(true)}>프로필 수정</button>
            </div>

            {/* Badges card */}
            <div className="mp-card">
              <p className="mp-card-title">🏅 나의 달성 배지</p>
              <div className="mp-badges">
                {BADGES.map((b, i) => (
                  <div key={i} className={`mp-badge ${b.earned ? '' : 'locked'}`}>
                    <span className="mp-badge-icon">{b.icon}</span>
                    <span className="mp-badge-label">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mp-stats">
            <div className="mp-stat">
              <span className="mp-stat-num accent">127<span className="mp-stat-unit">일</span></span>
              <span className="mp-stat-label">미션 연속 실천</span>
            </div>
            <div className="mp-stat">
              <span className="mp-stat-num accent">12<span className="mp-stat-unit">개</span></span>
              <span className="mp-stat-label">확보된 NCS 역량</span>
            </div>
            <div className="mp-stat">
              <span className="mp-stat-num accent">2<span className="mp-stat-unit">개</span></span>
              <span className="mp-stat-label">취득 자격증</span>
            </div>
            <div className="mp-stat">
              <span className="mp-stat-num accent">184<span className="mp-stat-unit">h</span></span>
              <span className="mp-stat-label">누적 학습 시간</span>
            </div>
          </div>

          {/* Experience + Settings row */}
          <div className="mp-row">
            {/* Experience list */}
            <div className="mp-card mp-exp-card">
              <div className="mp-card-header">
                <p className="mp-card-title">📋 내 경험 목록</p>
                <p className="mp-card-sub">총 4개 경험 등록됨</p>
              </div>
              <div className="mp-exp-list">
                {EXPERIENCES.map((e, i) => (
                  <div key={i} className="mp-exp-item">
                    <div>
                      <p className="mp-exp-title">{e.title}</p>
                      <p className="mp-exp-ncs">{e.ncs}</p>
                    </div>
                    <button className="mp-result-btn">결과 보기</button>
                  </div>
                ))}
              </div>
              <button className="mp-add-btn" onClick={() => navigate('/dashboard?tab=experience')}>+ 새 경험 추가</button>
            </div>

            {/* Account settings */}
            <div className="mp-card">
              <p className="mp-card-title">⚙️ 계정 설정</p>
              <div className="mp-settings">
                {SETTINGS.map((s, i) => (
                  <button
                    key={i}
                    className={`mp-setting-item ${s.isLogout ? 'logout' : ''}`}
                    onClick={s.isLogout ? async () => {
                      const { api, clearSession } = await import('../api')
                      try { await api.endSession() } catch {}
                      clearSession(); navigate('/')
                    } : undefined}
                  >
                    <span className="mp-setting-icon">{s.icon}</span>
                    <div className="mp-setting-text">
                      <span className="mp-setting-label">{s.label}</span>
                      {s.sub && <span className="mp-setting-sub">{s.sub}</span>}
                    </div>
                    <span className="mp-setting-arrow">›</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* 프로필 수정 모달 */}
      {showModal && (
        <div className="mp-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <div className="mp-modal-header">
              <span className="mp-modal-title">프로필 수정</span>
              <button className="mp-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="mp-modal-avatar-wrap">
              <div className="mp-modal-avatar">{user?.name?.slice(0, 2) || ''}</div>
            </div>

            <div className="mp-modal-form">
              <label className="mp-modal-label">이름</label>
              <input
                className="mp-modal-input"
                name="name"
                value={form.name}
                onChange={handleFormChange}
              />

              <label className="mp-modal-label">전공 / 학과</label>
              <input
                className="mp-modal-input"
                name="department"
                value={form.department}
                onChange={handleFormChange}
                placeholder="예) 경영학과"
              />

              <label className="mp-modal-label">보유 자격증</label>
              <input
                className="mp-modal-input"
                name="certifications"
                value={form.certifications}
                onChange={handleFormChange}
                placeholder="예) 정보처리기사, SQLD"
              />

              <label className="mp-modal-label">관심 직무</label>
              <input
                className="mp-modal-input"
                name="job_interest"
                value={form.job_interest}
                onChange={handleFormChange}
                placeholder="예) 데이터 분석, 백엔드 개발"
              />

              <label className="mp-modal-label">공백기 시작일</label>
              <input
                className="mp-modal-input"
                name="gap_start_date"
                value={form.gap_start_date}
                onChange={handleFormChange}
                placeholder="예) 2024-08"
              />
            </div>

            <div className="mp-modal-btns">
              <button className="mp-modal-cancel" onClick={() => setShowModal(false)}>취소</button>
              <button className="mp-modal-save" onClick={async () => {
                const { api } = await import('../api')
                const updated = await api.updateMe({ name: form.name, department: form.department, certifications: form.certifications, job_interest: form.job_interest, gap_start_date: form.gap_start_date })
                setUser(updated)
                setShowModal(false)
              }}>✓ 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
