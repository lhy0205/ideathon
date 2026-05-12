import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RegisterForm from './login/RegisterForm'
import ResetPasswordForm from './login/ResetPasswordForm'
import './Login.css'

const TABS = [
  { key: 'login', label: '로그인' },
  { key: 'register', label: '회원가입' },
  { key: 'reset', label: '비밀번호 변경' },
]

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')

  return (
    <div className="login-page">
      {/* nav */}
      <nav className="login-nav">
        <span className="login-nav-logo" onClick={() => navigate('/')}>Pause to Pass</span>
        <span className="login-nav-divider"> - </span>
        <span className="login-nav-sub">나의 오늘이 내일의 발판이 되지 못하는 불안</span>
      </nav>

      {/* card */}
      <div className="login-card">
        <div className="login-card-head">
          <div className="login-brand">Pause to Pass</div>
          <div className="login-brand-sub">공백기를 합격의 자산으로</div>
        </div>

        {/* tabs */}
        <div className="login-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`login-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* tab content */}
        <div className="login-body">
          {tab === 'login' && <LoginForm />}
          {tab === 'register' && <RegisterForm />}
          {tab === 'reset' && <ResetPasswordForm />}
        </div>
      </div>
    </div>
  )
}

function LoginForm() {
  const navigate = useNavigate()

  return (
    <form className="lf" onSubmit={e => e.preventDefault()}>
      <div className="lf-field">
        <label className="lf-label">아이디 (이메일)</label>
        <input type="email" className="lf-input" placeholder="example@email.com" />
      </div>
      <div className="lf-field">
        <label className="lf-label">비밀번호</label>
        <input type="password" className="lf-input" placeholder="비밀번호 입력" />
        <span className="lf-find">비밀번호 찾기</span>
      </div>
      <button type="submit" className="lf-btn">로그인</button>

      <div className="lf-divider"><span>또는</span></div>

      <div className="lf-social">
        <button type="button" className="social-btn kakao">카카오</button>
        <button type="button" className="social-btn naver">네이버</button>
        <button type="button" className="social-btn google">구글</button>
      </div>

      <div className="lf-footer">
        계정이 없으신가요?{' '}
        <span className="lf-link" onClick={() => navigate('/login', { state: { tab: 'register' } })}>
          회원가입
        </span>
      </div>
    </form>
  )
}
