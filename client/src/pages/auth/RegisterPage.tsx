import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import AuthLayout from './AuthLayout'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsLoading(true)

    try {
      const res = await api.post('/users/register', { username, email, password })
      setMessage(`User created successfully! ID: ${res.data.user.user_id}`)
      // Clear form on success
      setUsername('')
      setEmail('')
      setPassword('')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err: any) {
      const detail = err?.response?.data?.error ?? 'Failed to register'
      setMessage(detail)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Hockey Fantasy" subtitle="Register a new account">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label style={{ fontSize: '0.875rem' }}>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
            style={{
              marginTop: '0.25rem',
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #4b5563',
              background: '#020617',
              color: 'inherit',
              opacity: isLoading ? 0.6 : 1,
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
            disabled={isLoading}
            style={{
              marginTop: '0.25rem',
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #4b5563',
              background: '#020617',
              color: 'inherit',
              opacity: isLoading ? 0.6 : 1,
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
            disabled={isLoading}
            style={{
              marginTop: '0.25rem',
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #4b5563',
              background: '#020617',
              color: 'inherit',
              opacity: isLoading ? 0.6 : 1,
            }}
          />
        </label>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            marginTop: '0.75rem',
            padding: '0.6rem 1rem',
            borderRadius: '999px',
            border: 'none',
            background: isLoading ? '#4b5563' : '#0b1120',
            color: '#e5e7eb',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: message.includes('successfully') ? '#10b981' : '#fbbf24',
          }}
        >
          {message}
        </div>
      )}

      <div style={{ marginTop: '1rem', fontSize: '0.875rem', textAlign: 'center', color: '#9ca3af' }}>
        Already have an account?{' '}
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault()
            navigate('/login')
          }}
          style={{ color: '#60a5fa', textDecoration: 'none' }}
        >
          Login
        </a>
      </div>
    </AuthLayout>
  )
}

