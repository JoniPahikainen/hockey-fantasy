import type { FormEvent } from 'react'
import { useState } from 'react'
import api from './lib/api'

function App() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)

    try {
      const res = await api.post('/users', { username, email, password })
      setMessage(`User created with id ${res.data.user.user_id}`)
      setUsername('')
      setEmail('')
      setPassword('')
    } catch (err: any) {
      const detail = err?.response?.data?.error ?? 'Failed to register'
      setMessage(detail)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b1120',
        color: '#e5e7eb',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          padding: '2rem',
          borderRadius: '0.75rem',
          background: '#020617',
          boxShadow: '0 20px 40px rgba(15,23,42,0.8)',
          border: '1px solid #1f2937',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Hockey Fantasy</h1>
        <p style={{ marginBottom: '1.5rem', color: '#9ca3af' }}>Register a new account</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.875rem' }}>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                marginTop: '0.25rem',
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #4b5563',
                background: '#020617',
                color: 'inherit',
              }}
            />
          </label>

          <label style={{ fontSize: '0.875rem' }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                marginTop: '0.25rem',
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #4b5563',
                background: '#020617',
                color: 'inherit',
              }}
            />
          </label>

          <label style={{ fontSize: '0.875rem' }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                marginTop: '0.25rem',
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #4b5563',
                background: '#020617',
                color: 'inherit',
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              marginTop: '0.75rem',
              padding: '0.6rem 1rem',
              borderRadius: '999px',
              border: 'none',
              background: '#0b1120',
              color: '#e5e7eb',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Register
          </button>
        </form>

        {message && (
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#fbbf24' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
