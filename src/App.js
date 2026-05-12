import './App.css'

const SKILLS = ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Git']

const PROJECTS = [
  {
    title: '포트폴리오 사이트',
    desc: 'React로 만든 개인 포트폴리오 웹사이트',
    stack: ['React', 'CSS'],
  },
  {
    title: '날씨 앱',
    desc: '실시간 날씨 정보를 보여주는 웹 앱',
    stack: ['JavaScript', 'API'],
  },
  {
    title: '할일 관리',
    desc: '드래그 앤 드롭으로 관리하는 Todo 앱',
    stack: ['React', 'TypeScript'],
  },
]

function App() {
  return (
    <div className="page">
      <nav className="nav">
        <span className="nav-logo">LEE</span>
        <ul>
          <li><a href="#about">소개</a></li>
          <li><a href="#skills">기술</a></li>
          <li><a href="#projects">프로젝트</a></li>
          <li><a href="#contact">연락처</a></li>
        </ul>
      </nav>

      <section className="hero" id="about">
        <div className="hero-text">
          <p className="greeting">안녕하세요 👋</p>
          <h1>프론트엔드 개발자<br /><span>이현영</span>입니다</h1>
          <p className="desc">
            사용자 경험을 중요하게 생각하며, 깔끔하고 유지보수하기 좋은 코드를 추구합니다.
            새로운 기술을 배우는 것을 즐기고 함께 성장하는 개발자를 지향합니다.
          </p>
          <a href="#contact" className="cta">연락하기</a>
        </div>
        <div className="hero-avatar">이현영</div>
      </section>

      <section className="section" id="skills">
        <h2 className="section-title">기술 스택</h2>
        <div className="skills-grid">
          {SKILLS.map(skill => (
            <div key={skill} className="skill-card">{skill}</div>
          ))}
        </div>
      </section>

      <section className="section" id="projects">
        <h2 className="section-title">프로젝트</h2>
        <div className="project-grid">
          {PROJECTS.map(p => (
            <div key={p.title} className="project-card">
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <div className="project-stack">
                {p.stack.map(s => <span key={s}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="contact">
        <h2 className="section-title">연락처</h2>
        <p className="contact-desc">언제든지 편하게 연락주세요.</p>
        <div className="contact-links">
          <a href="mailto:lhy020534@gmail.com">✉ lhy020534@gmail.com</a>
          <a href="https://github.com" target="_blank" rel="noreferrer">⌥ GitHub</a>
        </div>
      </section>

      <footer>
        <p>© 2026 이현영. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
