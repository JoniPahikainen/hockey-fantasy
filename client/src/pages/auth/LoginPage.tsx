import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import AuthLayout from './AuthLayout'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsLoading(true)

    try {
      // TODO: Replace with actual login endpoint when backend is ready

      console.log(email, password);

      
      const res = await api.post('/users/login', { email: email, password: password })
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
      }
      
      setMessage('Login successful!')
      setEmail('')
      setPassword('')
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (err: any) {
      const detail = err?.response?.data?.error ?? 'Failed to login'
      setMessage(detail)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Hockey Fantasy" subtitle="Login to your account">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: message.includes('successful') ? '#10b981' : '#fbbf24',
          }}
        >
          {message}
        </div>
      )}

      <div style={{ marginTop: '1rem', fontSize: '0.875rem', textAlign: 'center', color: '#9ca3af' }}>
        Don't have an account?{' '}
        <a
          href="/register"
          onClick={(e) => {
            e.preventDefault()
            navigate('/register')
          }}
          style={{ color: '#60a5fa', textDecoration: 'none' }}
        >
          Register
        </a>
      </div>
    </AuthLayout>
  )
}

