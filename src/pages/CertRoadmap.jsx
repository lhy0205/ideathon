import { useState, useEffect } from 'react'
import './CertRoadmap.css'

const PATHS = [
  {
    key: 'balanced',
    name: '균형 경로',
    badge: '★ AI 추천',
    badgeType: 'accent',
    months: '4개월',
    passRate: '82%',
    steps: '3단계',
    certs: ['ADsP', 'SQLD', '정처기'],
  },
  {
    key: 'fast',
    name: '최단 경로',
    badge: '빠른 취업',
    badgeType: 'gray',
    months: '3개월',
    passRate: '61%',
    steps: '2단계',
    certs: ['SQLD', '정처기'],
  },
  {
    key: 'highpass',
    name: '고합격률 경로',
    badge: '안정형',
    badgeType: 'gray',
    months: '6개월',
    passRate: '94%',
    steps: '4단계',
    certs: ['ADsP', 'SQLD', 'ERP', '정처기'],
  },
]

const SCHEDULE = {
  balanced: [
    { cert: 'ADsP',  col: 0, span: 1.5, type: 'study' },
    { cert: 'ADsP',  col: 1.5, span: 0.5, type: 'exam' },
    { cert: 'SQLD',  col: 1.5, span: 1.2, type: 'study' },
    { cert: 'SQLD',  col: 2.7, span: 0.5, type: 'exam' },
    { cert: '정처기', col: 3, span: 1.2, type: 'study' },
    { cert: '정처기', col: 4.2, span: 0.5, type: 'exam' },
  ],
  fast: [
    { cert: 'SQLD',  col: 0, span: 1.5, type: 'study' },
    { cert: 'SQLD',  col: 1.5, span: 0.5, type: 'exam' },
    { cert: '정처기', col: 1.5, span: 1.2, type: 'study' },
    { cert: '정처기', col: 2.7, span: 0.5, type: 'exam' },
  ],
  highpass: [
    { cert: 'ADsP',  col: 0, span: 1.2, type: 'study' },
    { cert: 'ADsP',  col: 1.2, span: 0.4, type: 'exam' },
    { cert: 'SQLD',  col: 1.5, span: 1.2, type: 'study' },
    { cert: 'SQLD',  col: 2.7, span: 0.4, type: 'exam' },
    { cert: 'ERP',   col: 2.5, span: 1.0, type: 'study' },
    { cert: 'ERP',   col: 3.5, span: 0.4, type: 'exam' },
    { cert: '정처기', col: 3.8, span: 1.5, type: 'study' },
    { cert: '정처기', col: 5.3, span: 0.4, type: 'exam' },
  ],
}

const CERT_INFO = [
  {
    name: 'ADsP',
    fullName: '데이터분석 준전문가 · 한국데이터산업진흥원',
    detail: '합격률 약 40~50% · 연 2회 (3, 9월)',
    status: 'pass',
  },
  {
    name: 'SQLD',
    fullName: 'SQL 개발자 · 한국데이터산업진흥원',
    detail: '합격률 약 50% · 연 2회 (6, 12월)',
    status: 'pass',
  },
  {
    name: '정처기',
    fullName: '정보처리기사 · 한국산업인력공단',
    detail: '합격률 약 20~30% · 연 3회',
    status: 'ready',
  },
]

const PRIORITY_LABEL = ['', '★ 1순위', '2순위', '3순위', '4순위', '5순위']

function calcTotalCols(bars) {
  if (!bars || bars.length === 0) return 6
  return Math.ceil(Math.max(...bars.map(b => b.col + b.span)))
}

function buildMonths(total) {
  return Array.from({ length: total }, (_, i) => `${i + 1}월`)
}

function buildAiSchedule(certNames) {
  const bars = []
  let col = 0
  certNames.forEach(name => {
    bars.push({ cert: name, col, span: 1.5, type: 'study' })
    bars.push({ cert: name, col: col + 1.5, span: 0.5, type: 'exam' })
    col += 2
  })
  return bars
}

function buildDynamicPaths(certs) {
  const all = certs.map(c => c.name)
  const configs = [
    { key: 'ai_balanced', name: 'AI 맞춤 경로', badge: '★ 추천',  badgeType: 'accent', take: Math.min(3, all.length) },
    { key: 'ai_fast',     name: '빠른 취업',    badge: '빠른 취업', badgeType: 'gray',   take: Math.min(2, all.length) },
    { key: 'ai_thorough', name: '안정형',       badge: '안정형',    badgeType: 'gray',   take: all.length },
  ]
  return configs.map(({ key, name, badge, badgeType, take }) => {
    const certNames = all.slice(0, take)
    return {
      key, name, badge, badgeType,
      months: `${take * 2}개월`,
      passRate: '-',
      steps: `${take}단계`,
      certs: certNames,
      bars: buildAiSchedule(certNames),
    }
  })
}

function GanttChart({ bars, certs }) {
  const totalCols = calcTotalCols(bars)
  const months = buildMonths(totalCols)

  return (
    <div className="gantt">
      <div className="gantt-header">
        <div className="gantt-label-col" />
        {months.map(m => (
          <div key={m} className="gantt-month">{m}</div>
        ))}
      </div>
      {certs.map(cert => {
        const certBars = bars.filter(b => b.cert === cert)
        const shortName = cert.length > 5 ? cert.slice(0, 5) + '…' : cert
        return (
          <div key={cert} className="gantt-row">
            <div className="gantt-label" title={cert}>{shortName}</div>
            <div className="gantt-track">
              {certBars.map((b, i) => (
                <div
                  key={i}
                  className={`gantt-bar ${b.type}`}
                  style={{
                    left: `${(b.col / totalCols) * 100}%`,
                    width: `${(b.span / totalCols) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function calcDday(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  return diff
}

function isBetween(start, end) {
  if (!start || !end) return false
  const today = new Date()
  return today >= new Date(start) && today <= new Date(end)
}

export default function CertRoadmap() {
  const [selected, setSelected] = useState('balanced')
  const [ncsItems, setNcsItems] = useState(null)
  const [expInfo, setExpInfo] = useState(null)
  const [aiCerts, setAiCerts] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [scheduleMap, setScheduleMap] = useState({})

  useEffect(() => {
    const saved = localStorage.getItem('ncs_result')
    if (saved) {
      const parsed = JSON.parse(saved)
      setNcsItems(parsed.ncs_items || [])
    }
    const exp = localStorage.getItem('ncs_experience')
    if (exp) setExpInfo(JSON.parse(exp))

    // 자격증 시험 일정 API 로드
    import('../api').then(({ api }) => {
      api.getCertSchedule().then(list => {
        const map = {}
        list.forEach(c => { map[c.cert_name] = c })
        setScheduleMap(map)
      }).catch(() => {})
    })
  }, [])

  useEffect(() => {
    if (aiCerts?.length) setSelected('ai_balanced')
  }, [aiCerts])

  const handleRecommend = async () => {
    if (!ncsItems?.length) return
    setAiLoading(true)
    setAiError('')
    try {
      const { api } = await import('../api')
      const topItems = [...ncsItems]
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 3)
      const data = await api.recommendCerts(topItems, expInfo?.type || '', expInfo?.title || '')
      const certs = data.certs || []
      setAiCerts(certs)
      localStorage.setItem('ai_certs', JSON.stringify(certs))
    } catch {
      setAiError('추천을 불러오지 못했습니다. 다시 시도해주세요.')
    } finally {
      setAiLoading(false)
    }
  }

  const allPaths = aiCerts?.length ? buildDynamicPaths(aiCerts) : PATHS
  const currentPath = allPaths.find(p => p.key === selected) || allPaths[0]
  const currentBars = currentPath.bars || SCHEDULE[currentPath.key] || []

  return (
    <div className="cr-root">
      <div className="cr-page-title">
        <h2>자격증 로드맵</h2>
        <p>현재 역량에서 목표 직무까지 최적 경로를 설계합니다</p>
      </div>

      {/* AI 추천 섹션 */}
      <div className="cr-ai-card">
        <div className="cr-ai-header">
          <div>
            <span className="cr-ai-title">AI 추천 자격증</span>
            {ncsItems && <span className="cr-ai-sub"> · NCS 상위 역량 {Math.min(3, ncsItems.length)}개 기반</span>}
          </div>
          {ncsItems ? (
            <button className="cr-ai-btn" onClick={handleRecommend} disabled={aiLoading}>
              {aiLoading ? '분석 중...' : aiCerts ? '다시 추천받기' : 'AI 추천받기'}
            </button>
          ) : (
            <span className="cr-ai-empty-hint">경험 매핑을 먼저 진행해주세요</span>
          )}
        </div>

        {aiLoading && (
          <div className="cr-ai-loading">
            <div className="cr-ai-spinner" />
            <span>AI가 NCS 역량에 맞는 자격증을 찾고 있어요...</span>
          </div>
        )}

        {aiError && <p className="cr-ai-error">{aiError}</p>}

        {!aiLoading && aiCerts && (
          <>
            <div className="cr-ai-cert-list">
              {aiCerts.map((cert, i) => (
                <div key={i} className="cr-ai-cert-item">
                  <div className="cr-ai-cert-top">
                    <span className="cr-ai-cert-name">{cert.name}</span>
                    <span className={`cr-ai-priority ${i === 0 ? 'first' : ''}`}>
                      {PRIORITY_LABEL[cert.priority] || `${cert.priority}순위`}
                    </span>
                  </div>
                  {cert.org && <p className="cr-ai-cert-org">{cert.org}</p>}
                  <p className="cr-ai-cert-reason">{cert.reason}</p>
                </div>
              ))}
            </div>
            <p className="cr-ai-roadmap-hint">↓ 아래 경로 선택이 내 경험 기반으로 업데이트됐어요</p>
          </>
        )}

        {!aiLoading && !aiCerts && ncsItems && (
          <p className="cr-ai-placeholder">버튼을 눌러 AI 자격증 추천을 받아보세요</p>
        )}
      </div>

      <div className="cr-body">
        {/* 왼쪽: 경로 선택 */}
        <div className="cr-left">
          <div className="cr-card">
            <h3 className="cr-card-title">경로 선택</h3>
            <div className="cr-path-list">
              {allPaths.map(path => (
                <div
                  key={path.key}
                  className={`cr-path-item ${selected === path.key ? 'active' : ''}`}
                  onClick={() => setSelected(path.key)}
                >
                  <div className="cr-path-top">
                    <span className="cr-path-name">{path.name}</span>
                    <span className={`cr-badge ${path.badgeType}`}>{path.badge}</span>
                  </div>
                  <div className="cr-path-meta">
                    {path.months} &nbsp;·&nbsp;
                    {path.passRate !== '-' ? `합격률 ${path.passRate} ·` : ''} &nbsp;{path.steps}
                  </div>
                  <div className="cr-path-flow">
                    {path.certs.join(' → ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 스케줄 + 자격증 정보 */}
        <div className="cr-right">
          <div className="cr-card">
            <h3 className="cr-card-title">월별 스케줄 ({currentPath.name})</h3>
            <GanttChart bars={currentBars} certs={currentPath.certs} />
            <p className="cr-schedule-notice">※ 위 일정은 예상 공부 기간 기준입니다. 실제 시험 일정은 각 기관 공식 홈페이지를 확인하세요.</p>
          </div>

          <div className="cr-card">
            <h3 className="cr-card-title">자격증별 정보</h3>
            <div className="cr-cert-list">
              {(aiCerts ? currentPath.certs : CERT_INFO.map(c => c.name)).map((certName, i) => {
                const certData = aiCerts ? aiCerts.find(c => c.name === certName) : CERT_INFO[i]
                const sched = scheduleMap[certName]
                const dday = sched ? calcDday(sched.exam_start) : null
                const applying = sched ? isBetween(sched.apply_start, sched.apply_end) : false
                return (
                  <div key={i} className="cr-cert-row">
                    <div className="cr-cert-name">{certName.length > 4 ? certName.slice(0, 4) + '…' : certName}</div>
                    <div className="cr-cert-info">
                      <div className="cr-cert-full">
                        {aiCerts ? (certData?.org || '-') : certData?.fullName}
                        {applying && <span className="cr-badge-applying">접수중</span>}
                      </div>
                      <div className="cr-cert-detail">
                        {aiCerts ? certData?.reason : certData?.detail}
                        {dday !== null && (
                          <span className={`cr-dday ${dday <= 7 ? 'urgent' : ''}`}>
                            {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-Day' : `D+${Math.abs(dday)}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`cr-cert-status ${aiCerts ? 'ready' : certData?.status}`}>
                      {aiCerts
                        ? (PRIORITY_LABEL[certData?.priority] || `${i + 1}순위`)
                        : certData?.status === 'pass' ? '✅ 합격' : '🟡 준비중'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
