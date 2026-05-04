import React, { useEffect, useState } from 'react'
import { addAnimal, getSigns, getAgents } from '../lib/supabase'
import { today, Card, SectionTitle, Input, Select, Btn, Alert, Grid } from '../lib/ui'

const empty = () => ({
  date: today(), type: 'goat', sign_id: '', mnada: '', mnada_date: today(),
  purchase_price: '', live_weight_est: '', checkpoint: '', agent_id: '', notes: ''
})

export default function AddAnimal() {
  const [form, setForm] = useState(empty())
  const [signs, setSigns] = useState([])
  const [agents, setAgents] = useState([])
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSigns().then(setSigns)
    getAgents().then(setAgents)
  }, [])

  function f(key, val) { setForm(p => ({ ...p, [key]: val })) }

  async function save(keepForm) {
    if (!form.date || !form.sign_id || !form.mnada || !form.purchase_price) {
      setMsg({ type: 'danger', text: 'Please fill: date, sign, mnada, and price.' })
      return
    }
    setSaving(true)
    try {
      const animal = {
        date: form.date,
        type: form.type,
        sign_id: Number(form.sign_id),
        mnada: form.mnada,
        mnada_date: form.mnada_date || null,
        purchase_price: Number(form.purchase_price),
        live_weight_est: form.live_weight_est ? Number(form.live_weight_est) : null,
        checkpoint: form.checkpoint || null,
        agent_id: form.agent_id ? Number(form.agent_id) : null,
        notes: form.notes || null,
      }
      const saved = await addAnimal(animal)
      setMsg({ type: 'success', text: `Animal #${saved.id} saved successfully.` })
      if (!keepForm) setForm(empty())
    } catch (e) {
      setMsg({ type: 'danger', text: e.message })
    } finally { setSaving(false) }
  }

  return (
    <Card>
      <SectionTitle>Record new animal purchase</SectionTitle>

      <Grid cols={2} gap={12}>
        <Input label="Date purchased" type="date" value={form.date} onChange={e => f('date', e.target.value)} />
        <Select label="Animal type" value={form.type} onChange={e => f('type', e.target.value)}>
          <option value="goat">Goat</option>
          <option value="sheep">Sheep</option>
        </Select>
      </Grid>

      <div style={{ marginTop: 12 }}>
        <Grid cols={3} gap={12}>
          <Select label="Sign / group" value={form.sign_id} onChange={e => f('sign_id', e.target.value)}>
            <option value="">— select sign —</option>
            {signs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.mnada})</option>)}
          </Select>
          <Input label="Mnada (market name)" value={form.mnada} onChange={e => f('mnada', e.target.value)} placeholder="e.g. Babati mnada" />
          <Input label="Mnada date" type="date" value={form.mnada_date} onChange={e => f('mnada_date', e.target.value)} />
        </Grid>
      </div>

      <div style={{ marginTop: 12 }}>
        <Grid cols={3} gap={12}>
          <Input label="Purchase price (TSH)" type="number" value={form.purchase_price} onChange={e => f('purchase_price', e.target.value)} placeholder="0" />
          <Input label="Live weight estimate (kg)" type="number" value={form.live_weight_est} onChange={e => f('live_weight_est', e.target.value)} placeholder="optional" />
          <Input label="Current checkpoint" value={form.checkpoint} onChange={e => f('checkpoint', e.target.value)} placeholder="e.g. Babati holding pen" />
        </Grid>
      </div>

      <div style={{ marginTop: 12 }}>
        <Grid cols={2} gap={12}>
          <Select label="Agent who bought this animal" value={form.agent_id} onChange={e => f('agent_id', e.target.value)}>
            <option value="">— select agent —</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Input label="Notes" value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="any remarks" />
        </Grid>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Btn variant="primary" onClick={() => save(false)} disabled={saving}>
          {saving ? 'Saving...' : 'Save animal'}
        </Btn>
        <Btn onClick={() => save(true)} disabled={saving}>Save + add another</Btn>
        <Btn onClick={() => setForm(empty())}>Clear</Btn>
      </div>

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      {/* Estimated meat value */}
      {form.purchase_price && form.live_weight_est && (
        <div style={{
          marginTop: 16, padding: '12px 16px', background: '#f0faf4', borderRadius: 8,
          fontSize: 13, color: '#1e7e34', border: '0.5px solid #82c982'
        }}>
          <strong>Estimated value:</strong>{' '}
          ~{Math.round(Number(form.live_weight_est) * 0.43)} kg meat
          → ~TSH {Math.round(Number(form.live_weight_est) * 0.43 * 11000).toLocaleString()} at current rate
        </div>
      )}
    </Card>
  )
}
