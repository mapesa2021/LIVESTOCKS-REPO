import React, { useEffect, useState } from 'react'
import { addAnimal, getSigns, getAgents } from '../lib/supabase'
import { today, Card, SectionTitle, Input, Btn, Alert, Grid } from '../lib/ui'

const emptyRow = () => ({
  sign_id: '', agent_id: '', quantity: 1, type: 'goat',
  purchase_price: '', live_weight_est: '', notes: ''
})

const emptyCommon = () => ({
  date: today(), mnada: '', mnada_date: today(), checkpoint: ''
})

export default function AddAnimal() {
  const [common, setCommon] = useState(emptyCommon())
  const [rows, setRows] = useState([emptyRow()])
  const [signs, setSigns] = useState([])
  const [agents, setAgents] = useState([])
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSigns().then(setSigns)
    getAgents().then(setAgents)
  }, [])

  function c(key, val) { setCommon(p => ({ ...p, [key]: val })) }
  function r(i, key, val) { setRows(p => p.map((row, idx) => idx === i ? { ...row, [key]: val } : row)) }
  function addRow() { setRows(p => [...p, emptyRow()]) }
  function removeRow(i) { if (rows.length > 1) setRows(p => p.filter((_, idx) => idx !== i)) }

  const totalAnimals = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0)
  const totalCost = rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.purchase_price) || 0), 0)

  async function save() {
    if (!common.date || !common.mnada) {
      setMsg({ type: 'danger', text: 'Please fill date and mnada.' }); return
    }
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row.sign_id || !row.purchase_price) {
        setMsg({ type: 'danger', text: `Group ${i + 1}: sign and price are required.` }); return
      }
    }
    setSaving(true)
    let count = 0
    try {
      for (const row of rows) {
        const qty = Number(row.quantity) || 1
        for (let i = 0; i < qty; i++) {
          await addAnimal({
            date: common.date,
            type: row.type,
            sign_id: Number(row.sign_id),
            mnada: common.mnada,
            mnada_date: common.mnada_date || null,
            purchase_price: Number(row.purchase_price),
            live_weight_est: row.live_weight_est ? Number(row.live_weight_est) : null,
            checkpoint: common.checkpoint || null,
            agent_id: row.agent_id ? Number(row.agent_id) : null,
            notes: row.notes || null,
          })
          count++
        }
      }
      setMsg({ type: 'success', text: `✓ ${count} animal${count !== 1 ? 's' : ''} saved successfully.` })
      setCommon(emptyCommon())
      setRows([emptyRow()])
    } catch (e) {
      setMsg({ type: 'danger', text: e.message })
    } finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <SectionTitle>Record animal purchases</SectionTitle>

        {/* Common fields */}
        <div style={{ padding: '14px 16px', background: '#faf9f7', borderRadius: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10, fontWeight: 600, letterSpacing: 1 }}>
            SHARED DETAILS (applies to all groups below)
          </div>
          <Grid cols={2} gap={12}>
            <Input label="Date purchased" type="date" value={common.date} onChange={e => c('date', e.target.value)} />
            <Input label="Mnada (market)" value={common.mnada} onChange={e => c('mnada', e.target.value)} placeholder="e.g. Babati mnada" />
          </Grid>
          <Grid cols={2} gap={12} style={{ marginTop: 10 }}>
            <Input label="Mnada date" type="date" value={common.mnada_date} onChange={e => c('mnada_date', e.target.value)} />
            <Input label="Starting checkpoint" value={common.checkpoint} onChange={e => c('checkpoint', e.target.value)} placeholder="e.g. Babati holding pen" />
          </Grid>
        </div>

        {/* Animal group rows */}
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8, fontWeight: 600, letterSpacing: 1 }}>
          ANIMAL GROUPS — one row per sign / price combination
        </div>

        {rows.map((row, i) => (
          <div key={i} style={{
            border: '0.5px solid #e5e3de', borderRadius: 10, padding: '14px 16px',
            marginBottom: 10, background: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>Group {i + 1}</span>
              {rows.length > 1 && <Btn size="sm" variant="danger" onClick={() => removeRow(i)}>Remove</Btn>}
            </div>

            <Grid cols={3} gap={10}>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Animal type</label>
                <select value={row.type} onChange={e => r(i, 'type', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="goat">Goat</option>
                  <option value="sheep">Sheep</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Quantity</label>
                <input type="number" min="1" value={row.quantity} onChange={e => r(i, 'quantity', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Avg price per animal (TSH)</label>
                <input type="number" value={row.purchase_price} placeholder="0" onChange={e => r(i, 'purchase_price', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
              </div>
            </Grid>

            <Grid cols={3} gap={10} style={{ marginTop: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Sign / group</label>
                <select value={row.sign_id} onChange={e => r(i, 'sign_id', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">— select sign —</option>
                  {signs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.mnada})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Agent who bought</label>
                <select value={row.agent_id} onChange={e => r(i, 'agent_id', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">— select agent —</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Est. live weight / animal (kg)</label>
                <input type="number" value={row.live_weight_est} placeholder="optional" onChange={e => r(i, 'live_weight_est', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
              </div>
            </Grid>

            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Notes for this group</label>
              <input value={row.notes} placeholder="optional" onChange={e => r(i, 'notes', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
            </div>

            {row.quantity && row.purchase_price && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#1e7e34', fontWeight: 600 }}>
                Subtotal: {Number(row.quantity)} × TSH {Number(row.purchase_price).toLocaleString()} = TSH {(Number(row.quantity) * Number(row.purchase_price)).toLocaleString()}
              </div>
            )}
          </div>
        ))}

        <Btn onClick={addRow} style={{ marginBottom: 16 }}>+ Add another group / sign</Btn>

        {totalAnimals > 0 && (
          <div style={{ padding: '12px 16px', background: '#f0faf4', borderRadius: 8, fontSize: 14, marginBottom: 16, border: '0.5px solid #82c982' }}>
            <strong>Grand total: {totalAnimals} animals — TSH {totalCost.toLocaleString()}</strong>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="primary" onClick={save} disabled={saving}>
            {saving ? `Saving...` : `Save ${totalAnimals} animal${totalAnimals !== 1 ? 's' : ''}`}
          </Btn>
          <Btn onClick={() => { setRows([emptyRow()]); setCommon(emptyCommon()); setMsg(null) }}>Clear all</Btn>
        </div>

        {msg && <Alert type={msg.type}>{msg.text}</Alert>}
      </Card>
    </div>
  )
}
