import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function RegisterForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '', job_interest: '', gap_start_date: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }
    setLoading(true)
    try {
      const { api, saveTokens } = await import('../../api')
      const data = await api.register({
        email: form.email,
        password: form.password,
        name: form.name,
        job_interest: form.job_interest,
        gap_start_date: form.gap_start_date,
      })
      saveTokens(data.access_token, data.refresh_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="lf" onSubmit={handleSubmit}>
      <div className="lf-field">
        <label className="lf-label">이름</label>
        <input type="text" name="name" className="lf-input" placeholder="이름 입력"
          value={form.name} onChange={handleChange} required />
      </div>
      <div className="lf-field">
        <label className="lf-label">이메일</label>
        <input type="email" name="email" className="lf-input" placeholder="example@email.com"
          value={form.email} onChange={handleChange} required />
      </div>
      <div className="lf-field">
        <label className="lf-label">비밀번호</label>
        <input type="password" name="password" className="lf-input" placeholder="비밀번호 입력"
          value={form.password} onChange={handleChange} required />
      </div>
      <div className="lf-field">
        <label className="lf-label">비밀번호 확인</label>
        <input type="password" name="passwordConfirm" className="lf-input" placeholder="비밀번호 재입력"
          value={form.passwordConfirm} onChange={handleChange} required />
      </div>
      <div className="lf-field">
        <label className="lf-label">관심 직무</label>
        <input type="text" name="job_interest" className="lf-input" placeholder="예) 데이터 분석가"
          value={form.job_interest} onChange={handleChange} />
      </div>
      <div className="lf-field">
        <label className="lf-label">공백기 시작일</label>
        <input type="month" name="gap_start_date" className="lf-input"
          value={form.gap_start_date} onChange={handleChange} />
      </div>
      {error && <div style={{ color: '#e53e3e', fontSize: '13px', textAlign: 'center' }}>{error}</div>}
      <button type="submit" className="lf-btn" disabled={loading}>
        {loading ? '가입 중...' : '가입하고 시작하기+'}
      </button>
    </form>
  )
}
