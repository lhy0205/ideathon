import { useState } from 'react'
import './ExperienceInput.css'

const TYPES = ['아르바이트', '인턴', '동아리/학생회', '프리랜서', '봉사활동', '개인 프로젝트', '독학/공부', '기타']
const STEPS = ['① 경험 작성', '② AI 분석중', '③ NCS 매핑 결과', '④ 자기소개서 초안']

const PREV_EXPERIENCES = [
  { title: '편의점 아르바이트 2년', ncs: 6, time: '3일 전' },
  { title: '대학 동아리 기획팀장', ncs: 4, time: '1주 전' },
]


const STAR_LABELS = {
  '[상황 S]': '상황 (Situation)',
  '[과제 T]': '과제 (Task)',
  '[행동 A]': '행동 (Action)',
  '[결과 R]': '결과 (Result)',
}

export default function ExperienceInput() {
  const [selectedType, setSelectedType] = useState('아르바이트')
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', content: '', competency: '' })
  const [step, setStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

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
        <p>앙상 언어로 자유롭게 작성하세요. AI가 NCS 역량으로 변환합니다.</p>
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

<<<<<<< HEAD
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
                {PREV_EXPERIENCES.map((e, i) => (
                  <div key={i} className="exp-prev-item">
                    <p className="exp-prev-title">{e.title}</p>
                    <p className="exp-prev-meta">NCS {e.ncs}개 추출 · {e.time}</p>
                  </div>
                ))}
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
          <p className="exp-loading-sub">NCS 역량 1,000개 중 가장 적합한 항목을 찾고 있습니다...</p>
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
=======
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '16px 0 12px' }}>
                ④ 자기소개서 초안 (STAR)
              </h3>
              {result.star_drafts.map((s, i) => (
                <p key={i} style={{ fontSize: '13px', lineHeight: '1.7', marginBottom: '6px' }}>{s}</p>
              ))}

              <button
                style={{ marginTop: '16px', width: '100%', padding: '12px', background: '#C75B3A', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
                onClick={async () => {
                  try {
                    const { api } = await import('../api')
                    await api.downloadReport({
                      user_name: '사용자',
                      summary: result.summary,
                      ncs_items: result.ncs_items,
                      star_drafts: result.star_drafts,
                      certs: [],
                    })
                  } catch (e) {
                    alert('PDF 생성 실패: ' + e.message)
                  }
                }}
              >
                PDF로 저장하기
              </button>
>>>>>>> origin/main
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

          <button className="exp-restart-btn" onClick={() => { setStep(0); setResult(null) }}>
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

          <div className="exp-star-list">
            {result.star_drafts.map((draft, i) => {
              const labelKey = Object.keys(STAR_LABELS).find(k => draft.startsWith(k))
              const label = labelKey ? STAR_LABELS[labelKey] : `항목 ${i + 1}`
              const text  = labelKey ? draft.slice(labelKey.length).trim() : draft
              return (
                <div key={i} className="exp-star-card">
                  <p className="exp-star-label">{label}</p>
                  <p className="exp-star-text">{text}</p>
                </div>
              )
            })}
          </div>

          <div className="exp-star-btns">
            <button className="exp-submit-btn" style={{ flex: 1 }}>✏️ 전체 편집하기</button>
            <button className="exp-copy-btn" style={{ flex: 1 }} onClick={() => {
              const text = result.star_drafts.join('\n')
              navigator.clipboard.writeText(text)
            }}>
              📋 복사하기
            </button>
          </div>

          <button className="exp-restart-btn" onClick={() => { setStep(0); setResult(null) }}>
            + 새 경험 추가하기
          </button>
        </div>
      )}
    </div>
  )
}
