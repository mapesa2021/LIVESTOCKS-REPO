import React, { useEffect, useState } from 'react'
import { getAgents, addAgent, getCosts, getAnimals } from '../lib/supabase'
import { fmt, Card, SectionTitle, Input, Btn, Alert, Grid, Spinner, Metric } from '../lib/ui'

export default function Agents() {
  const [agents, setAgents] = useState([])
  const [stats, setStats] = useState({})
  const [form, setForm] = useState({ name: '', phone: '' })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [ag, animals, costs] = await Promise.all([getAgents(), getAnimals(), getCosts()])
      setAgents(ag)
      const s = {}
      ag.forEach(a => {
        const bought = animals.filter(x => x.agent_id === a.id)
        const avgPrice = bought.length ? bought.reduce((t, x) => t + Number(x.purchase_price), 0) / bought.length : 0
        const commission = costs.filter(c => c.notes && c.notes.includes('agent ' + a.name))
          .reduce((t, c) => t + Number(c.amount), 0)
        s[a.id] = { bought: bought.length, avgPrice, commission }
      })
      setStats(s)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!form.name) { setMsg({ type: 'danger', text: 'Agent name required.' }); return }
    try {
      await addAgent(form)
      setMsg({ type: 'success', text: `Agent "${form.name}" added.` })
      setForm({ name: '', phone: '' })
      load()
    } catch (e) { setMsg({ type: 'danger', text: e.message }) }
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Add agent / mwageuzaji</SectionTitle>
        <Grid cols={2} gap={12}>
          <Input label="Full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Juma Hassan" />
          <Input label="Phone number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="07xx xxx xxx" />
        </Grid>
        <div style={{ marginTop: 14 }}>
          <Btn variant="primary" onClick={handleAdd}>Add agent</Btn>
        </div>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}
      </Card>

      {agents.map(a => {
        const s = stats[a.id] || {}
        return (
          <Card key={a.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{a.name}</div>
                <div style={{ color: '#888', fontSize: 13 }}>{a.phone || 'No phone'}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              <Metric label="Animals bought" value={s.bought || 0} />
              <Metric label="Avg buy price (TSH)" value={s.avgPrice ? fmt(s.avgPrice) : '—'} />
              <Metric label="Commission earned (TSH)" value={fmt(s.commission || 0)} />
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#aaa', padding: '8px 12px', background: '#faf9f7', borderRadius: 8 }}>
              Commission rule: TSH 1,000 per animal when profit per animal exceeds TSH 3,000
            </div>
          </Card>
        )
      })}

      {agents.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>
          No agents yet
        </div>
      )}
    </div>
  )
}
