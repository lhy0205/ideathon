import { useState } from 'react'

export default function ResetPasswordForm({ onGoLogin }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { api } = await import('../../api')
      await api.requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="lf" onSubmit={handleSubmit}>
      <div className="lf-field">
        <label className="lf-label">가입 이메일</label>
        <input
          type="email"
          className="lf-input"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {sent && (
        <div style={{
          background: '#EEF7EE', color: '#2D7A2D', fontSize: '13px',
          fontWeight: '600', padding: '10px 14px', borderRadius: '8px',
          border: '1px solid #C2E4C2', textAlign: 'center', marginBottom: '8px',
        }}>
          ✓ 재설정 메일이 발송되었습니다.
        </div>
      )}

      {error && (
        <div style={{ color: '#e53e3e', fontSize: '13px', textAlign: 'center' }}>{error}</div>
      )}

      <button type="submit" className="lf-btn" style={{ marginTop: '8px' }} disabled={loading}>
        {loading ? '발송 중...' : '재설정 메일 보내기 ✉'}
      </button>

      <div className="lf-footer">
        <span className="lf-link" onClick={onGoLogin}>← 로그인으로 돌아가기</span>
      </div>
    </form>
  )
}
