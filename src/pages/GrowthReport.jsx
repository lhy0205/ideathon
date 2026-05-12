import { useState } from 'react'
import './GrowthReport.css'

const CERTS = [
  {
    name: 'ADsP (데이터분석 준전문가)',
    status: '합격',
    examDate: '2024.11.23',
    passDate: '2024.12.06',
    org: '한국데이터산업진흥원',
    studyHours: 84,
    targetHours: 84,
    pct: 100,
  },
  {
    name: 'SQLD (SQL 개발자)',
    status: '합격',
    examDate: '2024.12.14',
    passDate: '2025.01.03',
    org: '한국데이터산업진흥원',
    studyHours: 100,
    targetHours: 100,
    pct: 100,
  },
  {
    name: '정보처리기사',
    status: '준비 중',
    targetExamDate: '2025.02.15',
    studyHours: 42,
    targetHours: 120,
    pct: 35,
  },
]

const PDF_OPTIONS = [
  { id: 'ncs',     label: 'NCS 역량 카드 (12개)',        desc: '판매관리, 고객상담, 데이터분석 등', defaultChecked: true },
  { id: 'star',    label: 'STAR 자기소개서 초안 (7개)',   desc: '직무별 맞춤 자기소개서',           defaultChecked: true },
  { id: 'cert',    label: '자격증 취득 이력',             desc: 'ADsP, SQLD 합격증 및 학습 시간',  defaultChecked: true },
  { id: 'mission', label: '미션 활동 로그 (342개)',       desc: '127일 연속 실천 기록',             defaultChecked: false },
  { id: 'heatmap', label: '성장 히트맵 & 레이더 차트',   desc: '247일 활동 시각화',                defaultChecked: false },
]

function PdfModal({ onClose }) {
  const [checked, setChecked] = useState(
    Object.fromEntries(PDF_OPTIONS.map(o => [o.id, o.defaultChecked]))
  )
  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="gr-modal-overlay" onClick={onClose}>
      <div className="gr-modal" onClick={e => e.stopPropagation()}>
        <div className="gr-modal-header">
          <span className="gr-modal-title">PDF 포트폴리오 생성</span>
          <button className="gr-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="gr-pdf-icon-wrap">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <path d="M38 14L22 30M38 14H28M38 14V24" stroke="#c4603d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M24 16H14C12.9 16 12 16.9 12 18V38C12 39.1 12.9 40 14 40H34C35.1 40 36 39.1 36 38V28" stroke="#c4603d" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="gr-pdf-subtitle">포트폴리오에 포함할 내용을 선택하세요</p>
        <div className="gr-pdf-options">
          {PDF_OPTIONS.map(opt => (
            <label key={opt.id} className={`gr-pdf-option ${checked[opt.id] ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={checked[opt.id]}
                onChange={() => toggle(opt.id)}
                className="gr-pdf-checkbox"
              />
              <div className="gr-pdf-option-text">
                <span className="gr-pdf-option-label">{opt.label}</span>
                <span className="gr-pdf-option-desc">{opt.desc}</span>
              </div>
            </label>
          ))}
        </div>
        <div className="gr-pdf-actions">
          <button className="gr-pdf-cancel" onClick={onClose}>취소</button>
          <button className="gr-pdf-download">PDF 생성 및 다운로드</button>
        </div>
      </div>
    </div>
  )
}

function CertModal({ onClose }) {
  return (
    <div className="gr-modal-overlay" onClick={onClose}>
      <div className="gr-modal" onClick={e => e.stopPropagation()}>
        <div className="gr-modal-header">
          <span className="gr-modal-title">자격증 증빙 관리</span>
          <button className="gr-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="gr-modal-body">
          {CERTS.map((cert, i) => (
            <div key={i} className={`gr-cert-item ${cert.status === '준비 중' ? 'preparing' : ''}`}>
              <div className="gr-cert-top">
                <span className="gr-cert-name">{cert.name}</span>
                <span className={`gr-cert-badge ${cert.status === '합격' ? 'pass' : 'ready'}`}>
                  {cert.status}
                </span>
              </div>
              <div className="gr-cert-info">
                {cert.status === '합격'
                  ? `시험일: ${cert.examDate} · 합격일: ${cert.passDate}`
                  : `목표 시험일: ${cert.targetExamDate} · 학습 시간: ${cert.studyHours}시간/ 목표 ${cert.targetHours}시간`
                }
              </div>
              {cert.status === '합격' && (
                <div className="gr-cert-info">주관: {cert.org} · 학습 시간: {cert.studyHours}시간</div>
              )}
              <div className="gr-cert-progress-row">
                <span className="gr-cert-progress-label">학습 진도</span>
                <div className="gr-cert-bar-wrap">
                  <div
                    className={`gr-cert-bar ${cert.status === '합격' ? 'done' : 'ing'}`}
                    style={{ width: `${cert.pct}%` }}
                  />
                </div>
                <span className="gr-cert-progress-end">
                  {cert.status === '합격' ? '완료' : `${cert.pct}%`}
                </span>
              </div>
            </div>
          ))}
          <button className="gr-cert-add-btn">자격증 추가</button>
        </div>
      </div>
    </div>
  )
}

// 성장 타임라인 히트맵 데이터 (7행 × 26열)
const HEATMAP_ROWS = 7
const HEATMAP_COLS = 26
function generateHeatmap() {
  return Array.from({ length: HEATMAP_ROWS }, (_, r) =>
    Array.from({ length: HEATMAP_COLS }, (_, c) => {
      const idx = r * HEATMAP_COLS + c
      if (idx > 220) return 0
      const base = Math.sin(idx * 0.15 + r) * 0.5 + 0.5
      return Math.floor(base * 4 + (Math.random() > 0.6 ? 1 : 0))
    })
  )
}
const HEATMAP = generateHeatmap()

const HEAT_COLORS = ['#f5ece6', '#f5c4b0', '#e8956c', '#d4693d', '#b94e28']

// NCS 역량 레이더 데이터
const RADAR_LABELS = ['데이터분석', '의사소통', '문제해결', '기획력', '학습민첩성']
const RADAR_VALUES = [0.82, 0.65, 0.74, 0.78, 0.88]

function RadarChart() {
  const cx = 160, cy = 165, r = 100
  const n = RADAR_LABELS.length
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2

  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  const toXY = (val, i) => ({
    x: cx + r * val * Math.cos(angle(i)),
    y: cy + r * val * Math.sin(angle(i)),
  })

  const dataPoints = RADAR_VALUES.map((v, i) => toXY(v, i))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z'

  return (
    <svg width="100%" height="auto" viewBox="0 0 320 310" style={{ display: 'block' }}>
      {/* 그리드 */}
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => toXY(level, i))
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z'
        return <path key={level} d={path} fill="none" stroke="#e8ddd8" strokeWidth="1" />
      })}

      {/* 축선 */}
      {Array.from({ length: n }, (_, i) => {
        const pt = toXY(1, i)
        return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#e8ddd8" strokeWidth="1" />
      })}

      {/* 데이터 영역 */}
      <path d={dataPath} fill="#e8956c" fillOpacity="0.3" stroke="#c4603d" strokeWidth="2" />

      {/* 데이터 포인트 */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#c4603d" />
      ))}

      {/* 라벨 */}
      {Array.from({ length: n }, (_, i) => {
        const pt = toXY(1.32, i)
        const yOffset = i === 0 ? 14 : 0
        return (
          <text key={i} x={pt.x} y={pt.y + yOffset} textAnchor="middle" dominantBaseline="middle"
            fontSize="13" fill="#555" fontWeight="600">
            {RADAR_LABELS[i]}
          </text>
        )
      })}
    </svg>
  )
}

export default function GrowthReport({ onNavigate }) {
  const [certModalOpen, setCertModalOpen] = useState(false)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)

  return (
    <div className="gr-root">
      {certModalOpen && <CertModal onClose={() => setCertModalOpen(false)} />}
      {pdfModalOpen && <PdfModal onClose={() => setPdfModalOpen(false)} />}
      {/* 페이지 타이틀 */}
      <div className="gr-page-title">
        <h2>성장 리포트</h2>
        <p>공백기 247일의 기록이 포트폴리오로 완성됩니다</p>
      </div>

      {/* 배너 */}
      <div className="gr-banner">
        <div className="gr-banner-label">STEPPING STONE · 2024 → 2025</div>
        <div className="gr-banner-title">잠시 멈춤이 만든 247일의 자산</div>
        <div className="gr-banner-stats">실천 247일 · NCS 역량 12개 · 자격증 3개 취득</div>
      </div>

      {/* 타임라인 + 레이더 */}
      <div className="gr-row">
        {/* 성장 타임라인 */}
        <div className="gr-card gr-card-wide">
          <p className="gr-card-title">성장 타임라인</p>
          <div className="gr-heatmap-wrap">
            <span className="gr-heatmap-label">활동 히트맵</span>
            <div className="gr-heatmap">
              {HEATMAP.flat().map((val, i) => (
                <div
                  key={i}
                  className="gr-heatmap-cell"
                  style={{ background: HEAT_COLORS[Math.min(val, 4)] }}
                />
              ))}
            </div>
            <div className="gr-heatmap-legend">
              <span>적음</span>
              {HEAT_COLORS.map((c, i) => (
                <div key={i} className="gr-legend-cell" style={{ background: c }} />
              ))}
              <span>많음</span>
            </div>
          </div>
        </div>

        {/* NCS 역량 레이더 */}
        <div className="gr-card gr-radar-card">
          <p className="gr-card-title">NCS 역량 레이더</p>
          <RadarChart />
        </div>
      </div>

      {/* 하단 3카드 */}
      <div className="gr-row gr-bottom-row">
        {/* STAR 자기소개서 */}
        <div className="gr-card gr-bottom-card">
          <p className="gr-card-title">STAR 자기소개서</p>
          <p className="gr-bottom-desc">7개 NCS 경험을 기업별 직무기술서에 맞춰 자동 변환한 자기소개서 초안 모음</p>
          <p className="gr-bottom-accent">7개 초안 · 마지막 업데이트 2일 전</p>
          <button className="gr-view-btn" onClick={() => onNavigate?.('mapping')}>보기 →</button>
        </div>

        {/* 자격증 증빙 */}
        <div className="gr-card gr-bottom-card">
          <p className="gr-card-title">자격증 증빙</p>
          <p className="gr-bottom-desc">ADsP · SQLD 합격증과 응시 데이터, 학습 시간 누적 통계</p>
          <p className="gr-bottom-accent">2개 합격 · 누적 184시간</p>
          <button className="gr-view-btn" onClick={() => setCertModalOpen(true)}>보기 →</button>
        </div>

        {/* 포트폴리오 내보내기 */}
        <div className="gr-card gr-bottom-card">
          <p className="gr-card-title">포트폴리오 내보내기</p>
          <p className="gr-bottom-desc">포트폴리오 PDF 생성</p>
          <button className="gr-export-btn" onClick={() => setPdfModalOpen(true)}>내보내기</button>
        </div>
      </div>
    </div>
  )
}
