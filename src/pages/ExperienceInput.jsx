import { useState } from 'react'
import './ExperienceInput.css'

const TYPES = ['아르바이트', '인턴', '동아리/학생회', '프리랜서', '봉사활동', '개인 프로젝트', '독학/공부', '기타']

const STEPS = ['① 경험 작성', '② AI 분석중', '③ NCS 매핑 결과', '④ 자기소개서 초안']

const PREV_EXPERIENCES = [
  { title: '편의점 아르바이트 2년', ncs: 6, time: '3일 전' },
  { title: '대학 동아리 기획팀장', ncs: 4, time: '1주 전' },
]

export default function ExperienceInput() {
  const [selectedType, setSelectedType] = useState('아르바이트')
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', content: '', competency: '' })
  const [step, setStep] = useState(0)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
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
          <button
            key={i}
            className={`exp-step ${step === i ? 'active' : ''}`}
            onClick={() => setStep(i)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 본문 2단 */}
      <div className="exp-body">
        {/* 왼쪽 */}
        <div className="exp-left">
          {/* 경험 유형 */}
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

          {/* 경험 상세 입력 */}
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
                placeholder={"예) 야간 혼자 편의점 운영했어요. 재고 체크, 발주, 고객 트러블 대응, 현금 정산까지 혼자 다 했습니다. 손님이 화나서 항의할 때 어떻게 달래는지 나름대로 방법을 터득했어요."}
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

          <button className="exp-submit-btn">AI NCS 분석 시작하기</button>
        </div>

        {/* 오른쪽 */}
        <div className="exp-right">
          {/* 입력 도우미 */}
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

          {/* 이전 입력 경험 */}
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
    </div>
  )
}
