import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import './ExperienceMapping.css'

const NAV_ITEMS = [
  { key: 'home',       label: '홈 대시보드',   path: '/dashboard' },
  { key: 'mypage',     label: '마이페이지',     path: '/mypage' },
  { key: 'experience', label: '경험 입력',      path: '/dashboard?tab=experience' },
  { key: 'mapping',    label: '경험 매핑 결과', path: '/mapping' },
  { key: 'roadmap',    label: '자격증 로드맵',  path: '/dashboard?tab=roadmap' },
  { key: 'survival',   label: '생존 진단',      path: '/survival' },
  { key: 'mission',    label: '오늘의 미션',    path: '/dashboard?tab=mission' },
  { key: 'community',  label: '커뮤니티 (준비 중)', path: null },
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

function splitLabel(text) {
  if (text.length <= 6) return [text]
  const words = text.split(' ')
  if (words.length === 1) {
    const mid = Math.ceil(text.length / 2)
    return [text.slice(0, mid), text.slice(mid)]
  }
  let best = 1, bestDiff = Infinity
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length)
    if (diff < bestDiff) { bestDiff = diff; best = i }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

function RadarChart({ labels = RADAR_LABELS, values = RADAR_VALUES }) {
  const cx = 150, cy = 150, r = 90
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
    <svg width="100%" height="auto" viewBox="0 0 300 300">
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
        const lp = toXY(a, 1.38)
        const lines = splitLabel(labels[i])
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#555" fontFamily="inherit">
            {lines.map((line, li) => (
              <tspan key={li} x={lp.x} dy={li === 0 ? (lines.length > 1 ? '-0.6em' : '0') : '1.3em'}>{line}</tspan>
            ))}
          </text>
        )
      })}
    </svg>
  )
}

export default function ExperienceMapping() {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('mapping')
  const [user, setUser] = useState(null)
  const [copied, setCopied] = useState(false)
  const [ncsResult, setNcsResult] = useState(null)
  const [expInfo, setExpInfo] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [allNcsSummary, setAllNcsSummary] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editedItems, setEditedItems] = useState([])
  const [ncsExpanded, setNcsExpanded] = useState(false)
  const [radarExpSource, setRadarExpSource] = useState('all')
  const [radarNcsItems, setRadarNcsItems] = useState(null)

  useEffect(() => {
    import('../api').then(({ api }) => api.getMe().then(setUser).catch(() => {}))
    // localStorage 마지막 결과 로드
    const saved = localStorage.getItem('ncs_result')
    const exp = localStorage.getItem('ncs_experience')
    if (saved) setNcsResult(JSON.parse(saved))
    if (exp) setExpInfo(JSON.parse(exp))

    // API에서 전체 히스토리 + NCS 통합 요약 로드
    import('../api').then(({ api }) => {
      api.getAnalysisHistory().then(data => {
        setHistory(data)
        if (data.length > 0 && !saved) {
          api.getAnalysisDetail(data[0].idx).then(detail => {
            setNcsResult(detail)
            setSelectedIdx(data[0].idx)
          }).catch(() => {})
        }
      }).catch(() => {})

      api.getNcsSummary().then(data => {
        if (data?.ncs_items?.length > 0) setAllNcsSummary(data.ncs_items)
      }).catch(() => {})
    })
  }, [])

  const handleSelectHistory = async (item) => {
    try {
      const { api } = await import('../api')
      const detail = await api.getAnalysisDetail(item.idx)
      setNcsResult(detail)
      setSelectedIdx(item.idx)
      setExpInfo({ title: item.title, type: item.exp_type, content: '' })
    } catch {}
  }

  const handleNav = (item) => {
    setActiveNav(item.key)
    if (item.path) navigate(item.path)
  }

  const handleBatchAnalyze = async () => {
    setBatchLoading(true)
    try {
      const { api } = await import('../api')
      const result = await api.analyzeBatch()
      setNcsResult(result)
      setSelectedIdx(null)
      setExpInfo({ title: '전체 경험 통합 분석', content: '' })
    } catch (e) {
      alert('통합 분석 실패: ' + e.message)
    } finally {
      setBatchLoading(false)
    }
  }

  const STAR_PREFIXES = ['[상황 S]', '[과제 T]', '[행동 A]', '[결과 R]', '【상황 S】', '【과제 T】', '【행동 A】', '【결과 R】']
  const STAR_KEY_LABELS = ['상황 S', '과제 T', '행동 A', '결과 R', '상황 S', '과제 T', '행동 A', '결과 R']

  const parseDraft = (draft, i) => {
    if (typeof draft !== 'string') return { label: `항목 ${i+1}`, text: String(draft) }
    const prefixIdx = STAR_PREFIXES.findIndex(p => draft.startsWith(p))
    if (prefixIdx !== -1) {
      return {
        label: STAR_KEY_LABELS[prefixIdx],
        text: draft.slice(STAR_PREFIXES[prefixIdx].length).trim(),
      }
    }
    return {
      label: STAR_KEY_LABELS[i] || `항목 ${i+1}`,
      text: draft,
    }
  }

  const ncsCards = ncsResult ? ncsResult.ncs_items : NCS_CARDS
  const starItems = ncsResult
    ? ncsResult.star_drafts.map((draft, i) => parseDraft(draft, i))
    : STAR_TEXT
  const summary = ncsResult?.summary || ''
  const expTitle = expInfo?.title || ''
  const expContent = expInfo?.content ?? ''

  const handleRadarSourceChange = async (val) => {
    setRadarExpSource(val)
    if (val === 'all') {
      setRadarNcsItems(null)
    } else {
      const item = history.find(h => String(h.idx) === String(val))
      if (!item) return
      try {
        const { api } = await import('../api')
        const detail = await api.getAnalysisDetail(item.idx)
        setRadarNcsItems(detail.ncs_items || [])
      } catch {}
    }
  }

  const radarBase = radarNcsItems
    ? radarNcsItems.slice(0, 5).map(c => ({ unit_name: c.unit_name, score: c.score }))
    : allNcsSummary?.length > 0
      ? allNcsSummary.slice(0, 5).map(c => ({ unit_name: c.unit_name, score: c.avg_score }))
      : ncsCards.slice(0, 5)
  const radarLabels = radarBase.map(c => c.unit_name || c.title)
  const radarValues = radarBase.map(c => (c.avg_score ?? c.score ?? c.pct ?? 70) / 100)

  const handleCopy = async () => {
    const text = starItems.map(s => `[${s.label}] ${s.text}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEditStart = () => {
    setEditedItems(starItems.map(s => ({ ...s })))
    setEditMode(true)
  }

  const handleEditSave = async () => {
    const updatedDrafts = editedItems.map(s => `[${s.label}] ${s.text}`)
    const base = ncsResult || { ncs_items: [], star_drafts: [], summary: '' }
    const updated = { ...base, star_drafts: updatedDrafts }
    setNcsResult(updated)
    localStorage.setItem('ncs_result', JSON.stringify(updated))
    if (selectedIdx) {
      try {
        const { api } = await import('../api')
        await api.updateStarDrafts(selectedIdx, updatedDrafts)
      } catch {}
    }
    setEditMode(false)
  }

  return (
    <div className="em-root">
      {/* Top header */}
      <header className="em-header">
        <span className="em-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Pause to Pass</span>
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
                className={`em-nav-item ${activeNav === item.key ? 'active' : ''}${item.path === null ? ' nav-disabled' : ''}`}
                onClick={() => handleNav(item)}
                disabled={item.path === null}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button className="em-logout" onClick={async () => {
            const { api, clearSession } = await import('../api')
            try { await api.endSession() } catch {}
            clearSession(); navigate('/')
          }}>종료</button>
        </aside>

        {/* Main */}
        <main className="em-main">
          <TopBar title="경험 매핑 결과" user={user} />

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
                {/* 경험 히스토리 목록 */}
                {history.length > 0 && (
                  <div className="em-exp-card" style={{ marginBottom: '16px' }}>
                    <p className="em-exp-label">분석한 경험 목록</p>
                    {history.map(item => (
                      <div
                        key={item.idx}
                        onClick={() => handleSelectHistory(item)}
                        style={{
                          padding: '8px 10px',
                          marginTop: '6px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: selectedIdx === item.idx ? '#f5ece8' : '#faf8f5',
                          border: selectedIdx === item.idx ? '1.5px solid #c4603d' : '1.5px solid #ece8e1',
                        }}
                      >
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>{item.title}</p>
                        <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0' }}>NCS {item.ncs_count}개 · {item.created_at}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 선택된 경험 요약 */}
                <div className="em-exp-card">
                  <p className="em-exp-label">선택된 경험</p>
                  <p className="em-exp-title">{expTitle}</p>
                  <p className="em-exp-desc">
                    {expContent
                      ? (expContent.slice(0, 80) + (expContent.length > 80 ? '...' : ''))
                      : expTitle?.includes('통합')
                        ? `입력한 모든 경험 ${history.length}개를 통합하여 분석합니다`
                        : expTitle
                          ? '해당 경험의 NCS 역량이 분석되었습니다'
                          : '경험 내용이 없습니다'}
                  </p>
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
                    <p className="em-card-sub">STAR 구조 기반</p>
                  </div>
                  {history.length > 1 && (
                    <button
                      onClick={handleBatchAnalyze}
                      disabled={batchLoading}
                      style={{
                        width: '100%', marginBottom: '12px', padding: '9px',
                        background: batchLoading ? '#ccc' : '#1a1a1a', color: '#fff',
                        border: 'none', borderRadius: '8px', fontSize: '13px',
                        fontWeight: '600', cursor: batchLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {batchLoading ? '분석 중...' : `✨ 전체 ${history.length}개 경험 통합 분석`}
                    </button>
                  )}
                  {summary && <p style={{ fontSize: '13px', color: '#C75B3A', marginBottom: '10px', fontWeight: '600' }}>{summary}</p>}
                  <div className="em-star-list">
                    {editMode
                      ? editedItems.map((s, i) => (
                          <div key={i} className="em-star-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="em-star-label">【{s.label}】</span>
                            <textarea
                              value={s.text}
                              onChange={e => {
                                const next = [...editedItems]
                                next[i] = { ...next[i], text: e.target.value }
                                setEditedItems(next)
                              }}
                              rows={3}
                              style={{
                                width: '100%', padding: '8px', fontSize: '13px',
                                border: '1.5px solid #c4603d', borderRadius: '6px',
                                fontFamily: 'inherit', resize: 'vertical',
                              }}
                            />
                          </div>
                        ))
                      : starItems.map((s, i) => (
                          <p key={i} className="em-star-item">
                            <span className="em-star-label">【{s.label}】</span> {s.text}
                          </p>
                        ))
                    }
                  </div>
                  <div className="em-btn-row">
                    {editMode ? (
                      <>
                        <button className="em-btn-primary" onClick={handleEditSave}>💾 저장</button>
                        <button className="em-btn-secondary" onClick={() => setEditMode(false)}>취소</button>
                      </>
                    ) : (
                      <>
                        <button className="em-btn-primary" onClick={handleEditStart}>✏️ 내용 편집</button>
                        <button className="em-btn-secondary" onClick={handleCopy}>
                          {copied ? '✓ 복사됨' : '📋 복사'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 레이더 */}
                <div className="em-card">
                  <div className="em-ncs-full-header" style={{ marginBottom: '4px' }}>
                    <p className="em-card-title" style={{ margin: 0 }}>⭐ 전체 역량 레이더</p>
                    {history.length > 0 && (
                      <select
                        className="em-radar-select"
                        value={radarExpSource}
                        onChange={e => handleRadarSourceChange(e.target.value)}
                      >
                        <option value="all">전체 경험 통합</option>
                        {history.map(h => (
                          <option key={h.idx} value={String(h.idx)}>{h.title}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="em-card-sub" style={{ marginBottom: '8px' }}>상위 5개 역량 시각화</p>
                  <div className="em-radar-wrap">
                    <RadarChart labels={radarLabels} values={radarValues} />
                  </div>
                  <button className="em-btn-full" onClick={() => navigate('/dashboard?tab=roadmap')}>⚙️ 자격증 로드맵 설계하기</button>
                </div>

                {/* 전체 NCS 역량 목록 */}
                {allNcsSummary?.length > 0 && (
                  <div className="em-card">
                    <div className="em-ncs-full-header">
                      <div>
                        <p className="em-card-title" style={{ margin: 0 }}>📋 전체 NCS 역량 목록</p>
                        <p className="em-card-sub">모든 경험에서 추출된 {allNcsSummary.length}개 역량 (평균 점수순)</p>
                      </div>
                      <button className="em-ncs-toggle-btn" onClick={() => setNcsExpanded(p => !p)}>
                        {ncsExpanded ? '접기 ▲' : `전체보기 (${allNcsSummary.length}개) ▼`}
                      </button>
                    </div>
                    <div className="em-ncs-full-list">
                      {(ncsExpanded ? allNcsSummary : allNcsSummary.slice(0, 3)).map((c, i) => (
                        <div key={i} className="em-ncs-full-row">
                          <div className="em-ncs-full-top">
                            <span className="em-ncs-full-name">{c.unit_name}</span>
                            <span className="em-ncs-full-meta">경험 {c.count}개 · Lv.{c.level}</span>
                          </div>
                          <div className="em-ncs-full-bar-row">
                            <div className="em-bar-wrap" style={{ flex: 1 }}>
                              <div className="em-bar" style={{ width: `${c.avg_score}%` }} />
                            </div>
                            <span className="em-pct">{c.avg_score}%</span>
                          </div>
                          <span className="em-code">{c.ncs_code}</span>
                        </div>
                      ))}
                    </div>
                    {!ncsExpanded && allNcsSummary.length > 3 && (
                      <p className="em-ncs-more-hint">+ {allNcsSummary.length - 3}개 더 있음</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
