import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth, LoginPage } from './lib/auth'
import Dashboard from './pages/Dashboard'
import Animals from './pages/Animals'
import AddAnimal from './pages/AddAnimal'
import Dispatch from './pages/Dispatch'
import Costs from './pages/Costs'
import Signs from './pages/Signs'
import Agents from './pages/Agents'

const NAV = [
  { path: '/',        label: 'Dashboard' },
  { path: '/animals', label: 'Animals' },
  { path: '/add',     label: '+ Add Animal' },
  { path: '/dispatch',label: 'Dispatch' },
  { path: '/costs',   label: 'Costs' },
  { path: '/signs',   label: 'Signs' },
  { path: '/agents',  label: 'Agents' },
]

function Layout() {
  const { logout } = useAuth()
  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Top bar */}
      <div style={{
        background: '#fff', borderBottom: '0.5px solid #e5e3de',
        padding: '0 24px', display: 'flex', alignItems: 'center', height: 52,
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <span style={{ fontWeight: 700, fontSize: 16, marginRight: 32, color: '#1a1a1a' }}>
          🐐 Livestock Ledger
        </span>
        <nav style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto' }}>
          {NAV.map(n => (
            <NavLink key={n.path} to={n.path} end={n.path === '/'}
              style={({ isActive }) => ({
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                textDecoration: 'none', whiteSpace: 'nowrap',
                background: isActive ? '#1a1a1a' : 'transparent',
                color: isActive ? '#fff' : '#555',
              })}
            >{n.label}</NavLink>
          ))}
        </nav>
        <button onClick={logout} style={{
          marginLeft: 16, padding: '5px 14px', border: '0.5px solid #ddd',
          borderRadius: 8, background: '#fff', color: '#888', fontSize: 12,
          cursor: 'pointer', fontFamily: 'inherit'
        }}>Logout</button>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/animals"  element={<Animals />} />
          <Route path="/add"      element={<AddAnimal />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/costs"    element={<Costs />} />
          <Route path="/signs"    element={<Signs />} />
          <Route path="/agents"   element={<Agents />} />
        </Routes>
      </div>
    </div>
  )
}

function AppInner() {
  const { authed } = useAuth()
  return authed ? <BrowserRouter><Layout /></BrowserRouter> : <LoginPage />
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>
}
