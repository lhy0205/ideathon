import { useState } from 'react'
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

// col: 0-based month index (0=1월), span: width in months
// type: 'study' | 'exam'
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

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월']
const TOTAL_COLS = 6

function GanttChart({ pathKey, certs }) {
  const bars = SCHEDULE[pathKey] || []
  const certRows = certs.filter(c => c !== 'ERP' ? true : true)

  return (
    <div className="gantt">
      {/* 월 헤더 */}
      <div className="gantt-header">
        <div className="gantt-label-col" />
        {MONTHS.map(m => (
          <div key={m} className="gantt-month">{m}</div>
        ))}
      </div>
      {/* 행 */}
      {certs.map(cert => {
        const certBars = bars.filter(b => b.cert === cert)
        return (
          <div key={cert} className="gantt-row">
            <div className="gantt-label">{cert}</div>
            <div className="gantt-track">
              {certBars.map((b, i) => (
                <div
                  key={i}
                  className={`gantt-bar ${b.type}`}
                  style={{
                    left: `${(b.col / TOTAL_COLS) * 100}%`,
                    width: `${(b.span / TOTAL_COLS) * 100}%`,
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

export default function CertRoadmap() {
  const [selected, setSelected] = useState('balanced')
  const currentPath = PATHS.find(p => p.key === selected)

  return (
    <div className="cr-root">
      <div className="cr-page-title">
        <h2>자격증 로드맵</h2>
        <p>현재 역량에서 목표 직무까지 최적 경로를 설계합니다</p>
      </div>

      <div className="cr-body">
        {/* 왼쪽: 경로 선택 */}
        <div className="cr-left">
          <div className="cr-card">
            <h3 className="cr-card-title">경로 선택</h3>
            <div className="cr-path-list">
              {PATHS.map(path => (
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
                    {path.months} &nbsp;·&nbsp; 합격률 {path.passRate} &nbsp;·&nbsp; {path.steps}
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
          {/* 월별 스케줄 */}
          <div className="cr-card">
            <h3 className="cr-card-title">월별 스케줄 ({currentPath.name})</h3>
            <GanttChart pathKey={selected} certs={currentPath.certs} />
          </div>

          {/* 자격증별 정보 */}
          <div className="cr-card">
            <h3 className="cr-card-title">자격증별 정보</h3>
            <div className="cr-cert-list">
              {CERT_INFO.map(cert => (
                <div key={cert.name} className="cr-cert-row">
                  <div className="cr-cert-name">{cert.name}</div>
                  <div className="cr-cert-info">
                    <div className="cr-cert-full">{cert.fullName}</div>
                    <div className="cr-cert-detail">{cert.detail}</div>
                  </div>
                  <div className={`cr-cert-status ${cert.status}`}>
                    {cert.status === 'pass' ? '✅ 합격' : '🟡 준비중'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
