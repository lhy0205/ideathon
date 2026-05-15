import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import MyPage from './pages/MyPage'
import ExperienceMapping from './pages/ExperienceMapping'
import SurvivalDiagnosis from './pages/SurvivalDiagnosis'
import Mission from './pages/Mission'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/mapping" element={<ExperienceMapping />} />
        <Route path="/survival" element={<SurvivalDiagnosis />} />
        <Route path="/mission" element={<Mission />} />
      </Routes>
    </BrowserRouter>
  )
}
