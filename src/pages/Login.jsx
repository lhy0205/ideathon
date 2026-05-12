import { useNavigate } from 'react-router-dom'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="login-page">
      <div className="login-box">
        <button className="back-btn" onClick={() => navigate('/')}>← 홈으로</button>
        <div className="login-logo">Pause to Pass</div>
        <h1 className="login-title">로그인</h1>
        <p className="login-sub">공백기를 합격으로 바꾸는 여정을 시작하세요.</p>
        <form className="login-form" onSubmit={e => e.preventDefault()}>
          <input type="email" placeholder="이메일" className="login-input" />
          <input type="password" placeholder="비밀번호" className="login-input" />
          <button type="submit" className="login-btn">로그인</button>
        </form>
        <div className="login-footer">
          아직 계정이 없으신가요? <span className="link">회원가입</span>
        </div>
      </div>
    </div>
  )
}
