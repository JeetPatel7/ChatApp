import React from 'react'
import { useAuth } from './lib/AuthContext'
import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#111b21', fontFamily: "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}>
          <div style={{ textAlign: 'center', maxWidth: '420px', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', lineHeight: '1.5', marginBottom: '24px' }}>
              Make sure your Supabase database is set up correctly. Check the SQL in <code style={{ color: '#378ADD' }}>src/lib/supabase.js</code> for the schema.
            </p>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
                style={{
                  background: '#00a884', color: '#111b21', border: 'none',
                  borderRadius: '24px', padding: '11px 24px', fontSize: '14px',
                  fontWeight: '600', cursor: 'pointer', fontFamily: "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                }}
              >
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#111b21', fontFamily: "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 36 36" fill="none" style={{ marginBottom: '16px' }}>
            <circle cx="18" cy="18" r="18" fill="#185FA5"/>
            <circle cx="11" cy="16" r="3" fill="white"/>
            <circle cx="18" cy="12" r="3" fill="white" opacity="0.8"/>
            <circle cx="25" cy="16" r="3" fill="white" opacity="0.6"/>
          </svg>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Loading Pulse...</div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      {user ? <ChatPage /> : <AuthPage />}
    </ErrorBoundary>
  )
}
