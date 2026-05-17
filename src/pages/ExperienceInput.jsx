import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import './ExperienceInput.css'

const TYPES = ['아르바이트', '인턴', '동아리/학생회', '프리랜서', '봉사활동', '개인 프로젝트', '독학/공부', '기타']
const STEPS = ['① 경험 작성', '② AI 분석중', '③ NCS 매핑 결과', '④ 자기소개서 초안']

const STAR_LABELS = {
  '[상황 S]': '상황 (Situation)',
  '[과제 T]': '과제 (Task)',
  '[행동 A]': '행동 (Action)',
  '[결과 R]': '결과 (Result)',
}

export default function ExperienceInput() {
  const [searchParams] = useSearchParams()
  const [selectedType, setSelectedType] = useState('아르바이트')
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', content: '', competency: '' })
  const [step, setStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editedDrafts, setEditedDrafts] = useState([])
  const [history, setHistory] = useState([])

  const loadHistory = () => {
    // localStorage 먼저 표시 (즉시)
    const local = JSON.parse(localStorage.getItem('exp_history') || '[]')
    if (local.length) setHistory(local)
    // API로 최신 동기화
    import('../api').then(({ api }) => {
      api.getAnalysisHistory().then(setHistory).catch(() => {})
    })
  }

  useEffect(() => {
    if (step === 0) loadHistory()
  }, [step])

  useEffect(() => {
    if (searchParams.get('step') === '3') {
      const saved = localStorage.getItem('ncs_result')
      if (saved) {
        setResult(JSON.parse(saved))
        setStep(3)
      }
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleAnalyze = async () => {
    if (!form.content) { setError('경험 내용을 입력해주세요'); return }
    if (!/[가-힣]/.test(form.content)) { setError('경험 내용을 한국어로 작성해주세요'); return }
    setError('')
    setStep(1)
    try {
      const { api } = await import('../api')
      const data = await api.analyzeExperience({
        exp_type: selectedType,
        title: form.title,
        content: form.content,
        memo: form.competency,
      })
      setResult(data)
      setStep(2)
      localStorage.setItem('ncs_result', JSON.stringify(data))
      localStorage.setItem('ncs_experience', JSON.stringify({ title: form.title, type: selectedType, content: form.content }))
      // 로컬 히스토리 누적 저장
      const newEntry = {
        idx: data.id || Date.now(),
        title: form.title || selectedType,
        exp_type: selectedType,
        ncs_count: data.ncs_items?.length || 0,
        created_at: new Date().toISOString().slice(0, 10),
        _result: data,
      }
      const prev = JSON.parse(localStorage.getItem('exp_history') || '[]')
      const merged = [newEntry, ...prev.filter(e => e.idx !== newEntry.idx)].slice(0, 20)
      localStorage.setItem('exp_history', JSON.stringify(merged))
      setHistory(merged)
      loadHistory()
    } catch (e) {
      setError('AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setStep(0)
    }
  }

  return (
    <div className="exp-root">
      {/* 페이지 제목 */}
      <div className="exp-page-title">
        <h2>경험 입력</h2>
        <p>일상 언어로 자유롭게 작성하세요. AI가 NCS 역량으로 변환합니다.</p>
      </div>

      {/* 단계 표시 */}
      <div className="exp-steps">
        {STEPS.map((s, i) => (
          <div key={i} className={`exp-step ${step === i ? 'active' : i < step ? 'done' : ''}`}>
            {s}
          </div>
        ))}
      </div>

      {/* ── STEP 0: 경험 작성 ── */}
      {step === 0 && (
        <div className="exp-body">
          <div className="exp-left">
            <div className="exp-card">
              <h3 className="exp-card-title">경험 유형 선택</h3>
              <div className="exp-type-tags">
                {TYPES.map(t => (
                  <button
                    key={t}
                    className={`exp-tag ${selectedType === t ? 'active' : ''}`}
                    onClick={() => setSelectedType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="exp-card">
              <h3 className="exp-card-title">경험 상세 입력</h3>
              <div className="exp-field">
                <label className="exp-label">경험 제목</label>
                <input
                  className="exp-input"
                  type="text"
                  name="title"
                  placeholder="예) 편의점 아르바이트 2년, 대학 동아리 기획팀장"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>
              <div className="exp-row">
                <div className="exp-field">
                  <label className="exp-label">시작 시기</label>
                  <input className="exp-input" type="month" name="startDate" value={form.startDate} onChange={handleChange} />
                </div>
                <div className="exp-field">
                  <label className="exp-label">종료 시기</label>
                  <input className="exp-input" type="month" name="endDate" value={form.endDate} onChange={handleChange} />
                </div>
              </div>
              {(form.startDate || form.endDate) && (
                <p style={{ fontSize: '12px', color: '#a08060', marginBottom: '8px' }}>
                  💡 아래 경험 내용에 기재한 기간이 위 날짜와 다르면 AI가 혼동할 수 있어요. 가능하면 일치시켜 주세요.
                </p>
              )}
              {(() => {
                if (!form.startDate || !form.endDate) return null
                const [sy, sm] = form.startDate.split('-').map(Number)
                const [ey, em] = form.endDate.split('-').map(Number)
                const months = (ey - sy) * 12 + (em - sm)
                if (months < 12) return null
                return (
                  <div style={{
                    background: '#fff8e1', border: '1px solid #ffe082',
                    borderRadius: '8px', padding: '10px 14px',
                    fontSize: '13px', color: '#7a5c00', marginBottom: '10px',
                  }}>
                    ⏳ 기간이 <strong>약 {Math.round(months)}개월</strong>로 길어요!
                    시기별로 나눠서 입력하면 더 정확한 분석이 가능해요.
                  </div>
                )
              })()}
              <div className="exp-field">
                <label className="exp-label">경험 내용 (자유롭게 작성)</label>
                <textarea
                  className="exp-textarea"
                  name="content"
                  rows={5}
                  placeholder="예) 야간 혼자 편의점 운영했어요. 재고 체크, 발주, 고객 트러블 대응, 현금 정산까지 혼자 다 했습니다."
                  value={form.content}
                  onChange={handleChange}
                />
                <p style={{ fontSize: '12px', color: '#c4603d', margin: '6px 0 0' }}>
                  ⚠️ 의미 없는 글자(예: ㅁㄴㅇ, 아무말)를 입력하면 분석 결과가 엉터리로 나옵니다.
                </p>
              </div>
              <div className="exp-field">
                <label className="exp-label">어떤 역량이 성장했다고 느끼나요? <span className="exp-optional">(선택)</span></label>
                <textarea
                  className="exp-textarea"
                  name="competency"
                  rows={2}
                  placeholder="예) 혼자 책임지는 능력, 고객 응대 방법, 문제가 생겼을 때 빠르게 판단하는 것"
                  value={form.competency}
                  onChange={handleChange}
                />
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 8px', lineHeight: '1.6' }}>
              💡 구체적인 경험을 입력할수록 정확한 분석 결과가 나옵니다.<br />
              모호하거나 짧은 내용은 AI가 없는 내용을 만들어 낼 수 있어요.
            </p>
            {error && <p className="exp-error">{error}</p>}
            <button className="exp-submit-btn" onClick={handleAnalyze}>
              AI NCS 분석 시작하기
            </button>
          </div>

          <div className="exp-right">
            <div className="exp-card">
              <h3 className="exp-card-title">입력 도우미</h3>
              <p className="exp-helper-desc">이런 내용을 포함하면 더 정확한 분석이 가능해요</p>
              <ul className="exp-helper-list">
                <li>구체적인 업무나 역할 (예: 재고 파악, 팀 일정 조율)</li>
                <li>어려웠던 상황과 어떻게 해결했는지</li>
                <li>함께 일한 사람 수 또는 규모</li>
                <li>기간과 빈도 (주 3회, 야간 전담 등)</li>
              </ul>
            </div>
            <div className="exp-card">
              <h3 className="exp-card-title">이전 입력 경험</h3>
              <div className="exp-prev-list">
                {history.length === 0
                  ? <p style={{ fontSize: '13px', color: '#aaa' }}>아직 분석한 경험이 없습니다</p>
                  : history.map((e) => (
                    <div key={e.idx} className="exp-prev-item" style={{ cursor: 'pointer' }}
                      onClick={async () => {
                        setForm(prev => ({ ...prev, title: e.title || '', content: '' }))
                        setSelectedType(e.exp_type || '아르바이트')
                        if (e._result) {
                          setResult(e._result)
                          setStep(2)
                          return
                        }
                        try {
                          const { api } = await import('../api')
                          const detail = await api.getAnalysisDetail(e.idx)
                          setResult(detail)
                          setStep(2)
                        } catch { setError('불러오기에 실패했습니다.') }
                      }}
                    >
                      <p className="exp-prev-title">{e.title}</p>
                      <p className="exp-prev-meta">NCS {e.ncs_count}개 추출 · {e.created_at}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1: AI 분석중 로딩 ── */}
      {step === 1 && (
        <div className="exp-loading-wrap">
          <div className="exp-spinner" />
          <p className="exp-loading-title">AI가 경험을 분석하고 있어요</p>
          <p className="exp-loading-sub">NCS 역량 14,000개 중 가장 적합한 항목을 찾고 있습니다...</p>
          <div className="exp-loading-dots">
            <span /><span /><span />
          </div>
        </div>
      )}

      {/* ── STEP 2: NCS 매핑 결과 ── */}
      {step === 2 && result && (
        <div className="exp-result-wrap">
          <div className="exp-result-header">
            <div>
              <p className="exp-result-title">NCS 매핑 결과</p>
              <p className="exp-result-sub">
                AI가 <strong>"{form.title || selectedType}"</strong> 경험에서 {result.ncs_items.length}개의 NCS 역량을 추출했습니다
              </p>
            </div>
            <button className="exp-next-btn" onClick={() => setStep(3)}>자기소개서 초안 보기 →</button>
          </div>

          {result.summary && (
            <div className="exp-summary-box">
              <span className="exp-summary-label">역량 요약</span>
              <p>{result.summary}</p>
            </div>
          )}

          <div className="exp-ncs-list">
            {result.ncs_items.map((item, i) => (
              <div key={i} className="exp-ncs-card">
                <div className="exp-ncs-top">
                  <span className="exp-ncs-name">{item.unit_name}</span>
                  <span className="exp-ncs-badge">숙련도 Lv.{item.level}</span>
                </div>
                <p className="exp-ncs-code">{item.ncs_code}</p>
                <div className="exp-bar-wrap">
                  <div className="exp-bar-fill" style={{ width: `${item.score}%` }} />
                </div>
                <div className="exp-bar-meta">
                  <span>적합도</span>
                  <span>{item.score}%</span>
                </div>
              </div>
            ))}
          </div>

          <button className="exp-restart-btn" onClick={() => { setStep(0); setResult(null); setForm({ title: '', startDate: '', endDate: '', content: '', competency: '' }); setSelectedType('아르바이트') }}>
            + 새 경험 추가하기
          </button>
        </div>
      )}

      {/* ── STEP 3: 자기소개서 초안 ── */}
      {step === 3 && result && (
        <div className="exp-result-wrap">
          <div className="exp-result-header">
            <div>
              <p className="exp-result-title">자기소개서 초안 (STAR)</p>
              <p className="exp-result-sub">AI가 STAR 구조로 자기소개서 초안을 작성했습니다. 클릭하여 편집하세요.</p>
            </div>
            <button className="exp-back-btn" onClick={() => setStep(2)}>← NCS 결과로 돌아가기</button>
          </div>

          {result.intro && (
            <div className="exp-star-card" style={{ marginBottom: '12px' }}>
              <p className="exp-star-label">자기소개</p>
              <p className="exp-star-text">{result.intro}</p>
            </div>
          )}

          <div className="exp-star-list">
            {(editing ? editedDrafts : result.star_drafts).map((draft, i) => {
              const labelKey = Object.keys(STAR_LABELS).find(k => draft.startsWith(k))
              const label = labelKey ? STAR_LABELS[labelKey] : `항목 ${i + 1}`
              const text  = labelKey ? draft.slice(labelKey.length).trim() : draft
              return (
                <div key={i} className="exp-star-card">
                  <p className="exp-star-label">{label}</p>
                  {editing ? (
                    <textarea
                      className="exp-textarea"
                      rows={4}
                      value={editedDrafts[i] || ''}
                      onChange={(e) => setEditedDrafts(prev => prev.map((d, j) => j === i ? e.target.value : d))}
                      style={{ marginTop: '6px', width: '100%' }}
                    />
                  ) : (
                    <p className="exp-star-text">{text}</p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="exp-star-btns">
            <button className="exp-submit-btn" style={{ flex: 1 }} onClick={() => {
              if (!editing) setEditedDrafts([...result.star_drafts])
              else setResult(prev => ({ ...prev, star_drafts: editedDrafts }))
              setEditing(prev => !prev)
            }}>
              {editing ? '✅ 편집 완료' : '✏️ 전체 편집하기'}
            </button>
            <button className="exp-copy-btn" style={{ flex: 1 }} onClick={() => {
              const parts = []
              if (result.intro) parts.push('【자기소개】\n' + result.intro)
              const drafts = editing ? editedDrafts : result.star_drafts
              if (drafts.length) parts.push('【주요 경험】\n' + drafts.join('\n\n'))
              if (result.aspiration) parts.push('【향후 포부】\n' + result.aspiration)
              navigator.clipboard.writeText(parts.join('\n\n'))
                .then(() => alert('복사되었습니다!'))
            }}>
              📋 복사하기
            </button>
          </div>

          {result.aspiration && (
            <div className="exp-star-card" style={{ marginTop: '12px' }}>
              <p className="exp-star-label">향후 포부</p>
              <p className="exp-star-text">{result.aspiration}</p>
            </div>
          )}
          <button className="exp-submit-btn" onClick={async () => {
            try {
              const { api } = await import('../api')
              await api.downloadReport({
                user_name: '사용자',
                summary: result.summary,
                intro: result.intro || '',
                aspiration: result.aspiration || '',
                ncs_items: result.ncs_items,
                star_drafts: editing ? editedDrafts : result.star_drafts,
                certs: [],
              })
            } catch (e) {
              alert('PDF 생성 실패: ' + e.message)
            }
          }}>
            📄 PDF로 저장하기
          </button>

          <button className="exp-restart-btn" onClick={() => { setStep(0); setResult(null); setForm({ title: '', startDate: '', endDate: '', content: '', competency: '' }); setSelectedType('아르바이트') }}>
            + 새 경험 추가하기
          </button>
        </div>
      )}
    </div>
  )
}
