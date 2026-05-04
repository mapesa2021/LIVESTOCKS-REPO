import React, { useEffect, useState } from 'react'
import { getSigns, getAnimals, getDispatches, addDispatch, addPayment, getPayments } from '../lib/supabase'
import { fmt, fmtDate, Card, SectionTitle, Input, Select, Btn, Alert, Grid, Badge, Spinner } from '../lib/ui'
import { today } from '../lib/ui'

export default function Dispatch() {
  const [signs, setSigns] = useState([])
  const [dispatches, setDispatches] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  // Dispatch form
  const [dDate, setDDate] = useState(today())
  const [dMethod, setDMethod] = useState('slaughter')
  const [dRate, setDRate] = useState('11000')
  const [dSign, setDSign] = useState('')
  const [dDestination, setDDestination] = useState('')
  const [dNotes, setDNotes] = useState('')
  const [pendingAnimals, setPendingAnimals] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [dMsg, setDMsg] = useState(null)
  const [dSaving, setDSaving] = useState(false)

  // Payment form
  const [pBatch, setPBatch] = useState('')
  const [pSign, setPSign] = useState('')
  const [pKg, setPKg] = useState('')
  const [pOverride, setPOverride] = useState('')
  const [pMsg, setPMsg] = useState(null)
  const [pSaving, setPSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [s, d, p] = await Promise.all([getSigns(), getDispatches(), getPayments()])
      setSigns(s)
      setDispatches(d)
      setPayments(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function loadSignAnimals(signId) {
    setDSign(signId)
    setSelectedIds([])
    if (!signId) { setPendingAnimals([]); return }
    const animals = await getAnimals({ status: 'pending', sign_id: signId })
    setPendingAnimals(animals)
    setSelectedIds(animals.map(a => a.id))
  }

  function toggleAnimal(id) {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  async function handleDispatch() {
    if (!dDate || !dSign || selectedIds.length === 0) {
      setDMsg({ type: 'danger', text: 'Select date, sign, and at least one animal.' })
      return
    }
    setDSaving(true)
    try {
      await addDispatch({
        date: dDate, method: dMethod,
        rate_per_kg: Number(dRate),
        destination: dDestination || null,
        notes: dNotes || null
      }, selectedIds)
      setDMsg({ type: 'success', text: `Batch dispatched — ${selectedIds.length} animals sent to Tanchoice.` })
      setDSign('')
      setPendingAnimals([])
      setSelectedIds([])
      load()
    } catch (e) { setDMsg({ type: 'danger', text: e.message }) }
    finally { setDSaving(false) }
  }

  const autoRevenue = pKg && pBatch
    ? Math.round(Number(pKg) * Number((dispatches.find(d => d.id === Number(pBatch))?.rate_per_kg) || 11000))
    : 0

  async function handlePayment() {
    if (!pBatch || !pSign || !pKg) {
      setPMsg({ type: 'danger', text: 'Fill in batch, sign, and kg.' })
      return
    }
    setPSaving(true)
    try {
      const revenue = Number(pOverride) || autoRevenue
      await addPayment({
        dispatch_id: Number(pBatch),
        sign_id: Number(pSign),
        kg_assigned: Number(pKg),
        revenue,
        date: today()
      })
      setPMsg({ type: 'success', text: `Payment recorded. Revenue: TSH ${revenue.toLocaleString()}` })
      setPBatch(''); setPSign(''); setPKg(''); setPOverride('')
      load()
    } catch (e) { setPMsg({ type: 'danger', text: e.message }) }
    finally { setPSaving(false) }
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Dispatch form */}
      <Card>
        <SectionTitle>Send batch to Tanchoice</SectionTitle>
        <Grid cols={3} gap={12}>
          <Input label="Dispatch date" type="date" value={dDate} onChange={e => setDDate(e.target.value)} />
          <Select label="Payment method" value={dMethod} onChange={e => setDMethod(e.target.value)}>
            <option value="slaughter">Slaughter (paid per meat kg)</option>
            <option value="ranch">Ranch / Dodoma (paid per live weight)</option>
          </Select>
          <Input label="TSH per kg" type="number" value={dRate} onChange={e => setDRate(e.target.value)} />
        </Grid>
        <div style={{ marginTop: 12 }}>
          <Select label="Sign / group to dispatch" value={dSign} onChange={e => loadSignAnimals(e.target.value)}>
            <option value="">— select sign —</option>
            {signs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.mnada})</option>)}
          </Select>
        </div>

        {pendingAnimals.length > 0 && (
          <div style={{ marginTop: 12, border: '0.5px solid #e5e3de', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: '#faf9f7', fontSize: 12, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
              <span>Select animals to include</span>
              <span>{selectedIds.length} of {pendingAnimals.length} selected</span>
            </div>
            {pendingAnimals.map(a => (
              <label key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                borderTop: '0.5px solid #f0ede8', cursor: 'pointer', fontSize: 13
              }}>
                <input type="checkbox" checked={selectedIds.includes(a.id)} onChange={() => toggleAnimal(a.id)} />
                <span style={{ fontWeight: 600 }}>#{a.id}</span>
                <Badge type={a.type} />
                <span style={{ color: '#666' }}>{a.mnada}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 500 }}>{fmt(a.purchase_price)} TSH</span>
                {a.live_weight_est && <span style={{ color: '#aaa', fontSize: 12 }}>{a.live_weight_est} kg</span>}
              </label>
            ))}
          </div>
        )}
        {dSign && pendingAnimals.length === 0 && (
          <p style={{ fontSize: 13, color: '#aaa', marginTop: 12 }}>No pending animals under this sign.</p>
        )}

        <Grid cols={2} gap={12} style={{ marginTop: 12 }}>
          <Input label="Tanchoice destination" value={dDestination} onChange={e => setDDestination(e.target.value)} placeholder="e.g. Arusha plant" />
          <Input label="Notes" value={dNotes} onChange={e => setDNotes(e.target.value)} placeholder="optional" />
        </Grid>
        <div style={{ marginTop: 16 }}>
          <Btn variant="primary" onClick={handleDispatch} disabled={dSaving}>
            {dSaving ? 'Dispatching...' : `Dispatch ${selectedIds.length} animal${selectedIds.length !== 1 ? 's' : ''}`}
          </Btn>
        </div>
        {dMsg && <Alert type={dMsg.type}>{dMsg.text}</Alert>}
      </Card>

      {/* Payment form */}
      <Card>
        <SectionTitle>Record Tanchoice payment</SectionTitle>
        <Grid cols={3} gap={12}>
          <Select label="Dispatch batch" value={pBatch} onChange={e => setPBatch(e.target.value)}>
            <option value="">— select batch —</option>
            {dispatches.map(d => <option key={d.id} value={d.id}>Batch #{d.id} — {fmtDate(d.date)}</option>)}
          </Select>
          <Select label="Sign being paid" value={pSign} onChange={e => setPSign(e.target.value)}>
            <option value="">— select sign —</option>
            {signs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Input label="Meat kg assigned by Tanchoice" type="number" value={pKg} onChange={e => setPKg(e.target.value)} placeholder="0" />
        </Grid>
        <Grid cols={2} gap={12} style={{ marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Auto revenue (TSH)</label>
            <div style={{ padding: '8px 12px', background: '#f5f5f3', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#1e7e34' }}>
              {autoRevenue > 0 ? autoRevenue.toLocaleString() : '—'}
            </div>
          </div>
          <Input label="Override revenue (if Tanchoice says different)" type="number" value={pOverride} onChange={e => setPOverride(e.target.value)} placeholder="leave blank to use auto" />
        </Grid>
        <div style={{ marginTop: 16 }}>
          <Btn variant="success" onClick={handlePayment} disabled={pSaving}>
            {pSaving ? 'Saving...' : 'Record payment'}
          </Btn>
        </div>
        {pMsg && <Alert type={pMsg.type}>{pMsg.text}</Alert>}
      </Card>

      {/* Dispatch log */}
      <Card>
        <SectionTitle>Dispatch log</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e5e3de', background: '#faf9f7' }}>
                {['Batch #', 'Date', 'Method', 'Rate/kg', 'Destination', 'Revenue (TSH)'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 10px', color: '#888', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dispatches.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No dispatches yet</td></tr>
                : dispatches.map(d => {
                  const paid = payments.filter(p => p.dispatch_id === d.id)
                  const revenue = paid.reduce((s, p) => s + Number(p.revenue), 0)
                  return (
                    <tr key={d.id} style={{ borderBottom: '0.5px solid #f5f3ee' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>#{d.id}</td>
                      <td style={{ padding: '8px 10px' }}>{fmtDate(d.date)}</td>
                      <td style={{ padding: '8px 10px', textTransform: 'capitalize' }}>{d.method}</td>
                      <td style={{ padding: '8px 10px' }}>{fmt(d.rate_per_kg)}</td>
                      <td style={{ padding: '8px 10px', color: '#666' }}>{d.destination || '—'}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: revenue > 0 ? '#1e7e34' : '#aaa' }}>
                        {revenue > 0 ? fmt(revenue) : 'Awaiting payment'}
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
