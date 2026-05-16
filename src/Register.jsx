import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Register.css'

function Register() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    jobInterest: '',
    startDate: '',
  })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [passwordError, setPasswordError] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'password') {
      setPasswordError(value.length > 0 && value.length < 8)
    }
  }

  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setLoginForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { api, saveTokens } = await import('./api')
      const data = await api.login(loginForm.email, loginForm.password)
      saveTokens(data.access_token, data.refresh_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { api, saveTokens } = await import('./api')
      const data = await api.register({
        email: form.email,
        password: form.password,
        name: form.name,
        job_interest: form.jobInterest,
        gap_start_date: form.startDate ? form.startDate + '-01' : null,
      })
      saveTokens(data.access_token, data.refresh_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Pause to Pass</h1>
          <p className="auth-subtitle">공백기를 합격의 자산으로</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            로그인
          </button>
          <button
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            회원가입
          </button>
          <button
            className={`auth-tab ${activeTab === 'reset' ? 'active' : ''}`}
            onClick={() => setActiveTab('reset')}
          >
            비밀번호 변경
          </button>
        </div>

        {error && (
          <div style={{ color: '#e53e3e', fontSize: '13px', textAlign: 'center', marginBottom: '8px' }}>{error}</div>
        )}

        {activeTab === 'login' && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">아이디 (이메일)</label>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="example@email.com"
                value={loginForm.email}
                onChange={handleLoginChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input
                className="form-input"
                type="password"
                name="password"
                placeholder="비밀번호 입력"
                value={loginForm.password}
                onChange={handleLoginChange}
              />
              <button
                type="button"
                className="link-btn"
                style={{ alignSelf: 'flex-end', marginTop: '4px' }}
                onClick={() => setActiveTab('reset')}
              >
                비밀번호 찾기
              </button>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <div className="divider">
              <span className="divider-text">또는</span>
            </div>

            <div className="social-buttons">
              <button type="button" className="social-btn kakao">카카오</button>
              <button type="button" className="social-btn naver">네이버</button>
              <button type="button" className="social-btn google">구글</button>
            </div>

            <p className="auth-footer">
              계정이 없으신가요?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => setActiveTab('register')}
              >
                회원가입
              </button>
            </p>
          </form>
        )}

        {activeTab === 'register' && (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">이름</label>
              <input
                className="form-input"
                type="text"
                name="name"
                placeholder="홍길동"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">이메일</label>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input
                className={`form-input ${passwordError ? 'input-error' : ''}`}
                type="password"
                name="password"
                placeholder="8자 이상"
                value={form.password}
                onChange={handleChange}
              />
              {passwordError && (
                <p className="error-message">비밀번호를 입력하세요</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호 확인</label>
              <input
                className="form-input"
                type="password"
                name="passwordConfirm"
                placeholder="비밀번호 재입력"
                value={form.passwordConfirm}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">관심 직무</label>
              <div className="select-wrapper">
                <select
                  className="form-select"
                  name="jobInterest"
                  value={form.jobInterest}
                  onChange={handleChange}
                >
                  <option value="" disabled>선택하세요</option>
                  <option value="dev">개발</option>
                  <option value="design">디자인</option>
                  <option value="pm">기획/PM</option>
                  <option value="marketing">마케팅</option>
                  <option value="data">데이터</option>
                </select>
                <span className="select-arrow">&#8964;</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">공백기 시작일</label>
              <div className="date-wrapper">
                <input
                  className="form-input date-input"
                  type="month"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                />
                <span className="date-icon">&#128197;</span>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '가입 중...' : '가입하고 시작하기+'}
            </button>

            <p className="auth-footer">
              이미 계정이 있으신가요?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => setActiveTab('login')}
              >
                로그인
              </button>
            </p>
          </form>
        )}

        {activeTab === 'reset' && (
          <ResetForm setActiveTab={setActiveTab} />
        )}
      </div>
    </div>
  )
}

function ResetForm({ setActiveTab }) {
  const [resetEmail, setResetEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)
    try {
      const { api } = await import('./api')
      await api.requestPasswordReset(resetEmail)
      setSent(true)
    } catch (err) {
      setResetError(err.message)
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleResetSubmit}>
      <p className="auth-footer" style={{ color: '#3b1a0e', marginBottom: '8px' }}>
        가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.
      </p>
      <div className="form-group">
        <label className="form-label">이메일</label>
        <input
          className="form-input"
          type="email"
          placeholder="example@email.com"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          required
        />
      </div>
      {sent && (
        <div style={{ color: '#2D7A2D', fontSize: '13px', textAlign: 'center', marginBottom: '8px' }}>
          ✓ 재설정 메일이 발송되었습니다.
        </div>
      )}
      {resetError && (
        <div style={{ color: '#e53e3e', fontSize: '13px', textAlign: 'center', marginBottom: '8px' }}>{resetError}</div>
      )}
      <button type="submit" className="submit-btn" disabled={resetLoading}>
        {resetLoading ? '발송 중...' : '재설정 링크 보내기'}
      </button>
      <p className="auth-footer">
        <button type="button" className="link-btn" onClick={() => setActiveTab('login')}>
          로그인으로 돌아가기
        </button>
      </p>
    </form>
  )
}

export default Register
