import { useNavigate } from 'react-router-dom'
import Register from '../Register'
import './Auth.css'

export default function Auth() {
  const navigate = useNavigate()

  return (
    <div className="auth-page">
      <button className="auth-back-btn" onClick={() => navigate('/')}>← 홈으로</button>
      <Register />
    </div>
  )
}
