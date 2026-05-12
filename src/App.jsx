import { useState } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('reset')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', confirm: '', name: '', job: '', startDate: '' })
  const [pwError, setPwError] = useState('')
  const [resetEmail, setResetEmail] = useState('')

  const handleReset = (e) => {
    e.preventDefault()
  }

  return (
    <div className="page">
      <header className="site-header">
        <div className="logo-area">
          <span className="logo-title">Pause to Pass</span>
          <span className="logo-sep"> - </span>
          <span className="logo-sub">나의 오늘이 내일의 발판이 되지 못하는 불안</span>
        </div>
      </header>

      <main className="main-content">
        <div className="auth-card">
          <div className="card-header">
            <div className="card-logo-text">Pause to Pass</div>
            <p className="card-tagline">공백기를 합격의 자산으로</p>
          </div>

          <div className="tab-bar">
            {[
              { key: 'login', label: '로그인' },
              { key: 'register', label: '회원가입' },
              { key: 'reset', label: '비밀번호 변경' },
            ].map((t) => (
              <button
                key={t.key}
                className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="card-body">
            {activeTab === 'login' && (
              <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                <div className="field">
                  <label>이메일</label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>비밀번호</label>
                  <input
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
                <button type="submit" className="primary-btn">로그인</button>
                <p className="form-link">
                  <button type="button" className="text-btn" onClick={() => setActiveTab('reset')}>
                    비밀번호를 잊으셨나요?
                  </button>
                </p>
              </form>
            )}

            {activeTab === 'register' && (
              <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                <div className="field">
                  <label>이름</label>
                  <input
                    type="text"
                    placeholder="홍길동"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>이메일</label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>비밀번호</label>
                  <input
                    type="password"
                    placeholder="8자 이상"
                    value={registerForm.password}
                    className={pwError ? 'input-error' : ''}
                    onChange={(e) => {
                      setRegisterForm({ ...registerForm, password: e.target.value })
                      setPwError(e.target.value.length > 0 && e.target.value.length < 8 ? '비밀번호를 입력해주세요' : '')
                    }}
                  />
                  {pwError && <span className="error-msg">{pwError}</span>}
                </div>
                <div className="field">
                  <label>비밀번호 확인</label>
                  <input
                    type="password"
                    placeholder="비밀번호 재입력"
                    value={registerForm.confirm}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirm: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>관심 직무</label>
                  <div className="select-wrapper">
                    <select
                      value={registerForm.job}
                      onChange={(e) => setRegisterForm({ ...registerForm, job: e.target.value })}
                    >
                      <option value="">선택하세요</option>
                      <option value="개발">개발</option>
                      <option value="디자인">디자인</option>
                      <option value="기획">기획</option>
                      <option value="마케팅">마케팅</option>
                      <option value="영업">영업</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>공백기 시작일</label>
                  <div className="date-wrapper">
                    <input
                      type="month"
                      placeholder="——년 - 월"
                      value={registerForm.startDate}
                      onChange={(e) => setRegisterForm({ ...registerForm, startDate: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="primary-btn">가입하고 시작하기+</button>
                <p className="form-link">
                  이미 계정이 있으신가요?{' '}
                  <button type="button" className="text-btn underline" onClick={() => setActiveTab('login')}>
                    로그인
                  </button>
                </p>
              </form>
            )}

            {activeTab === 'reset' && (
              <form className="auth-form" onSubmit={handleReset}>
                <div className="field">
                  <label>가입 이메일</label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="primary-btn">재설정 메일 보내기 ✉</button>
                <p className="form-link">
                  <button type="button" className="text-btn" onClick={() => setActiveTab('login')}>
                    ← 로그인으로 돌아가기
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
