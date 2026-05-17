import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import './GrowthReport.css'

// ── PDF 옵션 ──────────────────────────────────────────────────────────────────
const PDF_OPTION_DEFS = [
  { id: 'show_ncs',         label: 'NCS 역량 카드',       desc: 'NCS 역량 분석 결과' },
  { id: 'show_experiences', label: '경험 목록',            desc: '입력한 경험 유형 및 제목' },
  { id: 'show_experience',  label: 'STAR 자기소개서 초안', desc: '직무별 맞춤 자기소개서' },
  { id: 'show_ai_certs',   label: 'AI 추천 자격증',       desc: 'AI가 추천한 자격증 및 이유', requiresAiCerts: true },
  { id: 'show_cert',        label: '자격증 취득 이력',     desc: '합격증 관리' },
  { id: 'show_mission',     label: '미션 달성 현황',       desc: '총 활동일 기록' },
]

// ── PDF 모달 ──────────────────────────────────────────────────────────────────
function PdfModal({ onClose, certProofs, ncsItems, starDrafts, experiences, aiCerts, missionsActiveDays, userName }) {
  const hasAiCerts = aiCerts?.length > 0
  const [settings, setSettings] = useState({
    show_ncs: true, show_cert: true, show_experience: true, show_mission: true,
    show_experiences: true, show_ai_certs: hasAiCerts,
  })
  const [aiCertWarn, setAiCertWarn] = useState(false)

  const toggle = (id) => {
    if (id === 'show_ai_certs' && !hasAiCerts) {
      setAiCertWarn(true)
      setTimeout(() => setAiCertWarn(false), 3000)
      return
    }
    setSettings(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDownload = async () => {
    try {
      const certsData = certProofs.map(c => ({
        name: c.cert_name,
        status: c.status === '합격' ? '취득 완료' : '준비중',
        exam_date: c.exam_date || c.target_exam_date || '',
        pass_date: c.passed_date || '',
      }))
      const ncsForPdf = (ncsItems || []).map(n => ({
        ncs_code: n.ncs_code || '',
        unit_name: n.unit_name || '',
        level: Math.round((n.score || 75) / 20),
        score: n.score || 75,
      }))
      await api.downloadReport({
        user_name: userName || '사용자',
        summary: '',
        ncs_items: ncsForPdf,
        star_drafts: starDrafts || [],
        certs: certsData,
        experiences: experiences || [],
        ai_certs: (aiCerts || []).map(c => ({
          name: c.name || '',
          org: c.org || '',
          reason: c.reason || '',
          priority: c.priority || 1,
        })),
        missions_active_days: missionsActiveDays || 0,
        ...settings,
      })
    } catch (e) {
      alert('PDF 생성에 실패했습니다: ' + e.message)
    }
  }

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
          {PDF_OPTION_DEFS.map(opt => {
            const isDisabled = opt.requiresAiCerts && !hasAiCerts
            return (
              <label
                key={opt.id}
                className={`gr-pdf-option ${settings[opt.id] && !isDisabled ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={isDisabled ? () => toggle(opt.id) : undefined}
              >
                <input
                  type="checkbox"
                  checked={!!settings[opt.id] && !isDisabled}
                  onChange={() => toggle(opt.id)}
                  disabled={isDisabled}
                  className="gr-pdf-checkbox"
                />
                <div className="gr-pdf-option-text">
                  <span className="gr-pdf-option-label">{opt.label}</span>
                  <span className="gr-pdf-option-desc">
                    {isDisabled ? '자격증 로드맵에서 AI 추천을 먼저 받아주세요' : opt.desc}
                  </span>
                </div>
              </label>
            )
          })}
        </div>
        {aiCertWarn && (
          <p className="gr-pdf-warn">⚠ 자격증 로드맵 페이지에서 AI 추천받기를 먼저 실행해주세요</p>
        )}
        <div className="gr-pdf-actions">
          <button className="gr-pdf-cancel" onClick={onClose}>취소</button>
          <button className="gr-pdf-download" onClick={handleDownload}>PDF 생성 및 다운로드</button>
        </div>
      </div>
    </div>
  )
}

// ── 자격증 증빙 모달 ───────────────────────────────────────────────────────────
function calcDdayStr(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0,0,0,0)) / 86400000)
  if (diff > 0) return `D-${diff}`
  if (diff === 0) return 'D-Day'
  return null
}

const EMPTY_FORM = { cert_name: '', status: '준비 중', passed_date: '', target_exam_date: '' }

function CertForm({ form, setForm, file, setFile, onSave, onCancel, saveLabel = '저장' }) {
  return (
    <div className="gr-cert-add-form">
      <input placeholder="자격증 이름 *" value={form.cert_name} onChange={e => setForm(p => ({...p, cert_name: e.target.value}))} className="gr-cert-input" />
      <select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))} className="gr-cert-input">
        <option>준비 중</option>
        <option>합격</option>
      </select>
      {form.status === '합격' ? (
        <>
          <div className="gr-cert-input-group">
            <label className="gr-cert-input-label">취득일</label>
            <input type="date" value={form.passed_date} onChange={e => setForm(p => ({...p, passed_date: e.target.value}))} className="gr-cert-input" />
          </div>
          <div className="gr-cert-input-group">
            <label className="gr-cert-input-label">합격증 첨부 (선택)</label>
            <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} className="gr-cert-input" />
          </div>
        </>
      ) : (
        <div className="gr-cert-input-group">
          <label className="gr-cert-input-label">목표 시험일</label>
          <input type="date" value={form.target_exam_date} onChange={e => setForm(p => ({...p, target_exam_date: e.target.value}))} className="gr-cert-input" />
        </div>
      )}
      <div className="gr-cert-add-actions">
        <button className="gr-cert-cancel-btn" onClick={onCancel}>취소</button>
        <button className="gr-cert-save-btn" onClick={onSave}>{saveLabel}</button>
      </div>
    </div>
  )
}

function CertModal({ onClose }) {
  const [proofs, setProofs] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [editFile, setEditFile] = useState(null)

  useEffect(() => {
    api.getCertProofs().then(setProofs).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!form.cert_name.trim()) return alert('자격증 이름을 입력해주세요')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
    if (file) fd.append('proof_image', file)
    try {
      const created = await api.createCertProof(fd)
      setProofs(prev => [created, ...prev])
      setAdding(false)
      setForm(EMPTY_FORM)
      setFile(null)
    } catch (e) { alert('추가 실패: ' + e.message) }
  }

  const handleEdit = (proof) => {
    setEditingId(proof.id)
    setEditForm({
      cert_name: proof.cert_name || '',
      status: proof.status || '준비 중',
      passed_date: proof.passed_date || '',
      target_exam_date: proof.target_exam_date || '',
    })
    setEditFile(null)
  }

  const handleUpdate = async () => {
    const fd = new FormData()
    Object.entries(editForm).forEach(([k, v]) => { if (v) fd.append(k, v) })
    if (editFile) fd.append('proof_image', editFile)
    try {
      const updated = await api.updateCertProof(editingId, fd)
      setProofs(prev => prev.map(p => p.id === editingId ? updated : p))
      setEditingId(null)
    } catch (e) { alert('수정 실패: ' + e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return
    await api.deleteCertProof(id).catch(() => {})
    setProofs(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="gr-modal-overlay" onClick={onClose}>
      <div className="gr-modal" onClick={e => e.stopPropagation()}>
        <div className="gr-modal-header">
          <span className="gr-modal-title">자격증 증빙 관리</span>
          <button className="gr-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="gr-modal-body">
          {loading && <p style={{textAlign:'center',color:'#999'}}>불러오는 중...</p>}
          {!loading && proofs.map((proof) => {
            const dday = proof.status !== '합격' ? calcDdayStr(proof.target_exam_date) : null
            return (
              <div key={proof.id} className={`gr-cert-item ${proof.status !== '합격' ? 'preparing' : ''}`}>
                {editingId === proof.id ? (
                  <CertForm
                    form={editForm} setForm={setEditForm}
                    file={editFile} setFile={setEditFile}
                    onSave={handleUpdate} onCancel={() => setEditingId(null)}
                    saveLabel="수정 완료"
                  />
                ) : (
                  <>
                    <div className="gr-cert-top">
                      <span className="gr-cert-name">{proof.cert_name}</span>
                      <span className={`gr-cert-badge ${proof.status === '합격' ? 'pass' : 'ready'}`}>{proof.status}</span>
                      <button className="gr-cert-edit-btn" onClick={() => handleEdit(proof)}>수정</button>
                      <button className="gr-cert-del-btn" onClick={() => handleDelete(proof.id)}>삭제</button>
                    </div>
                    <div className="gr-cert-info">
                      {proof.status === '합격'
                        ? `취득일: ${proof.passed_date || '-'}`
                        : `목표 시험일: ${proof.target_exam_date || '-'}${dday ? ` · ${dday}` : ''}`}
                    </div>
                    {proof.proof_image && (
                      <a href={proof.proof_image} target="_blank" rel="noreferrer" className="gr-cert-img-link">합격증 보기</a>
                    )}
                  </>
                )}
              </div>
            )
          })}

          {adding ? (
            <CertForm
              form={form} setForm={setForm}
              file={file} setFile={setFile}
              onSave={handleAdd} onCancel={() => { setAdding(false); setForm(EMPTY_FORM) }}
            />
          ) : (
            <button className="gr-cert-add-btn" onClick={() => setAdding(true)}>+ 자격증 추가</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 히트맵 ────────────────────────────────────────────────────────────────────
const HEAT_COLORS = ['#f5ece6', '#f5c4b0', '#e8956c', '#d4693d', '#b94e28']
const HEATMAP_COLS = 26

function Heatmap({ data }) {
  if (!data || data.length === 0) {
    const empty = Array.from({ length: 7 }, () => Array(HEATMAP_COLS).fill(0))
    data = empty
  }
  return (
    <div className="gr-heatmap">
      {data.flat().map((val, i) => (
        <div key={i} className="gr-heatmap-cell" style={{ background: HEAT_COLORS[Math.min(val, 4)] }} />
      ))}
    </div>
  )
}

// ── 레이블 2줄 분리 헬퍼 ─────────────────────────────────────────────────────
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

// ── NCS 레이더 차트 ───────────────────────────────────────────────────────────
function RadarChart({ ncsItems }) {
  const items = (ncsItems || []).slice(0, 5)
  const rawLabels = items.length > 0
    ? items.map(n => n.unit_name || '')
    : ['데이터분석', '의사소통', '문제해결', '기획력', '학습민첩성']
  const values = items.length > 0 ? items.map(n => (n.score || 75) / 100) : [0.82, 0.65, 0.74, 0.78, 0.88]
  const n = rawLabels.length
  const cx = 170, cy = 175, r = 100
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2
  const toXY = (val, i) => ({ x: cx + r * val * Math.cos(angle(i)), y: cy + r * val * Math.sin(angle(i)) })
  const dataPoints = values.map((v, i) => toXY(v, i))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z'
  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  return (
    <svg width="100%" height="auto" viewBox="0 0 340 340" style={{ display: 'block' }}>
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => toXY(level, i))
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z'
        return <path key={level} d={path} fill="none" stroke="#e8ddd8" strokeWidth="1" />
      })}
      {Array.from({ length: n }, (_, i) => {
        const pt = toXY(1, i)
        return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#e8ddd8" strokeWidth="1" />
      })}
      <path d={dataPath} fill="#e8956c" fillOpacity="0.3" stroke="#c4603d" strokeWidth="2" />
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#c4603d" />)}
      {Array.from({ length: n }, (_, i) => {
        const pt = toXY(1.42, i)
        const lines = splitLabel(rawLabels[i])
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#555" fontWeight="600">
            {lines.map((line, li) => (
              <tspan key={li} x={pt.x} dy={li === 0 ? (lines.length > 1 ? '-0.6em' : '0') : '1.3em'}>{line}</tspan>
            ))}
          </text>
        )
      })}
    </svg>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function GrowthReport() {
  const navigate = useNavigate()
  const [certModalOpen, setCertModalOpen] = useState(false)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [certProofs, setCertProofs] = useState([])
  const [ncsItems, setNcsItems] = useState(null)
  const [starDrafts, setStarDrafts] = useState([])
  const [heatmap, setHeatmap] = useState(null)
  const [aiCerts, setAiCerts] = useState([])
  const [experiences, setExperiences] = useState([])
  const [missionsActiveDays, setMissionsActiveDays] = useState(0)
  const [userName, setUserName] = useState('')
  const [history, setHistory] = useState([])
  const [radarExpSource, setRadarExpSource] = useState('all')
  const [radarNcsItems, setRadarNcsItems] = useState(null)
  const [selectedExpForPdf, setSelectedExpForPdf] = useState('all')
  const [selectedExpDetail, setSelectedExpDetail] = useState(null)

  const handleSelectExpForPdf = async (val) => {
    setSelectedExpForPdf(val)
    if (val === 'all') { setSelectedExpDetail(null); return }
    const item = history.find(h => String(h.idx) === String(val))
    if (!item) return
    try {
      const detail = await api.getAnalysisDetail(item.idx)
      setSelectedExpDetail({ ncs_items: detail.ncs_items || [], star_drafts: detail.star_drafts || [], title: item.title, exp_type: item.exp_type || '' })
    } catch {}
  }

  const handleRadarSourceChange = async (val) => {
    setRadarExpSource(val)
    if (val === 'all') {
      setRadarNcsItems(null)
    } else {
      const item = history.find(h => String(h.idx) === String(val))
      if (!item) return
      try {
        const detail = await api.getAnalysisDetail(item.idx)
        setRadarNcsItems(detail.ncs_items || [])
      } catch {}
    }
  }

  useEffect(() => {
    api.getMe().then(data => setUserName(data.name || '')).catch(() => {})
    const saved = localStorage.getItem('ncs_result')
    if (saved) {
      const parsed = JSON.parse(saved)
      setNcsItems(parsed.ncs_items || null)
      setStarDrafts(parsed.star_drafts || [])
    }
    const exp = localStorage.getItem('ncs_experience')
    if (exp) {
      const parsed = JSON.parse(exp)
      if (parsed.type || parsed.title) {
        setExperiences([{ exp_type: parsed.type || '', title: parsed.title || '' }])
      }
    }
    const savedAiCerts = localStorage.getItem('ai_certs')
    if (savedAiCerts) {
      try { setAiCerts(JSON.parse(savedAiCerts)) } catch {}
    }
    api.getCertProofs().then(setCertProofs).catch(() => {})
    api.getAnalysisHistory().then(data => setHistory(data || [])).catch(() => {})
    api.getNcsSummary().then(data => {
      if (data?.ncs_items?.length) setNcsItems(data.ncs_items.map(i => ({ ...i, score: i.avg_score ?? i.score ?? 0 })))
    }).catch(() => {})
    api.getMissionHeatmap().then(data => {
      if (data?.heatmap) {
        setHeatmap(data.heatmap)
        const activeDays = data.heatmap.flat().filter(v => v > 0).length
        setMissionsActiveDays(activeDays)
      }
    }).catch(() => {})
  }, [])

  const passedCount = certProofs.filter(c => c.status === '합격').length
  const totalStudyHours = certProofs.reduce((sum, c) => sum + (c.study_hours || 0), 0)

  const pdfNcsItems = selectedExpDetail ? selectedExpDetail.ncs_items : ncsItems
  const pdfStarDrafts = selectedExpDetail ? selectedExpDetail.star_drafts : starDrafts
  const pdfExperiences = selectedExpDetail
    ? [{ exp_type: selectedExpDetail.exp_type, title: selectedExpDetail.title }]
    : experiences

  return (
    <div className="gr-root">
      {certModalOpen && <CertModal onClose={() => { setCertModalOpen(false); api.getCertProofs().then(setCertProofs).catch(() => {}) }} />}
      {pdfModalOpen && <PdfModal onClose={() => setPdfModalOpen(false)} certProofs={certProofs} ncsItems={pdfNcsItems} starDrafts={pdfStarDrafts} experiences={pdfExperiences} aiCerts={aiCerts} missionsActiveDays={missionsActiveDays} userName={userName} />}

      <div className="gr-page-title">
        <h2>성장 리포트</h2>
        <p>공백기의 기록이 포트폴리오로 완성됩니다</p>
      </div>

      <div className="gr-banner">
        <div className="gr-banner-label">STEPPING STONE · Pause to Pass</div>
        <div className="gr-banner-title">잠시 멈춤이 만든 성장의 자산</div>
        <div className="gr-banner-stats">
          NCS 역량 {ncsItems?.length || 0}개 · 자격증 {passedCount}개 취득 · STAR 초안 {starDrafts.length}개
        </div>
      </div>

      <div className="gr-main-layout">
        {/* 왼쪽: NCS 역량 레이더 (크게) */}
        <div className="gr-card gr-radar-large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <p className="gr-card-title" style={{ margin: 0 }}>NCS 역량 레이더</p>
            {history.length > 0 && (
              <select
                className="gr-radar-select"
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
          <RadarChart ncsItems={radarNcsItems ?? ncsItems} />
        </div>

        {/* 오른쪽: 3카드 세로 배열 */}
        <div className="gr-right-col">
          <div className="gr-card gr-side-card">
            <p className="gr-card-title">STAR 자기소개서</p>
            <p className="gr-bottom-desc">NCS 경험을 기업별 직무기술서에 맞춰 자동 변환한 자기소개서 초안 모음</p>
            <p className="gr-bottom-accent">{starDrafts.length}개 초안</p>
            <button className="gr-view-btn" onClick={() => navigate('/mapping')}>보기 →</button>
          </div>

          <div className="gr-card gr-side-card">
            <p className="gr-card-title">자격증 증빙</p>
            <p className="gr-bottom-desc">자격증 취득 현황 및 합격증 관리</p>
            <p className="gr-bottom-accent">{passedCount}개 합격</p>
            <button className="gr-view-btn" onClick={() => setCertModalOpen(true)}>보기 →</button>
          </div>

          <div className="gr-card gr-side-card">
            <p className="gr-card-title">포트폴리오 내보내기</p>
            <p className="gr-bottom-desc">포트폴리오 PDF 생성</p>
            {history.length > 0 && (
              <select
                className="gr-radar-select"
                value={selectedExpForPdf}
                onChange={e => handleSelectExpForPdf(e.target.value)}
                style={{ width: '100%', marginBottom: '8px' }}
              >
                <option value="all">전체 경험 통합</option>
                {history.map(h => (
                  <option key={h.idx} value={String(h.idx)}>{h.title}</option>
                ))}
              </select>
            )}
            <button className="gr-export-btn" onClick={() => setPdfModalOpen(true)}>내보내기</button>
          </div>
        </div>
      </div>
    </div>
  )
}
