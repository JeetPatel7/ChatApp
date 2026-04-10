import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      if (!displayName.trim()) { setError('Display name is required'); setLoading(false); return }
      const { error } = await signUp(email, password, displayName)
      if (error) setError(error.message)
      else setSuccess('Account created! Check your email to confirm, then log in.')
    }
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#185FA5"/>
            <circle cx="11" cy="16" r="3" fill="white"/>
            <circle cx="18" cy="12" r="3" fill="white" opacity="0.8"/>
            <circle cx="25" cy="16" r="3" fill="white" opacity="0.6"/>
            <path d="M8 26 Q18 22 28 26" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
          <span style={styles.logoText}>Pulse</span>
        </div>

        <h1 style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p style={styles.subtitle}>{mode === 'login' ? 'Sign in to your workspace' : 'Join the conversation'}</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'signup' && (
            <div style={styles.field}>
              <label style={styles.label}>Display name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="How should we call you?"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder={mode === 'signup' ? 'Minimum 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.successMsg}>{success}</div>}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={styles.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            style={styles.toggleBtn}
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0f1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '32px',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  title: {
    fontSize: '26px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 6px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.45)',
    margin: '0 0 32px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: { fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  input: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '15px',
    color: '#fff',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
  },
  btn: {
    background: '#185FA5',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '13px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    marginTop: '6px',
    transition: 'opacity 0.2s',
  },
  error: {
    background: 'rgba(226,75,74,0.12)',
    border: '1px solid rgba(226,75,74,0.3)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#F09595',
  },
  successMsg: {
    background: 'rgba(29,158,117,0.12)',
    border: '1px solid rgba(29,158,117,0.3)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#5DCAA5',
  },
  toggle: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#378ADD',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: '500',
  },
}
