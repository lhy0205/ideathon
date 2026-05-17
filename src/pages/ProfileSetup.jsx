import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProfileSetup.css'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    gap_start_date: '',
    department: '',
    certifications: '',
    job_interest: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('이름을 입력해주세요'); return }
    setError('')
    setLoading(true)
    try {
      const { api } = await import('../api')
      await api.updateMe(form)
      navigate('/dashboard')
    } catch (e) {
      setError('저장에 실패했습니다: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ps-root">
      <div className="ps-card">
        <div className="ps-header">
          <span className="ps-brand">Pause to Pass</span>
          <h2 className="ps-title">프로필 설정</h2>
          <p className="ps-sub">나의 정보를 입력하면 더 정확한 분석이 가능해요</p>
        </div>

        <div className="ps-form">
          <div className="ps-field">
            <label className="ps-label">이름 *</label>
            <input
              className="ps-input"
              name="name"
              placeholder="예) 홍길동"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="ps-field">
            <label className="ps-label">공백기 시작 시기</label>
            <input
              className="ps-input"
              name="gap_start_date"
              type="month"
              value={form.gap_start_date}
              onChange={handleChange}
            />
          </div>

          <div className="ps-field">
            <label className="ps-label">전공 / 학과</label>
            <input
              className="ps-input"
              name="department"
              placeholder="예) 경영학과, 컴퓨터공학과"
              value={form.department}
              onChange={handleChange}
            />
          </div>

          <div className="ps-field">
            <label className="ps-label">보유 자격증</label>
            <input
              className="ps-input"
              name="certifications"
              placeholder="예) 정보처리기사, SQLD, ADsP"
              value={form.certifications}
              onChange={handleChange}
            />
          </div>

          <div className="ps-field">
            <label className="ps-label">희망 직무</label>
            <input
              className="ps-input"
              name="job_interest"
              placeholder="예) 데이터 분석, 백엔드 개발, 마케팅"
              value={form.job_interest}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && <p className="ps-error">{error}</p>}

        <button className="ps-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '저장 중...' : '시작하기 →'}
        </button>

        <button className="ps-skip" onClick={() => navigate('/dashboard')}>
          나중에 입력하기
        </button>
      </div>
    </div>
  )
}
