import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()

  const handleStart = async () => {
    try {
      const { api, saveSessionToken, hasSession } = await import('../api')
      if (hasSession()) {
        try {
          await api.getMe()
          navigate('/dashboard')
          return
        } catch {
          // 토큰 만료/무효 → 새 세션 생성
        }
      }
      const data = await api.startSession()
      saveSessionToken(data.session_token)
      navigate('/profile')
    } catch (e) {
      alert('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div className="home">
      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <span className="logo-text">Pause to Pass</span>
            <span className="nav-divider">|</span>
            <span className="nav-subtitle">나의 오늘이 내일의 발판이 되지 못하는 불안</span>
          </div>
          <button className="btn-login" onClick={handleStart}>시작하기</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <span className="hero-badge">← 공백기가 합격이 되는 서비스</span>
            <h1 className="hero-title">
              멈춤(Pause)이<br />
              합격(Pass)이<br />
              되는 순간
            </h1>
            <div className="hero-btns">
              <button className="btn-primary" onClick={handleStart}>무료로 포트폴리오 보기</button>
              <button className="btn-secondary" onClick={() => document.querySelector('.engines').scrollIntoView({ behavior: 'smooth' })}>서비스 둘러보기</button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-num">1,000+</span>
                <span className="stat-label">누적 사용자</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">85%</span>
                <span className="stat-label">합격 전환율</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">247일</span>
                <span className="stat-label">평균 공백 극복 기간</span>
              </div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-mockup">
              <div className="mockup-header">
                <span className="mockup-dot" />
                <span className="mockup-dot" />
                <span className="mockup-dot" />
              </div>
              <div className="mockup-content">
                <div className="mockup-label">나의 공백기 포트폴리오</div>
                <div className="mockup-bar">
                  <div className="mockup-bar-fill" style={{ width: '85%' }} />
                </div>
                <div className="mockup-bar">
                  <div className="mockup-bar-fill" style={{ width: '70%' }} />
                </div>
                <div className="mockup-bar">
                  <div className="mockup-bar-fill" style={{ width: '60%' }} />
                </div>
                <div className="mockup-tags">
                  <span className="mockup-tag">경험</span>
                  <span className="mockup-tag">역량</span>
                  <span className="mockup-tag">성장</span>
                  <span className="mockup-tag accent">합격</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4가지 엔진 */}
      <section className="engines">
        <div className="section-inner">
          <h2 className="section-title">4가지 엔진으로<br />공백기를 바꿉니다</h2>
          <p className="section-desc">내일의 경쟁 시장에서도 살아남을 스스로를 어필하는 방법, 지금 시작하세요.</p>
          <div className="engine-grid">
            <div className="engine-card">
              <div className="engine-icon">📋</div>
              <div className="engine-tag">Experience Archive</div>
              <h3>NCS 역량 분석</h3>
              <p>공백기의 경험을 입력하면 AI가 NCS 기반으로 역량을 분석하고 자기소개서 초안을 생성합니다.</p>
            </div>
            <div className="engine-card">
              <div className="engine-icon">🏅</div>
              <div className="engine-tag">Cert Roadmap</div>
              <h3>자격증 로드맵</h3>
              <p>내 역량과 희망 직무에 맞는 자격증을 추천하고 취득 순서를 안내합니다.</p>
            </div>
            <div className="engine-card">
              <div className="engine-icon">📊</div>
              <div className="engine-tag">Survival Diagnosis</div>
              <h3>취업 생존 진단</h3>
              <p>AI가 취업 가능성을 예측하고 선배 합격자와의 유사도를 분석해 강점을 파악합니다.</p>
            </div>
            <div className="engine-card">
              <div className="engine-icon">🎯</div>
              <div className="engine-tag">Growth Report</div>
              <h3>성장 리포트 & 미션</h3>
              <p>매일 미션으로 공백기를 기록하고 나의 성장을 시각화해 포트폴리오로 완성합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 1 */}
      <section className="feature feature-right">
        <div className="section-inner feature-inner">
          <div className="feature-text">
            <span className="feature-num">기능 1</span>
            <h2>경험을 입력하면<br />AI가 역량을 찾아냅니다</h2>
            <ul className="feature-list">
              <li>공백기 경험을 자유롭게 입력하면 NCS 기반으로 역량 자동 분류</li>
              <li>STAR 구조 자기소개서 초안을 AI가 자동 생성</li>
              <li>역량별 숙련도·적합도 점수로 나의 강점을 한눈에 확인</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="feature-card-mock">
              <div className="fmock-row accent-bg">
                <span>📋 NCS 역량 분석</span>
                <span>5개 역량 추출됨</span>
              </div>
              <div className="fmock-row">
                <span>✍️ STAR 초안</span>
                <span>자동 생성 완료</span>
              </div>
              <div className="fmock-row">
                <span>🏅 자격증 추천</span>
                <span>3개 매칭</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 2 */}
      <section className="feature feature-left bg-warm">
        <div className="section-inner feature-inner reverse">
          <div className="feature-visual">
            <div className="feature-card-mock">
              <div className="fmock-label">나의 추천 경로</div>
              <div className="fmock-path">
                <div className="path-step active">경험 정리</div>
                <div className="path-arrow">→</div>
                <div className="path-step active">역량 분석</div>
                <div className="path-arrow">→</div>
                <div className="path-step">목표 기업</div>
                <div className="path-arrow">→</div>
                <div className="path-step">합격</div>
              </div>
            </div>
          </div>
          <div className="feature-text">
            <span className="feature-num">기능 2</span>
            <h2>나에게 맞는 경로를<br />AI가 설계합니다</h2>
            <ul className="feature-list">
              <li>개인 역량과 희망 직군 기반 맞춤 로드맵 제공</li>
              <li>매 단계 피드백으로 지속적인 성장 방향 제시</li>
              <li>합격 가능성 예측 및 우선순위 과제 자동 도출</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 기능 3 */}
      <section className="feature feature-right">
        <div className="section-inner feature-inner">
          <div className="feature-text">
            <span className="feature-num">기능 3</span>
            <h2>매일 미션으로<br />성장을 기록합니다</h2>
            <ul className="feature-list">
              <li>오늘의 미션을 완료하며 공백기를 의미 있는 기록으로 전환</li>
              <li>누적 활동이 성장 리포트로 자동 시각화</li>
              <li>역량 변화 그래프로 나의 성장 흐름을 한눈에 확인</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="feature-card-mock">
              <div className="fmock-row accent-bg">
                <span>📌 오늘의 미션</span>
                <span>자기소개서 초안 완성하기</span>
              </div>
              <div className="fmock-row">
                <span>🔥 연속 달성</span>
                <span>14일 연속</span>
              </div>
              <div className="fmock-row">
                <span>📈 성장 리포트</span>
                <span>역량 3개 향상</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 4 */}
      <section className="feature feature-left bg-warm">
        <div className="section-inner feature-inner reverse">
          <div className="feature-visual">
            <div className="feature-card-mock">
              <div className="fmock-label">5분 포트폴리오</div>
              <div className="fmock-timer">5:00</div>
              <div className="fmock-desc">경험을 입력하면 AI가 자동으로<br />포트폴리오를 완성합니다.</div>
            </div>
          </div>
          <div className="feature-text">
            <span className="feature-num">기능 4</span>
            <h2>하루 5분이 모여<br />공백기가 채워집니다</h2>
            <ul className="feature-list">
              <li>에너지 상태 선택 → AI 맞춤 5분 미션 생성</li>
              <li>미션 인증 사진 업로드 및 활동 로그 저장</li>
              <li>KNN 매칭 그룹의 실시간 참여 인원 공유로 고립감 해소</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5단계 */}
      <section className="steps">
        <div className="section-inner">
          <h2 className="section-title">5단계로 공백기가<br />합격 포트폴리오가 됩니다</h2>
          <div className="steps-row">
            {[
              { num: '01', title: '경험 입력', desc: '공백기 동안의 활동과 경험을 자유롭게 입력합니다.' },
              { num: '02', title: 'NCS 역량 분석', desc: 'AI가 NCS 기반으로 역량을 분류하고 STAR 초안을 생성합니다.' },
              { num: '03', title: '자격증 추천', desc: '내 역량에 맞는 자격증과 취득 순서를 안내합니다.' },
              { num: '04', title: '생존 진단', desc: '취업 가능성을 예측하고 선배 합격자와 유사도를 비교합니다.' },
              { num: '05', title: '성장 리포트', desc: '누적 활동과 역량 변화를 시각화해 포트폴리오로 완성합니다.' },
            ].map(step => (
              <div key={step.num} className="step-card">
                <div className="step-num">{step.num}</div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 후기 */}
      <section className="testimonials">
        <div className="section-inner">
          <h2 className="section-title">공백기가 합격의<br />이야기가 되었습니다</h2>
          <div className="testimonial-grid">
            {[
              { name: '이○○', role: '대기업 마케팅 합격', text: '공백 8개월이 오히려 강점이 됐어요. Pause to Pass 덕분에 경험을 체계적으로 정리하고 나만의 스토리를 만들 수 있었습니다.' },
              { name: '김○○', role: '스타트업 기획 합격', text: '막연했던 공백기가 포트폴리오가 되는 경험, 정말 신기했어요. 생존 진단으로 내 강점을 객관적으로 파악할 수 있었습니다.' },
              { name: '박○○', role: '공공기관 NCS 합격', text: 'NCS 프레임으로 정리하니까 자소서가 완전히 달라졌어요. 공백기 때 한 일들이 이렇게 빛날 수 있다니 놀라웠습니다.' },
            ].map((t, i) => (
              <div key={i} className="testimonial-card">
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.name[0]}</div>
                  <div>
                    <div className="author-name">{t.name}</div>
                    <div className="author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="cta-section">
        <div className="section-inner cta-inner">
          <h2>공백기가 합격이 되는 곳,<br />지금 시작을 만드세요.</h2>
          <button className="btn-cta" onClick={handleStart}>공백기가 합격이 되는 곳에서 시작하기</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="section-inner">
          <span className="logo-text">Pause to Pass</span>
          <span className="footer-copy">© 2026 Pause to Pass. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
