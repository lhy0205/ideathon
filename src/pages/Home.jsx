import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()

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
          <button className="btn-login" onClick={() => navigate('/login')}>로그인</button>
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
              <button className="btn-primary" onClick={() => navigate('/login')}>무료로 포트폴리오 보기</button>
              <button className="btn-secondary">서비스 둘러보기</button>
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
              <h3>나 성장을 스토리化</h3>
              <p>공백기의 경험을 체계적으로 기록하고 설득력 있는 스토리로 전환합니다.</p>
            </div>
            <div className="engine-card">
              <div className="engine-icon">📄</div>
              <div className="engine-tag">Resume Platform</div>
              <h3>합격 자소서 분석</h3>
              <p>합격자 자기소개서를 분석해 나만의 합격 공식을 도출합니다.</p>
            </div>
            <div className="engine-card">
              <div className="engine-icon">🎙️</div>
              <div className="engine-tag">Interview AI</div>
              <h3>AI 면접 피드백 및 실전 연습</h3>
              <p>AI 기반 모의 면접으로 실전 감각을 키우고 약점을 보완합니다.</p>
            </div>
            <div className="engine-card">
              <div className="engine-icon">🎯</div>
              <div className="engine-tag">Career Guide</div>
              <h3>합격 정보 큐레이션</h3>
              <p>나에게 맞는 채용 정보와 합격 전략을 한곳에서 확인합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 1 */}
      <section className="feature feature-right">
        <div className="section-inner feature-inner">
          <div className="feature-text">
            <span className="feature-num">기능 1</span>
            <h2>빌공 연대가<br />멘탈이 됩니다</h2>
            <ul className="feature-list">
              <li>비슷한 공백을 겪고 있는 — AI로 맞춤 커뮤니티 매칭</li>
              <li>NCS 직무군별 그룹 스터디 → 합격 사례 공유</li>
              <li>매일 공백기를 서로가 서로의 동기부여가 되는 커뮤니티</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="feature-card-mock">
              <div className="fmock-row accent-bg">
                <span>📌 오늘의 미션</span>
                <span>자기소개서 초안 완성하기</span>
              </div>
              <div className="fmock-row">
                <span>👥 스터디 멤버</span>
                <span>12명 참여 중</span>
              </div>
              <div className="fmock-row">
                <span>🔥 연속 달성</span>
                <span>14일 연속</span>
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
            <h2>나의 공백기가<br />어디에서든 보여집니다</h2>
            <ul className="feature-list">
              <li>공개 포트폴리오 링크로 어디서든 공유 가능</li>
              <li>채용 담당자에게 직접 전달되는 프로필 카드</li>
              <li>활동 이력 → 시간순 스토리로 자동 정렬 및 시각화</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="feature-card-mock">
              <div className="fmock-profile">
                <div className="profile-avatar">P</div>
                <div>
                  <div className="profile-name">김지원</div>
                  <div className="profile-sub">공백기 포트폴리오 · 마케팅</div>
                </div>
              </div>
              <div className="profile-tags">
                <span className="mockup-tag">브랜드 기획</span>
                <span className="mockup-tag">SNS 운영</span>
                <span className="mockup-tag accent">합격 전환</span>
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
            <h2>5분의 보여<br />포트폴리오가 됩니다</h2>
            <ul className="feature-list">
              <li>경험 키워드 입력만으로 자동 포트폴리오 생성</li>
              <li>AI 문장 다듬기로 전문성 있는 표현 완성</li>
              <li>XS포맷의 그룹 경험 각 시간만 링크로 언제든 최신 업데이트</li>
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
              { num: '01', title: '경험 입력', desc: '공백기 동안의 활동과 경험을 입력합니다.' },
              { num: '02', title: 'NCS 프레임', desc: 'NCS 기반으로 역량을 분류·정리합니다.' },
              { num: '03', title: '포트폴리오', desc: 'AI가 스토리 중심 포트폴리오를 생성합니다.' },
              { num: '04', title: '서비스·인성 분석', desc: '직무 적합도와 인성 역량을 분석합니다.' },
              { num: '05', title: '서류 피드백', desc: '합격 가능성과 개선점을 제시합니다.' },
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
              { name: '김○○', role: '스타트업 기획 합격', text: '막연했던 공백기가 포트폴리오가 되는 경험, 정말 신기했어요. AI 면접 연습이 특히 도움이 많이 됐습니다.' },
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
          <button className="btn-cta" onClick={() => navigate('/login')}>공백기가 합격이 되는 곳에서 시작하기</button>
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
