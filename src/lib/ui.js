export const fmt = n => Math.round(Number(n) || 0).toLocaleString()
export const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
export const today = () => new Date().toISOString().slice(0, 10)

export const STATUS_COLORS = {
  pending:    { bg: '#FEF9EC', text: '#92600A', border: '#F5D27A' },
  dispatched: { bg: '#EBF5FB', text: '#1A5E8F', border: '#85B7EB' },
  sold:       { bg: '#EAF5EA', text: '#1E7E34', border: '#82C982' },
  dead:       { bg: '#FDECEC', text: '#A32D2D', border: '#F09595' },
  rejected:   { bg: '#FAEEE7', text: '#7A3311', border: '#E8A87C' },
  resold:     { bg: '#F3EEFF', text: '#5030A0', border: '#B39DDB' },
}

export const TYPE_COLORS = {
  goat:  { bg: '#E6F4F1', text: '#0D6E5A', border: '#5DC4A5' },
  sheep: { bg: '#EEF3FF', text: '#1A3FB0', border: '#85A8F0' },
}

export const COST_TYPES = [
  { value: 'transport',         label: 'Transport (usafirishaji)' },
  { value: 'feeding',           label: 'Feeding / malisho' },
  { value: 'gate-fee',          label: 'Mnada gate fee (vibali)' },
  { value: 'fuel',              label: 'Fuel / travel' },
  { value: 'wageuzaji',         label: 'Wageuzaji (hired help)' },
  { value: 'agent-commission',  label: 'Agent commission' },
  { value: 'other',             label: 'Other' },
]

export function Badge({ status, type }) {
  const palette = type ? TYPE_COLORS[type] : STATUS_COLORS[status]
  if (!palette) return null
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 500,
      background: palette.bg, color: palette.text, border: `0.5px solid ${palette.border}`
    }}>
      {type || status}
    </span>
  )
}

export function Metric({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#f9f8f5', borderRadius: 10, padding: '14px 16px', minWidth: 110
    }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: color || '#1a1a1a', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#fff', border: '0.5px solid #e5e3de', borderRadius: 14,
      padding: '20px 22px', ...style
    }}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>{children}</h2>
      {action}
    </div>
  )
}

export function Input({ label, ...props }) {
  return (
    <div>
      {label && <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{label}</label>}
      <input style={{
        width: '100%', padding: '8px 12px', border: '0.5px solid #ccc',
        borderRadius: 8, fontSize: 13, boxSizing: 'border-box',
        background: props.readOnly ? '#f5f5f3' : '#fff', color: '#1a1a1a',
        fontFamily: 'inherit'
      }} {...props} />
    </div>
  )
}

export function Select({ label, children, ...props }) {
  return (
    <div>
      {label && <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{label}</label>}
      <select style={{
        width: '100%', padding: '8px 12px', border: '0.5px solid #ccc',
        borderRadius: 8, fontSize: 13, boxSizing: 'border-box',
        background: '#fff', color: '#1a1a1a', fontFamily: 'inherit'
      }} {...props}>{children}</select>
    </div>
  )
}

export function Btn({ children, variant = 'default', size = 'md', style: s = {}, ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
    border: '0.5px solid', borderRadius: 8, fontFamily: 'inherit',
    fontWeight: 500, transition: 'all .15s',
    padding: size === 'sm' ? '5px 12px' : '9px 18px',
    fontSize: size === 'sm' ? 12 : 13,
  }
  const variants = {
    default: { background: '#fff', color: '#333', borderColor: '#ccc' },
    primary: { background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' },
    danger:  { background: '#fff', color: '#c0392b', borderColor: '#e8a0a0' },
    success: { background: '#fff', color: '#1e7e34', borderColor: '#82c982' },
  }
  return <button style={{ ...base, ...variants[variant], ...s }} {...props}>{children}</button>
}

export function Alert({ type = 'success', children }) {
  const colors = {
    success: { bg: '#EAF5EA', text: '#1E7E34', border: '#82C982' },
    danger:  { bg: '#FDECEC', text: '#A32D2D', border: '#F09595' },
  }
  const c = colors[type]
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 10,
      background: c.bg, color: c.text, border: `0.5px solid ${c.border}`
    }}>
      {children}
    </div>
  )
}

export function Grid({ cols = 2, children, gap = 12 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap }}>
      {children}
    </div>
  )
}

export function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 14 }}>
      Loading...
    </div>
  )
}
