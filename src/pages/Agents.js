import React, { useEffect, useState } from 'react'
import { getAgents, addAgent, getCosts, getAnimals, getPayments, supabase } from '../lib/supabase'
import { fmt, Card, SectionTitle, Input, Btn, Alert, Grid, Spinner, Metric } from '../lib/ui'

const COMMISSION_PER_ANIMAL = 1000
const COMMISSION_MIN_PROFIT = 3000

export default function Agents() {
  const [agents, setAgents] = useState([])
  const [stats, setStats] = useState({})
  const [form, setForm] = useState({ name: '', phone: '' })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [ag, animals, costs] = await Promise.all([getAgents(), getAnimals(), getCosts()])
      setAgents(ag)
      const s = {}
      ag.forEach(a => {
        const bought = animals.filter(x => x.agent_id === a.id)
        const avgPrice = bought.length ? bought.reduce((t, x) => t + Number(x.purchase_price), 0) / bought.length : 0
        const commission = costs.filter(c => c.type === 'agent-commission' && c.notes && c.notes.includes(a.name))
          .reduce((t, c) => t + Number(c.amount), 0)
        s[a.id] = { bought: bought.length, avgPrice, commission, animals: bought }
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

  async function recalculateAllCommissions() {
    if (!window.confirm('This will recalculate and record commissions for ALL existing paid batches. Any already-recorded commissions will be kept. Continue?')) return
    setRecalculating(true)
    setMsg(null)
    try {
      // Get all payments
      const payments = await getPayments()
      let totalRecorded = 0

      for (const payment of payments) {
        // Get animals in this dispatch for this sign
        const { data: daRows } = await supabase
          .from('dispatch_animals')
          .select('animal_id')
          .eq('dispatch_id', payment.dispatch_id)

        const animalIds = (daRows || []).map(r => r.animal_id)
        if (!animalIds.length) continue

        const { data: signAnimals } = await supabase
          .from('animals_full')
          .select('*')
          .eq('sign_id', payment.sign_id)
          .in('id', animalIds)

        const animals = signAnimals || []
        if (!animals.length) continue

        // Get linked costs for this sign
        const { data: signCosts } = await supabase
          .from('costs')
          .select('amount, type')
          .eq('sign_id', payment.sign_id)
          .neq('type', 'agent-commission') // exclude commissions from calculation

        const totalLinkedCosts = (signCosts || []).reduce((s, c) => s + Number(c.amount), 0)
        const totalBuyCost = animals.reduce((s, a) => s + Number(a.purchase_price), 0)
        const profitPerAnimal = (Number(payment.revenue) - totalBuyCost - totalLinkedCosts) / animals.length

        if (profitPerAnimal <= COMMISSION_MIN_PROFIT) continue

        // Group by agent
        const agentMap = {}
        animals.forEach(a => {
          if (a.agent_id && a.agent_name) {
            if (!agentMap[a.agent_id]) agentMap[a.agent_id] = { name: a.agent_name, count: 0 }
            agentMap[a.agent_id].count++
          }
        })

        for (const [, info] of Object.entries(agentMap)) {
          const batchNote = `Auto-commission: ${info.name} — ${info.count} animal${info.count !== 1 ? 's' : ''} × TSH ${COMMISSION_PER_ANIMAL.toLocaleString()} (Batch #${payment.dispatch_id})`

          // Check if commission already recorded for this batch+agent
          const { data: existing } = await supabase
            .from('costs')
            .select('id')
            .eq('type', 'agent-commission')
            .eq('sign_id', payment.sign_id)
            .ilike('notes', `%Batch #${payment.dispatch_id}%`)
            .ilike('notes', `%${info.name}%`)

          if (existing && existing.length > 0) continue // already recorded

          await supabase.from('costs').insert([{
            date: payment.date,
            type: 'agent-commission',
            amount: info.count * COMMISSION_PER_ANIMAL,
            sign_id: payment.sign_id,
            notes: batchNote
          }])
          totalRecorded++
        }
      }

      setMsg({ type: 'success', text: `Done. ${totalRecorded} commission entr${totalRecorded !== 1 ? 'ies' : 'y'} recorded.` })
      load()
    } catch (e) {
      setMsg({ type: 'danger', text: e.message })
    } finally { setRecalculating(false) }
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
        {msg && (
          <div style={{
            marginTop: 10, padding: '10px 14px', borderRadius: 8, fontSize: 13,
            background: msg.type === 'success' ? '#EAF5EA' : '#FDECEC',
            color: msg.type === 'success' ? '#1E7E34' : '#A32D2D',
            border: `0.5px solid ${msg.type === 'success' ? '#82C982' : '#F09595'}`
          }}>{msg.text}</div>
        )}
      </Card>

      {/* Recalculate commissions for existing batches */}
      <Card style={{ border: '0.5px solid #F5D27A', background: '#FFFDF0' }}>
        <SectionTitle>Fix existing commissions</SectionTitle>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
          If you recorded payments before the commission fix, click below to calculate and record any missing commissions for all existing paid batches. Already-recorded commissions will not be duplicated.
        </p>
        <Btn variant="primary" onClick={recalculateAllCommissions} disabled={recalculating}>
          {recalculating ? 'Recalculating...' : 'Recalculate all commissions now'}
        </Btn>
      </Card>

      {/* Agent cards */}
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
              <Metric label="Commission earned (TSH)" value={fmt(s.commission || 0)} color={s.commission > 0 ? '#1e7e34' : undefined} />
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#aaa', padding: '8px 12px', background: '#faf9f7', borderRadius: 8 }}>
              Commission rule: TSH 1,000 per animal when profit per animal exceeds TSH 3,000 (after all linked costs)
            </div>
          </Card>
        )
      })}

      {agents.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>No agents yet</div>
      )}
    </div>
  )
}
