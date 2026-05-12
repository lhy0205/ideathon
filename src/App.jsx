import Register from './Register'
import './App.css'

function App() {
  return (
    <div className="page-wrapper">
      <header className="page-header">
        <span className="header-brand">Pause to Pass</span>
        <span className="header-tagline"> - 나의 오늘이 내일의 발판이 되지 못하는 불안</span>
      </header>
      <main className="page-main">
        <Register />
      </main>
    </div>
  )
}

export default App