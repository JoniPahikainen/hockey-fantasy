import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from './pages/auth/RegisterPage'
import LoginPage from './pages/auth/LoginPage'
import HomePage from './pages/HomePage'
import DailyTeamPage from './pages/EditTeamPage'
import LeagueStandingsPage from './pages/LeaguePage'
import ProtectedRoute from './pages/auth/ProtectedRoute'
import LeagueSetupPage from './pages/LeagueSetupPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* PROTECTED ROUTES - Only managers can see these */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/team" element={<DailyTeamPage />} />
          <Route path="/league" element={<LeagueStandingsPage />} />
          <Route path="/league/setup" element={<LeagueSetupPage />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App