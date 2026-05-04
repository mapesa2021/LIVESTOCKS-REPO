import React, { useEffect, useState } from 'react'
import { getCosts, addCost, deleteCost, getSigns } from '../lib/supabase'
import { fmt, fmtDate, COST_TYPES, Card, SectionTitle, Input, Select, Btn, Alert, Grid, Spinner } from '../lib/ui'
import { today } from '../lib/ui'

export default function Costs() {
  const [costs, setCosts] = useState([])
  const [signs, setSigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ date: today(), type: 'transport', amount: '', sign_id: '', notes: '' })
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([getCosts(), getSigns()])
      setCosts(c)
      setSigns(s)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  function f(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleAdd() {
    if (!form.date || !form.amount) { setMsg({ type: 'danger', text: 'Date and amount required.' }); return }
    setSaving(true)
    try {
      await addCost({
        date: form.date, type: form.type, amount: Number(form.amount),
        sign_id: form.sign_id ? Number(form.sign_id) : null,
        notes: form.notes || null
      })
      setMsg({ type: 'success', text: 'Cost saved.' })
      setForm(p => ({ ...p, amount: '', notes: '' }))
      load()
    } catch (e) { setMsg({ type: 'danger', text: e.message }) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this cost?')) return
    await deleteCost(id)
    load()
  }

  const total = costs.reduce((s, c) => s + Number(c.amount), 0)

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Log a cost</SectionTitle>
        <Grid cols={3} gap={12}>
          <Input label="Date" type="date" value={form.date} onChange={e => f('date', e.target.value)} />
          <Select label="Cost type" value={form.type} onChange={e => f('type', e.target.value)}>
            {COST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Input label="Amount (TSH)" type="number" value={form.amount} onChange={e => f('amount', e.target.value)} placeholder="0" />
        </Grid>
        <Grid cols={2} gap={12} style={{ marginTop: 12 }}>
          <Select label="Link to sign (optional)" value={form.sign_id} onChange={e => f('sign_id', e.target.value)}>
            <option value="">Not linked to a sign</option>
            {signs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.mnada})</option>)}
          </Select>
          <Input label="Notes" value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="e.g. Babati to Dodoma trip" />
        </Grid>
        <div style={{ marginTop: 16 }}>
          <Btn variant="primary" onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Save cost'}</Btn>
        </div>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}
      </Card>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #f0ede8', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Cost log</span>
          <span style={{ fontWeight: 600, color: '#c0392b' }}>Total: TSH {fmt(total)}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e5e3de', background: '#faf9f7' }}>
                {['Date', 'Type', 'Sign', 'Amount (TSH)', 'Notes', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 10px', color: '#888', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {costs.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No costs logged yet</td></tr>
                : costs.map(c => (
                  <tr key={c.id} style={{ borderBottom: '0.5px solid #f5f3ee' }}>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{fmtDate(c.date)}</td>
                    <td style={{ padding: '8px 10px' }}>{COST_TYPES.find(t => t.value === c.type)?.label || c.type}</td>
                    <td style={{ padding: '8px 10px', color: '#666' }}>{c.signs?.name || '—'}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#c0392b' }}>{fmt(c.amount)}</td>
                    <td style={{ padding: '8px 10px', color: '#666' }}>{c.notes || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <Btn size="sm" variant="danger" onClick={() => handleDelete(c.id)}>Del</Btn>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
