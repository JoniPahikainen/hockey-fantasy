import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
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
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{title}</h1>
        {subtitle && <p style={{ marginBottom: '1.5rem', color: '#9ca3af' }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

