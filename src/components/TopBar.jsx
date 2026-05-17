import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './TopBar.css'

const INITIAL_NOTIFICATIONS = [
  { id: 1, text: '오늘의 미션을 완료해보세요!', time: '1시간 전', unread: true },
  { id: 2, text: '새로운 경험을 입력하면 NCS 역량이 추출됩니다.', time: '어제', unread: false },
]

export default function TopBar({ title, user, onProfileClick }) {
  const navigate = useNavigate()
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const bellRef = useRef(null)
  const unreadCount = notifications.filter(n => n.unread).length

  useEffect(() => {
    if (!showNotif) return
    const handleOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotif(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showNotif])

  const handleDismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleProfile = () => {
    if (onProfileClick) onProfileClick()
    else navigate('/mypage')
  }

  return (
    <div className="topbar">
      <span className="topbar-breadcrumb">{title}</span>
      <div className="topbar-right">
        <div className="topbar-bell-wrap" ref={bellRef}>
          <button className="topbar-bell-btn" onClick={() => setShowNotif(v => !v)}>
            🔔
            {unreadCount > 0 && <span className="topbar-bell-dot">{unreadCount}</span>}
          </button>
          {showNotif && (
            <div className="topbar-notif-panel">
              <p className="topbar-notif-title">알림</p>
              {notifications.length === 0 ? (
                <p className="topbar-notif-empty">새로운 알림이 없습니다</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`topbar-notif-item ${n.unread ? 'unread' : ''}`}>
                    <div className="topbar-notif-body">
                      <p className="topbar-notif-text">{n.text}</p>
                      <p className="topbar-notif-time">{n.time}</p>
                    </div>
                    <button
                      className="topbar-notif-dismiss"
                      onClick={() => handleDismiss(n.id)}
                      title="알림 삭제"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <button className="topbar-user-btn" onClick={handleProfile} title="프로필 보기">
          {user?.name?.slice(0, 2) || ''}
        </button>
      </div>
    </div>
  )
}
