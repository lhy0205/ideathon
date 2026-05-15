import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import './Mission.css'

export default function Mission() {
  const [missions, setMissions] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [heatmap, setHeatmap] = useState([])
  const [loadingRec, setLoadingRec] = useState(false)
  const [verifyTarget, setVerifyTarget] = useState(null)
  const [verifyText, setVerifyText] = useState('')
  const [verifyFile, setVerifyFile] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      const [m, h] = await Promise.all([
        api.getMissions(),
        api.getMissionHeatmap(),
      ])
      setMissions(m)
      setHeatmap(h.heatmap || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function handleRecommend() {
    setLoadingRec(true)
    setMsg('')
    try {
      const data = await api.recommendMissions()
      setRecommendations(data.recommendations || [])
    } catch (e) {
      setMsg('추천 실패: ' + e.message)
    } finally {
      setLoadingRec(false)
    }
  }

  async function handleAddRecommended(rec) {
    try {
      const mission = await api.createMission({
        title: rec.title,
        content: rec.content,
        mission_type: rec.mission_type,
      })
      setMissions(prev => [...prev, mission])
      setMsg(`'${rec.title}' 미션이 추가되었습니다.`)
    } catch (e) {
      setMsg('추가 실패: ' + e.message)
    }
  }

  async function handleComplete(id) {
    try {
      const updated = await api.completeMission(id)
      setMissions(prev => prev.map(m => m.id === id ? updated : m))
      fetchAll()
    } catch (e) {
      setMsg('완료 처리 실패: ' + e.message)
    }
  }

  async function handleVerifySubmit() {
    if (!verifyTarget) return
    if (!verifyText && !verifyFile) {
      setMsg('텍스트나 사진 중 하나는 입력해 주세요.')
      return
    }
    setVerifying(true)
    setMsg('')
    try {
      const updated = await api.verifyMission(verifyTarget.id, verifyText, verifyFile)
      setMissions(prev => prev.map(m => m.id === updated.id ? updated : m))
      setMsg(updated.verified ? '인증 성공! ✅' : '인증 실패: ' + updated.verification_note)
      setVerifyTarget(null)
      setVerifyText('')
      setVerifyFile(null)
    } catch (e) {
      setMsg('인증 오류: ' + e.message)
    } finally {
      setVerifying(false)
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteMission(id)
      setMissions(prev => prev.filter(m => m.id !== id))
    } catch (e) {
      setMsg('삭제 실패: ' + e.message)
    }
  }

  const heatmapMap = Object.fromEntries(heatmap.map(r => [r.date, r.count]))
  const today = new Date()
  const heatmapDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })

  return (
    <div className="mission-page">
      <h2 className="mission-title">오늘의 미션</h2>

      {msg && <div className="mission-msg">{msg}</div>}

      {/* 히트맵 */}
      <section className="mission-section">
        <div className="section-header">
          <h3>완료 기록 (최근 30일)</h3>
          <span className="today-count">
            오늘 <strong>{heatmapMap[heatmapDays[heatmapDays.length - 1]] || 0}개</strong> 완료
          </span>
        </div>
        <div className="heatmap-grid">
          {heatmapDays.map(date => {
            const count = heatmapMap[date] || 0
            const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : 3
            const isToday = date === heatmapDays[heatmapDays.length - 1]
            return (
              <div
                key={date}
                className={`heatmap-cell level-${level} ${isToday ? 'today' : ''}`}
                title={`${date}: ${count}개 완료`}
              >
                {count > 0 && <span className="heatmap-count">{count}</span>}
              </div>
            )
          })}
        </div>
        <div className="heatmap-legend">
          <span>적음</span>
          <div className="heatmap-cell level-0" />
          <div className="heatmap-cell level-1" />
          <div className="heatmap-cell level-2" />
          <div className="heatmap-cell level-3" />
          <span>많음</span>
        </div>
      </section>

      {/* 추천 미션 */}
      <section className="mission-section">
        <div className="section-header">
          <h3>AI 추천 미션</h3>
          <button className="btn-primary" onClick={handleRecommend} disabled={loadingRec}>
            {loadingRec ? '추천 중...' : '추천 받기'}
          </button>
        </div>
        {recommendations.length > 0 && (
          <div className="rec-list">
            {recommendations.map((rec, i) => (
              <div key={i} className="rec-card">
                <div className="rec-info">
                  <span className="rec-type">{rec.mission_type || '미션'}</span>
                  <strong>{rec.title}</strong>
                  <p>{rec.content}</p>
                </div>
                <button className="btn-outline" onClick={() => handleAddRecommended(rec)}>
                  추가
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 내 미션 목록 */}
      <section className="mission-section">
        <h3>내 미션 목록</h3>
        {missions.length === 0 ? (
          <p className="empty-text">등록된 미션이 없습니다. AI 추천을 받아보세요!</p>
        ) : (
          <div className="mission-list">
            {missions.map(m => (
              <div key={m.id} className={`mission-card ${m.completed ? 'completed' : ''}`}>
                <div className="mission-info">
                  <div className="mission-badges">
                    {m.mission_type && <span className="badge type">{m.mission_type}</span>}
                    {m.completed && <span className="badge done">완료</span>}
                    {m.verified && <span className="badge verified">인증 ✅</span>}
                  </div>
                  <strong>{m.title}</strong>
                  {m.content && <p>{m.content}</p>}
                  {m.verification_note && (
                    <p className="verify-note">{m.verification_note}</p>
                  )}
                  <span className="streak">🔥 {m.streak}일 연속</span>
                </div>
                <div className="mission-actions">
                  {!m.completed && (
                    <button className="btn-primary" onClick={() => handleComplete(m.id)}>
                      완료
                    </button>
                  )}
                  {!m.verified && (
                    <button className="btn-outline" onClick={() => {
                      setVerifyTarget(m)
                      setVerifyText('')
                      setVerifyFile(null)
                      setMsg('')
                    }}>
                      인증
                    </button>
                  )}
                  <button className="btn-danger" onClick={() => handleDelete(m.id)}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 인증 모달 */}
      {verifyTarget && (
        <div className="modal-overlay" onClick={() => setVerifyTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>미션 인증: {verifyTarget.title}</h3>
            <label>인증 텍스트</label>
            <textarea
              value={verifyText}
              onChange={e => setVerifyText(e.target.value)}
              placeholder="미션을 완료한 내용을 작성해 주세요"
              rows={4}
            />
            <label>인증 사진 (선택)</label>
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              onChange={e => setVerifyFile(e.target.files[0] || null)}
            />
            {verifyFile && <p className="file-name">📎 {verifyFile.name}</p>}
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleVerifySubmit} disabled={verifying}>
                {verifying ? 'AI 판단 중...' : '인증 제출'}
              </button>
              <button className="btn-outline" onClick={() => setVerifyTarget(null)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
