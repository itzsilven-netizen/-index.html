import { useState } from 'react'
import './Auth.css'

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    try {
      // TODO: Integrate with Supabase for real auth
      // For now, just allow any login
      onLogin(email, password)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Lead CRM</h1>
          <p>Manage your leads and follow-ups with AI</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-login">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="toggle-auth"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <div className="auth-note">
          <p>🔐 Data syncs locally first, then to cloud when available.</p>
        </div>
      </div>
    </div>
  )
}
