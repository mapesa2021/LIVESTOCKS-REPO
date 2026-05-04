import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('ll_auth') === 'true')

  function login(password) {
    const correct = process.env.REACT_APP_APP_PASSWORD
    if (password === correct) {
      sessionStorage.setItem('ll_auth', 'true')
      setAuthed(true)
      return true
    }
    return false
  }

  function logout() {
    sessionStorage.removeItem('ll_auth')
    setAuthed(false)
  }

  return <AuthContext.Provider value={{ authed, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }

export function LoginPage() {
  const { login } = useAuth()
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!login(pw)) { setErr('Wrong password'); setPw('') }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8f7f4'
    }}>
      <div style={{
        background: '#fff', border: '0.5px solid #ddd', borderRadius: 16,
        padding: '40px 48px', width: 340, boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
      }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>Livestock Ledger</h1>
          <p style={{ fontSize: 14, color: '#888', margin: '6px 0 0' }}>Tanchoice Supply Business</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr('') }}
            placeholder="Enter your password"
            autoFocus
            style={{
              width: '100%', padding: '10px 14px', border: '0.5px solid #ccc',
              borderRadius: 8, fontSize: 14, boxSizing: 'border-box', marginBottom: 10
            }}
          />
          {err && <p style={{ color: '#c0392b', fontSize: 13, margin: '0 0 10px' }}>{err}</p>}
          <button type="submit" style={{
            width: '100%', padding: '10px', background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer'
          }}>Enter</button>
        </form>
        <p style={{ fontSize: 12, color: '#bbb', marginTop: 24, textAlign: 'center' }}>
          Your data is stored securely in the cloud
        </p>
      </div>
    </div>
  )
}
