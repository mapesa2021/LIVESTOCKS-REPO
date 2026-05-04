import React, { useEffect, useState } from 'react'
import { getAnimals, updateAnimal, moveCheckpoint as mvCp } from '../lib/supabase'
import { fmt, fmtDate, Badge, Card, SectionTitle, Input, Select, Btn, Alert, Spinner } from '../lib/ui'

export default function Animals() {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('')
  const [typeF, setTypeF] = useState('')
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null) // 'move' | 'reject'
  const [msg, setMsg] = useState(null)
  const [form, setForm] = useState({})

  async function load() {
    setLoading(true)
    try {
      const data = await getAnimals()
      setAnimals(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = animals.filter(a => {
    const txt = `${a.id} ${a.mnada} ${a.sign_name || ''} ${a.agent_name || ''} ${a.checkpoint || ''}`.toLowerCase()
    return (!search || txt.includes(search.toLowerCase()))
      && (!statusF || a.status === statusF)
      && (!typeF || a.type === typeF)
  })

  async function handleMove() {
    try {
      await mvCp(selected.id, form.checkpoint, form.date || new Date().toISOString().slice(0, 10), form.notes)
      setMsg({ type: 'success', text: `Animal #${selected.id} moved to ${form.checkpoint}` })
      setModal(null)
      load()
    } catch (e) { setMsg({ type: 'danger', text: e.message }) }
  }

  async function handleReject() {
    const status = form.reason === 'dead' ? 'dead' : (Number(form.resale) > 0 ? 'resold' : 'rejected')
    try {
      await updateAnimal(selected.id, {
        status,
        rejection_reason: form.reason,
        resale_price: form.resale || 0,
        rejection_notes: form.notes
      })
      setMsg({ type: 'success', text: `Animal #${selected.id} marked as ${status}` })
      setModal(null)
      load()
    } catch (e) { setMsg({ type: 'danger', text: e.message }) }
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by ID, mnada, sign, agent..."
          style={{ flex: 2, minWidth: 180, padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
        />
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          style={{ flex: 1, minWidth: 120, padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
          <option value="">All statuses</option>
          {['pending','dispatched','sold','dead','rejected','resold'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={typeF} onChange={e => setTypeF(e.target.value)}
          style={{ flex: 1, minWidth: 100, padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
          <option value="">All types</option>
          <option value="goat">Goat</option>
          <option value="sheep">Sheep</option>
        </select>
      </div>

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #f0ede8' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{filtered.length} animals</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e5e3de', background: '#faf9f7' }}>
                {['#', 'Date', 'Type', 'Sign', 'Mnada', 'Checkpoint', 'Price (TSH)', 'Agent', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 10px', color: '#888', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No animals found</td></tr>
                : filtered.map(a => (
                  <tr key={a.id} style={{ borderBottom: '0.5px solid #f5f3ee' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>#{a.id}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{fmtDate(a.date)}</td>
                    <td style={{ padding: '8px 10px' }}><Badge type={a.type} /></td>
                    <td style={{ padding: '8px 10px', fontWeight: 500 }}>{a.sign_name || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>{a.mnada}</td>
                    <td style={{ padding: '8px 10px', color: '#666' }}>{a.checkpoint || '—'}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 500 }}>{fmt(a.purchase_price)}</td>
                    <td style={{ padding: '8px 10px', color: '#666' }}>{a.agent_name || '—'}</td>
                    <td style={{ padding: '8px 10px' }}><Badge status={a.status} /></td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Btn size="sm" onClick={() => { setSelected(a); setForm({ checkpoint: a.checkpoint || '', date: new Date().toISOString().slice(0,10) }); setModal('move') }}>Move</Btn>
                        {['pending','dispatched'].includes(a.status) &&
                          <Btn size="sm" variant="danger" onClick={() => { setSelected(a); setForm({ reason: 'dead', resale: '' }); setModal('reject') }}>Issue</Btn>
                        }
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Card>

      {/* Move checkpoint modal */}
      {modal === 'move' && selected && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <Card style={{ width: 380 }}>
            <SectionTitle>Move animal #{selected.id}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="New checkpoint" value={form.checkpoint || ''} onChange={e => setForm(f => ({ ...f, checkpoint: e.target.value }))} />
              <Input label="Date" type="date" value={form.date || ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              <Input label="Notes (optional)" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Btn variant="primary" onClick={handleMove}>Save</Btn>
              <Btn onClick={() => setModal(null)}>Cancel</Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Reject/issue modal */}
      {modal === 'reject' && selected && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <Card style={{ width: 400 }}>
            <SectionTitle>Report issue — animal #{selected.id}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Select label="Reason" value={form.reason || 'dead'} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
                <option value="dead">Dead</option>
                <option value="sick">Sick (returned by Tanchoice)</option>
                <option value="age">Wrong age (returned by Tanchoice)</option>
              </Select>
              <Input label="Resale price (TSH) — leave 0 if dead or not yet sold" type="number" value={form.resale || ''} onChange={e => setForm(f => ({ ...f, resale: e.target.value }))} />
              <Input label="Notes" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Btn variant="danger" onClick={handleReject}>Save</Btn>
              <Btn onClick={() => setModal(null)}>Cancel</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
