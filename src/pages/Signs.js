import React, { useEffect, useState } from 'react'
import { getSigns, addSign, getSignPnl, getAnimals } from '../lib/supabase'
import { fmt, fmtDate, Badge, Card, SectionTitle, Input, Btn, Alert, Grid, Spinner, Metric } from '../lib/ui'

export default function Signs() {
  const [pnl, setPnl] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [signAnimals, setSignAnimals] = useState({})
  const [form, setForm] = useState({ name: '', mnada: '', description: '' })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([getSigns(), getSignPnl()])
      setPnl(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!form.name || !form.mnada) { setMsg({ type: 'danger', text: 'Name and mnada required.' }); return }
    try {
      await addSign(form)
      setMsg({ type: 'success', text: `Sign "${form.name}" created.` })
      setForm({ name: '', mnada: '', description: '' })
      load()
    } catch (e) { setMsg({ type: 'danger', text: e.message }) }
  }

  async function toggleSign(id) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!signAnimals[id]) {
      const animals = await getAnimals({ sign_id: id })
      setSignAnimals(p => ({ ...p, [id]: animals }))
    }
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <SectionTitle>Create new sign</SectionTitle>
        <Grid cols={3} gap={12}>
          <Input label="Sign name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. X1 or Babati-A" />
          <Input label="Mnada(s) this sign covers" value={form.mnada} onChange={e => setForm(p => ({ ...p, mnada: e.target.value }))} placeholder="e.g. Babati, Hanang" />
          <Input label="Description (optional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </Grid>
        <div style={{ marginTop: 14 }}>
          <Btn variant="primary" onClick={handleAdd}>Add sign</Btn>
        </div>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}
      </Card>

      {pnl.map(s => {
        const revenue = Number(s.total_revenue)
        const buy = Number(s.total_buy_cost)
        const costs = Number(s.total_costs)
        const pl = revenue - buy - costs
        const isOpen = expanded === s.id
        const animals = signAnimals[s.id] || []

        return (
          <Card key={s.id} style={{ padding: 0 }}>
            <div
              onClick={() => toggleSign(s.id)}
              style={{
                padding: '16px 20px', cursor: 'pointer', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                background: isOpen ? '#faf9f7' : '#fff',
                borderRadius: isOpen ? '14px 14px 0 0' : 14
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{s.name}</span>
                <span style={{ color: '#888', marginLeft: 10, fontSize: 13 }}>{s.mnada}</span>
                <span style={{ color: '#aaa', marginLeft: 10, fontSize: 12 }}>{s.total_animals} animals</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: pl >= 0 ? '#1e7e34' : '#c0392b' }}>
                  {pl >= 0 ? '+' : ''}{fmt(pl)} TSH
                </div>
                <div style={{ fontSize: 12, color: '#aaa' }}>net P/L</div>
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: '16px 20px', borderTop: '0.5px solid #f0ede8' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 20 }}>
                  <Metric label="Pending" value={s.pending} />
                  <Metric label="Dispatched" value={s.dispatched} />
                  <Metric label="Sold" value={s.sold} />
                  <Metric label="Dead/rejected" value={Number(s.dead)} color="#c0392b" />
                  <Metric label="Buy cost (TSH)" value={fmt(buy)} />
                  <Metric label="Revenue (TSH)" value={fmt(revenue)} color="#1e7e34" />
                  <Metric label="Other costs" value={fmt(costs)} color="#c0392b" />
                  <Metric label="Net P/L" value={fmt(pl)} color={pl >= 0 ? '#1e7e34' : '#c0392b'} />
                </div>

                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Animals in this sign</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '0.5px solid #e5e3de' }}>
                        {['#', 'Type', 'Date', 'Mnada', 'Price', 'Agent', 'Status', 'Checkpoint'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '7px 8px', color: '#888', fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {animals.length === 0
                        ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#aaa' }}>No animals</td></tr>
                        : animals.map(a => (
                          <tr key={a.id} style={{ borderBottom: '0.5px solid #f5f3ee' }}>
                            <td style={{ padding: '7px 8px', fontWeight: 600 }}>#{a.id}</td>
                            <td style={{ padding: '7px 8px' }}><Badge type={a.type} /></td>
                            <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>{fmtDate(a.date)}</td>
                            <td style={{ padding: '7px 8px' }}>{a.mnada}</td>
                            <td style={{ padding: '7px 8px', fontWeight: 500 }}>{fmt(a.purchase_price)}</td>
                            <td style={{ padding: '7px 8px', color: '#666' }}>{a.agent_name || '—'}</td>
                            <td style={{ padding: '7px 8px' }}><Badge status={a.status} /></td>
                            <td style={{ padding: '7px 8px', color: '#666' }}>{a.checkpoint || '—'}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        )
      })}

      {pnl.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>
          No signs yet — create your first one above
        </div>
      )}
    </div>
  )
}
