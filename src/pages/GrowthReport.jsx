import './GrowthReport.css'

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
  const cx = 120, cy = 120, r = 80
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
    <svg width="240" height="240" viewBox="0 0 240 240">
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
        const pt = toXY(1.28, i)
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fill="#555" fontWeight="600">
            {RADAR_LABELS[i]}
          </text>
        )
      })}
    </svg>
  )
}

export default function GrowthReport() {
  return (
    <div className="gr-root">
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
              {HEATMAP.map((row, r) => (
                <div key={r} className="gr-heatmap-row">
                  {row.map((val, c) => (
                    <div
                      key={c}
                      className="gr-heatmap-cell"
                      style={{ background: HEAT_COLORS[Math.min(val, 4)] }}
                    />
                  ))}
                </div>
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
          <button className="gr-view-btn">보기 →</button>
        </div>

        {/* 자격증 증빙 */}
        <div className="gr-card gr-bottom-card">
          <p className="gr-card-title">자격증 증빙</p>
          <p className="gr-bottom-desc">ADsP · SQLD 합격증과 응시 데이터, 학습 시간 누적 통계</p>
          <p className="gr-bottom-accent">2개 합격 · 누적 184시간</p>
          <button className="gr-view-btn">보기 →</button>
        </div>

        {/* 포트폴리오 내보내기 */}
        <div className="gr-card gr-bottom-card">
          <p className="gr-card-title">포트폴리오 내보내기</p>
          <p className="gr-bottom-desc">포트폴리오 PDF 생성</p>
          <button className="gr-export-btn">내보내기</button>
        </div>
      </div>
    </div>
  )
}
