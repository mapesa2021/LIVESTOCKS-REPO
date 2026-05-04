import React, { useEffect, useState } from 'react'
import { getAnimals, updateAnimal, moveCheckpoint as mvCp, getSigns, getAgents } from '../lib/supabase'
import { fmt, fmtDate, Badge, Card, SectionTitle, Input, Btn, Alert, Spinner, Grid } from '../lib/ui'

export default function Animals() {
  const [animals, setAnimals] = useState([])
  const [signs, setSigns] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('')
  const [typeF, setTypeF] = useState('')
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null) // 'move' | 'reject' | 'edit'
  const [msg, setMsg] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [data, s, ag] = await Promise.all([getAnimals(), getSigns(), getAgents()])
      setAnimals(data)
      setSigns(s)
      setAgents(ag)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = animals.filter(a => {
    const txt = `${a.id} ${a.mnada} ${a.sign_name || ''} ${a.agent_name || ''} ${a.checkpoint || ''}`.toLowerCase()
    return (!search || txt.includes(search.toLowerCase()))
      && (!statusF || a.status === statusF)
      && (!typeF || a.type === typeF)
  })

  function openMove(a) {
    setSelected(a)
    setForm({ checkpoint: '', date: new Date().toISOString().slice(0, 10), move_type: 'truck', moved_by: '', notes: '' })
    setModal('move')
  }

  function openEdit(a) {
    setSelected(a)
    setForm({
      date: a.date, type: a.type, sign_id: a.sign_id, mnada: a.mnada,
      mnada_date: a.mnada_date || '', purchase_price: a.purchase_price,
      live_weight_est: a.live_weight_est || '', checkpoint: a.checkpoint || '',
      agent_id: a.agent_id || '', notes: a.notes || '', status: a.status
    })
    setModal('edit')
  }

  function openReject(a) {
    setSelected(a)
    setForm({ reason: 'dead', resale: '', notes: '' })
    setModal('reject')
  }

  async function handleMove() {
    if (!form.checkpoint) { setMsg({ type: 'danger', text: 'Checkpoint required.' }); return }
    setSaving(true)
    try {
      const notes = `[${form.move_type === 'truck' ? 'By truck' : 'On foot (kuswagwa)'}${form.moved_by ? ` — ${form.moved_by}` : ''}]${form.notes ? ' ' + form.notes : ''}`
      await mvCp(selected.id, form.checkpoint, form.date, notes)
      setMsg({ type: 'success', text: `Animal #${selected.id} moved to ${form.checkpoint}` })
      setModal(null)
      load()
    } catch (e) { setMsg({ type: 'danger', text: e.message }) }
    finally { setSaving(false) }
  }

  async function handleEdit() {
    setSaving(true)
    try {
      await updateAnimal(selected.id, {
        date: form.date, type: form.type,
        sign_id: Number(form.sign_id),
        mnada: form.mnada,
        mnada_date: form.mnada_date || null,
        purchase_price: Number(form.purchase_price),
        live_weight_est: form.live_weight_est ? Number(form.live_weight_est) : null,
        checkpoint: form.checkpoint || null,
        agent_id: form.agent_id ? Number(form.agent_id) : null,
        notes: form.notes || null,
        status: form.status
      })
      setMsg({ type: 'success', text: `Animal #${selected.id} updated.` })
      setModal(null)
      load()
    } catch (e) { setMsg({ type: 'danger', text: e.message }) }
    finally { setSaving(false) }
  }

  async function handleReject() {
    const status = form.reason === 'dead' ? 'dead' : (Number(form.resale) > 0 ? 'resold' : 'rejected')
    setSaving(true)
    try {
      await updateAnimal(selected.id, {
        status, rejection_reason: form.reason,
        resale_price: form.resale || 0, rejection_notes: form.notes
      })
      setMsg({ type: 'success', text: `Animal #${selected.id} marked as ${status}` })
      setModal(null)
      load()
    } catch (e) { setMsg({ type: 'danger', text: e.message }) }
    finally { setSaving(false) }
  }

  const modalStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 100, padding: 16
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by ID, mnada, sign, agent..."
          style={{ flex: 2, minWidth: 180, padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          style={{ flex: 1, minWidth: 120, padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
          <option value="">All statuses</option>
          {['pending','dispatched','sold','dead','rejected','resold'].map(s => <option key={s} value={s}>{s}</option>)}
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
        <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #f0ede8' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{filtered.length} animals</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e5e3de', background: '#faf9f7' }}>
                {['#','Date','Type','Sign','Mnada','Checkpoint','Price (TSH)','Agent','Status','Actions'].map(h => (
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
                    <td style={{ padding: '8px 10px', color: '#666', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.checkpoint || '—'}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 500 }}>{fmt(a.purchase_price)}</td>
                    <td style={{ padding: '8px 10px', color: '#666' }}>{a.agent_name || '—'}</td>
                    <td style={{ padding: '8px 10px' }}><Badge status={a.status} /></td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Btn size="sm" onClick={() => openEdit(a)}>Edit</Btn>
                        <Btn size="sm" onClick={() => openMove(a)}>Move</Btn>
                        {['pending','dispatched'].includes(a.status) &&
                          <Btn size="sm" variant="danger" onClick={() => openReject(a)}>Issue</Btn>}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Card>

      {/* EDIT MODAL */}
      {modal === 'edit' && selected && (
        <div style={modalStyle}>
          <Card style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <SectionTitle>Edit animal #{selected.id}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Grid cols={2} gap={10}>
                <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="goat">Goat</option>
                    <option value="sheep">Sheep</option>
                  </select>
                </div>
              </Grid>
              <Grid cols={2} gap={10}>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Sign</label>
                  <select value={form.sign_id} onChange={e => setForm(f => ({ ...f, sign_id: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="">— select —</option>
                    {signs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Agent</label>
                  <select value={form.agent_id} onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="">— select —</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </Grid>
              <Grid cols={2} gap={10}>
                <Input label="Mnada" value={form.mnada} onChange={e => setForm(f => ({ ...f, mnada: e.target.value }))} />
                <Input label="Purchase price (TSH)" type="number" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} />
              </Grid>
              <Grid cols={2} gap={10}>
                <Input label="Live weight est. (kg)" type="number" value={form.live_weight_est} onChange={e => setForm(f => ({ ...f, live_weight_est: e.target.value }))} />
                <Input label="Checkpoint" value={form.checkpoint} onChange={e => setForm(f => ({ ...f, checkpoint: e.target.value }))} />
              </Grid>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                  {['pending','dispatched','sold','dead','rejected','resold'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Btn variant="primary" onClick={handleEdit} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Btn>
              <Btn onClick={() => setModal(null)}>Cancel</Btn>
            </div>
          </Card>
        </div>
      )}

      {/* MOVE CHECKPOINT MODAL */}
      {modal === 'move' && selected && (
        <div style={modalStyle}>
          <Card style={{ width: '100%', maxWidth: 440 }}>
            <SectionTitle>Move animal #{selected.id}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="New checkpoint / location" value={form.checkpoint}
                onChange={e => setForm(f => ({ ...f, checkpoint: e.target.value }))}
                placeholder="e.g. Dodoma holding yard" />
              <Input label="Date of movement" type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>How were they moved?</label>
                <select value={form.move_type} onChange={e => setForm(f => ({ ...f, move_type: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                  <option value="truck">By truck</option>
                  <option value="foot">On foot (kuswagwa)</option>
                </select>
              </div>
              <Input label="Moved by (name of driver / person)" value={form.moved_by}
                onChange={e => setForm(f => ({ ...f, moved_by: e.target.value }))}
                placeholder="e.g. Hamisi driver, or Juma" />
              <Input label="Additional notes" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="optional" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Btn variant="primary" onClick={handleMove} disabled={saving}>{saving ? 'Saving...' : 'Save movement'}</Btn>
              <Btn onClick={() => setModal(null)}>Cancel</Btn>
            </div>
          </Card>
        </div>
      )}

      {/* REJECT / ISSUE MODAL */}
      {modal === 'reject' && selected && (
        <div style={modalStyle}>
          <Card style={{ width: '100%', maxWidth: 400 }}>
            <SectionTitle>Report issue — animal #{selected.id}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Reason</label>
                <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                  <option value="dead">Dead</option>
                  <option value="sick">Sick (returned by Tanchoice)</option>
                  <option value="age">Wrong age (returned by Tanchoice)</option>
                </select>
              </div>
              <Input label="Resale price (TSH) — 0 if dead / not yet sold" type="number"
                value={form.resale} onChange={e => setForm(f => ({ ...f, resale: e.target.value }))} />
              <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Btn variant="danger" onClick={handleReject} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Btn>
              <Btn onClick={() => setModal(null)}>Cancel</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
