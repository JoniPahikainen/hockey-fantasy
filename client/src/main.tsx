import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ActiveTeamProvider } from './context/ActiveTeamContext'

const savedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null
if (savedTheme === 'dark') {
  document.documentElement.dataset.theme = 'dark'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ActiveTeamProvider>
      <App />
    </ActiveTeamProvider>
  </StrictMode>,
)
