import React, { useEffect, useState } from 'react'
import { getAgents, getAgentReports, addAgentReport, updateAgentReport, deleteAgentReport,
         getCashFloats, addCashFloat, getAgentCashBalance, getUshurSavings } from '../lib/supabase'
import { fmt, fmtDate, Card, SectionTitle, Input, Btn, Alert, Grid, Spinner } from '../lib/ui'
import { today } from '../lib/ui'

const emptyReport = (agentId) => ({
  agent_id: agentId || '', date: today(), mnada: '',
  cash_at_start: '', zero_day: false, zero_day_reason: '',
  animals_bought: '', purchase_cost: '',
  ushuru_expected: '', ushuru_actual: '',
  transport_cost: '', matumizi: '',
  boma_checkpoint: '', boma_cost: '',
  other_costs: '', other_costs_notes: '',
  jumla: '', baki: '',
  mkopo_amount: '', mkopo_type: 'none', notes: ''
})

export default function AgentReports() {
  const [tab, setTab] = useState('reports')
  const [agents, setAgents] = useState([])
  const [reports, setReports] = useState([])
  const [floats, setFloats] = useState([])
  const [balances, setBalances] = useState([])
  const [savings, setSavings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [form, setForm] = useState(emptyReport())
  const [floatForm, setFloatForm] = useState({ agent_id: '', date: today(), amount: '', type: 'topup', notes: '' })
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [ag, rep, fl, bal, sav] = await Promise.all([
        getAgents(), getAgentReports(), getCashFloats(), getAgentCashBalance(), getUshurSavings()
      ])
      setAgents(ag)
      setReports(rep)
      setFloats(fl)
      setBalances(bal)
      setSavings(sav)
      if (ag.length && !form.agent_id) setForm(f => ({ ...f, agent_id: ag[0].id }))
      if (ag.length && !floatForm.agent_id) setFloatForm(f => ({ ...f, agent_id: ag[0].id }))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function f(k, v) { setForm(p => ({ ...p, [k]: v })) }
  function ff(k, v) { setFloatForm(p => ({ ...p, [k]: v })) }

  // Auto-calc jumla and baki
  function calcTotals(updated) {
    const p = { ...form, ...updated }
    const jumla = (Number(p.purchase_cost) || 0) +
      (Number(p.ushuru_actual) || 0) +
      (Number(p.transport_cost) || 0) +
      (Number(p.matumizi) || 0) +
      (Number(p.boma_cost) || 0) +
      (Number(p.other_costs) || 0)
    const baki = (Number(p.cash_at_start) || 0) - jumla
    return { ...p, jumla, baki }
  }

  function fu(k, v) { setForm(calcTotals({ [k]: v })) }

  async function saveReport() {
    if (!form.agent_id || !form.date || !form.mnada) {
      setMsg({ type: 'danger', text: 'Agent, date and mnada are required.' }); return
    }
    setSaving(true)
    try {
      const payload = {
        agent_id: Number(form.agent_id), date: form.date, mnada: form.mnada,
        cash_at_start: Number(form.cash_at_start) || 0,
        zero_day: form.zero_day, zero_day_reason: form.zero_day_reason || null,
        animals_bought: Number(form.animals_bought) || 0,
        purchase_cost: Number(form.purchase_cost) || 0,
        ushuru_expected: Number(form.ushuru_expected) || 0,
        ushuru_actual: Number(form.ushuru_actual) || 0,
        transport_cost: Number(form.transport_cost) || 0,
        matumizi: Number(form.matumizi) || 0,
        boma_checkpoint: form.boma_checkpoint || null,
        boma_cost: Number(form.boma_cost) || 0,
        other_costs: Number(form.other_costs) || 0,
        other_costs_notes: form.other_costs_notes || null,
        jumla: Number(form.jumla) || 0,
        baki: Number(form.baki) || 0,
        mkopo_amount: Number(form.mkopo_amount) || 0,
        mkopo_type: form.mkopo_type || 'none',
        notes: form.notes || null,
        submitted_by: 'owner'
      }
      if (editingId) {
        await updateAgentReport(editingId, payload)
        setMsg({ type: 'success', text: 'Report updated.' })
        setEditingId(null)
      } else {
        await addAgentReport(payload)
        setMsg({ type: 'success', text: `Report for ${form.mnada} saved.` })
      }
      setForm(emptyReport(form.agent_id))
      load()
    } catch (e) { setMsg({ type: 'danger', text: e.message }) }
    finally { setSaving(false) }
  }

  async function saveFloat() {
    if (!floatForm.agent_id || !floatForm.amount) {
      setMsg({ type: 'danger', text: 'Agent and amount required.' }); return
    }
    setSaving(true)
    try {
      await addCashFloat({
        agent_id: Number(floatForm.agent_id), date: floatForm.date,
        amount: Number(floatForm.amount), type: floatForm.type, notes: floatForm.notes || null
      })
      setMsg({ type: 'success', text: 'Cash entry recorded.' })
      setFloatForm(p => ({ ...p, amount: '', notes: '' }))
      load()
    } catch (e) { setMsg({ type: 'danger', text: e.message }) }
    finally { setSaving(false) }
  }

  function startEdit(r) {
    setEditingId(r.id)
    setForm({
      agent_id: r.agent_id, date: r.date, mnada: r.mnada,
      cash_at_start: r.cash_at_start, zero_day: r.zero_day,
      zero_day_reason: r.zero_day_reason || '',
      animals_bought: r.animals_bought, purchase_cost: r.purchase_cost,
      ushuru_expected: r.ushuru_expected, ushuru_actual: r.ushuru_actual,
      transport_cost: r.transport_cost, matumizi: r.matumizi,
      boma_checkpoint: r.boma_checkpoint || '', boma_cost: r.boma_cost,
      other_costs: r.other_costs, other_costs_notes: r.other_costs_notes || '',
      jumla: r.jumla, baki: r.baki,
      mkopo_amount: r.mkopo_amount, mkopo_type: r.mkopo_type, notes: r.notes || ''
    })
    setTab('add')
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this report?')) return
    await deleteAgentReport(id); load()
  }

  const filteredReports = selectedAgent
    ? reports.filter(r => r.agent_id === Number(selectedAgent))
    : reports

  const totalSavings = savings.reduce((s, r) => s + Number(r.saving), 0)

  const tabStyle = (t) => ({
    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', border: '0.5px solid',
    background: tab === t ? '#1a1a1a' : '#fff',
    color: tab === t ? '#fff' : '#555',
    borderColor: tab === t ? '#1a1a1a' : '#ccc'
  })

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button style={tabStyle('reports')} onClick={() => setTab('reports')}>Daily Reports</button>
        <button style={tabStyle('add')} onClick={() => { setTab('add'); setEditingId(null); setForm(emptyReport(agents[0]?.id)) }}>+ Add Report</button>
        <button style={tabStyle('float')} onClick={() => setTab('float')}>Cash Float</button>
        <button style={tabStyle('balance')} onClick={() => setTab('balance')}>Agent Balances</button>
        <button style={tabStyle('savings')} onClick={() => setTab('savings')}>Ushuru Savings</button>
      </div>

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      {/* ── DAILY REPORTS LIST ── */}
      {tab === 'reports' && (
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #f0ede8', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>Daily reports ({filteredReports.length})</span>
            <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}
              style={{ padding: '6px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
              <option value="">All agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #e5e3de', background: '#faf9f7' }}>
                  {['Date','Mnada','Agent','Animals','Cash start','Spent (Jumla)','Baki','Mkopo',''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '9px 10px', color: '#888', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0
                  ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No reports yet</td></tr>
                  : filteredReports.map(r => (
                    <tr key={r.id} style={{ borderBottom: '0.5px solid #f5f3ee' }}>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{fmtDate(r.date)}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                        {r.mnada}
                        {r.zero_day && <span style={{ marginLeft: 6, fontSize: 11, color: '#c0392b', background: '#FDECEC', padding: '1px 6px', borderRadius: 10 }}>Zero day</span>}
                      </td>
                      <td style={{ padding: '8px 10px' }}>{r.agents?.name || '—'}</td>
                      <td style={{ padding: '8px 10px' }}>{r.animals_bought || 0}</td>
                      <td style={{ padding: '8px 10px' }}>{fmt(r.cash_at_start)}</td>
                      <td style={{ padding: '8px 10px', color: '#c0392b', fontWeight: 500 }}>{fmt(r.jumla)}</td>
                      <td style={{ padding: '8px 10px', color: r.baki >= 0 ? '#1e7e34' : '#c0392b', fontWeight: 600 }}>{fmt(r.baki)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        {r.mkopo_type !== 'none' && r.mkopo_amount > 0 && (
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: r.mkopo_type === 'given' ? '#FEF9EC' : '#EAF5EA', color: r.mkopo_type === 'given' ? '#92600A' : '#1e7e34' }}>
                            {r.mkopo_type === 'given' ? '+' : '-'}{fmt(r.mkopo_amount)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Btn size="sm" onClick={() => startEdit(r)}>Edit</Btn>
                          <Btn size="sm" variant="danger" onClick={() => handleDelete(r.id)}>Del</Btn>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── ADD / EDIT REPORT ── */}
      {tab === 'add' && (
        <Card>
          <SectionTitle>{editingId ? 'Edit report' : 'Add daily agent report'}</SectionTitle>

          <Grid cols={3} gap={12}>
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Agent</label>
              <select value={form.agent_id} onChange={e => f('agent_id', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <Input label="Date" type="date" value={form.date} onChange={e => f('date', e.target.value)} />
            <Input label="Mnada name" value={form.mnada} onChange={e => f('mnada', e.target.value)} placeholder="e.g. Galapo, Luqmanda" />
          </Grid>

          {/* Zero day toggle */}
          <div style={{ margin: '14px 0', padding: '10px 14px', background: '#faf9f7', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.zero_day} onChange={e => f('zero_day', e.target.checked)} />
              Zero day (went to mnada but no animals bought)
            </label>
            {form.zero_day && (
              <input value={form.zero_day_reason} onChange={e => f('zero_day_reason', e.target.value)}
                placeholder="Reason (e.g. Hatukwenda, Hamna mbuzi...)"
                style={{ flex: 1, padding: '6px 10px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
            )}
          </div>

          <Grid cols={2} gap={12}>
            <Input label="Cash at start of day (TSH)" type="number" value={form.cash_at_start} onChange={e => fu('cash_at_start', e.target.value)} placeholder="0" />
            <Input label="Animals bought" type="number" value={form.animals_bought} onChange={e => f('animals_bought', e.target.value)} placeholder="0" />
          </Grid>

          <div style={{ marginTop: 12, fontSize: 11, color: '#aaa', fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>EXPENSES</div>

          <Grid cols={2} gap={12}>
            <Input label="Purchase cost — Manunuzi (TSH)" type="number" value={form.purchase_cost} onChange={e => fu('purchase_cost', e.target.value)} placeholder="0" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Input label="Ushuru expected (TSH)" type="number" value={form.ushuru_expected} onChange={e => fu('ushuru_expected', e.target.value)} placeholder="0" />
              <Input label="Ushuru actual paid (TSH)" type="number" value={form.ushuru_actual} onChange={e => fu('ushuru_actual', e.target.value)} placeholder="0" />
            </div>
          </Grid>

          {form.ushuru_expected > 0 && form.ushuru_actual > 0 && Number(form.ushuru_expected) > Number(form.ushuru_actual) && (
            <div style={{ fontSize: 12, color: '#1e7e34', fontWeight: 600, marginTop: 4 }}>
              ✓ Ushuru saving: TSH {fmt(Number(form.ushuru_expected) - Number(form.ushuru_actual))}
            </div>
          )}

          <Grid cols={2} gap={12} style={{ marginTop: 10 }}>
            <Input label="Transport / Gari (TSH)" type="number" value={form.transport_cost} onChange={e => fu('transport_cost', e.target.value)} placeholder="0" />
            <Input label="Matumizi (agent expenses) (TSH)" type="number" value={form.matumizi} onChange={e => fu('matumizi', e.target.value)} placeholder="0" />
          </Grid>

          <Grid cols={2} gap={12} style={{ marginTop: 10 }}>
            <Input label="Boma / holding checkpoint" value={form.boma_checkpoint} onChange={e => f('boma_checkpoint', e.target.value)} placeholder="e.g. Nangara boma" />
            <Input label="Boma / wachungaji cost (TSH)" type="number" value={form.boma_cost} onChange={e => fu('boma_cost', e.target.value)} placeholder="0" />
          </Grid>

          <Grid cols={2} gap={12} style={{ marginTop: 10 }}>
            <Input label="Other costs (TSH)" type="number" value={form.other_costs} onChange={e => fu('other_costs', e.target.value)} placeholder="0" />
            <Input label="Other costs notes" value={form.other_costs_notes} onChange={e => f('other_costs_notes', e.target.value)} placeholder="e.g. Gharam ya boma Endasaki" />
          </Grid>

          {/* Mkopo section */}
          <div style={{ marginTop: 14, padding: '12px 14px', background: '#FFFDF0', border: '0.5px solid #F5D27A', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#92600A', marginBottom: 8 }}>MKOPO (LOAN)</div>
            <Grid cols={3} gap={10}>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Mkopo type</label>
                <select value={form.mkopo_type} onChange={e => f('mkopo_type', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                  <option value="none">No mkopo today</option>
                  <option value="given">Agent used own money (mkopo given)</option>
                  <option value="repaid">Mkopo repaid to agent</option>
                </select>
              </div>
              {form.mkopo_type !== 'none' && (
                <Input label="Mkopo amount (TSH)" type="number" value={form.mkopo_amount} onChange={e => f('mkopo_amount', e.target.value)} placeholder="0" />
              )}
            </Grid>
          </div>

          {/* Auto-calculated totals */}
          <div style={{ marginTop: 14, padding: '14px 16px', background: '#f0f8f4', borderRadius: 8, border: '0.5px solid #82c982' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>JUMLA (total spent)</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#c0392b' }}>TSH {fmt(form.jumla)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>BAKI (cash remaining)</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: Number(form.baki) >= 0 ? '#1e7e34' : '#c0392b' }}>TSH {fmt(form.baki)}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <Input label="Additional notes" value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="optional" />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn variant="primary" onClick={saveReport} disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update report' : 'Save report'}</Btn>
            <Btn onClick={() => { setEditingId(null); setForm(emptyReport(agents[0]?.id)); setMsg(null) }}>Clear</Btn>
          </div>
        </Card>
      )}

      {/* ── CASH FLOAT ── */}
      {tab === 'float' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionTitle>Record cash movement</SectionTitle>
            <Grid cols={2} gap={12}>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Agent</label>
                <select value={floatForm.agent_id} onChange={e => ff('agent_id', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <Input label="Date" type="date" value={floatForm.date} onChange={e => ff('date', e.target.value)} />
            </Grid>
            <Grid cols={2} gap={12} style={{ marginTop: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Type</label>
                <select value={floatForm.type} onChange={e => ff('type', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                  <option value="topup">Top up (you sent money to agent)</option>
                  <option value="return">Return (agent returned cash to you)</option>
                  <option value="mkopo_given">Mkopo given (agent used own money)</option>
                  <option value="mkopo_repaid">Mkopo repaid (you paid agent back)</option>
                </select>
              </div>
              <Input label="Amount (TSH)" type="number" value={floatForm.amount} onChange={e => ff('amount', e.target.value)} placeholder="0" />
            </Grid>
            <div style={{ marginTop: 10 }}>
              <Input label="Notes" value={floatForm.notes} onChange={e => ff('notes', e.target.value)} placeholder="optional" />
            </div>
            <div style={{ marginTop: 14 }}>
              <Btn variant="primary" onClick={saveFloat} disabled={saving}>{saving ? 'Saving...' : 'Record'}</Btn>
            </div>
          </Card>

          <Card style={{ padding: 0 }}>
            <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #f0ede8' }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Cash float log</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #e5e3de', background: '#faf9f7' }}>
                    {['Date','Agent','Type','Amount (TSH)','Notes'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '9px 10px', color: '#888', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {floats.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No entries yet</td></tr>
                    : floats.map(f => (
                      <tr key={f.id} style={{ borderBottom: '0.5px solid #f5f3ee' }}>
                        <td style={{ padding: '8px 10px' }}>{fmtDate(f.date)}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 500 }}>{f.agents?.name || '—'}</td>
                        <td style={{ padding: '8px 10px' }}>{
                          { topup: 'Top up sent', return: 'Cash returned', mkopo_given: 'Mkopo given', mkopo_repaid: 'Mkopo repaid' }[f.type]
                        }</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: ['topup','mkopo_given'].includes(f.type) ? '#c0392b' : '#1e7e34' }}>{fmt(f.amount)}</td>
                        <td style={{ padding: '8px 10px', color: '#666' }}>{f.notes || '—'}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── AGENT BALANCES ── */}
      {tab === 'balance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {balances.length === 0
            ? <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>No balance data yet</div>
            : balances.map(b => {
              const mkopoPending = Number(b.total_mkopo_given) - Number(b.total_mkopo_repaid)
              return (
                <Card key={b.agent_id}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>{b.agent_name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                    <div style={{ background: '#f9f8f5', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Total sent to agent</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#c0392b' }}>TSH {fmt(b.total_sent)}</div>
                    </div>
                    <div style={{ background: '#f9f8f5', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Total spent</div>
                      <div style={{ fontSize: 18, fontWeight: 600 }}>TSH {fmt(b.total_spent)}</div>
                    </div>
                    <div style={{ background: '#f9f8f5', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Cash returned</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#1e7e34' }}>TSH {fmt(b.total_returned)}</div>
                    </div>
                    <div style={{ background: '#f9f8f5', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Calculated BAKI</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: Number(b.calculated_baki) >= 0 ? '#1e7e34' : '#c0392b' }}>
                        TSH {fmt(b.calculated_baki)}
                      </div>
                    </div>
                    {mkopoPending > 0 && (
                      <div style={{ background: '#FFFDF0', borderRadius: 10, padding: '12px 14px', border: '0.5px solid #F5D27A' }}>
                        <div style={{ fontSize: 11, color: '#92600A', marginBottom: 3 }}>Mkopo outstanding</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: '#92600A' }}>TSH {fmt(mkopoPending)}</div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })
          }
        </div>
      )}

      {/* ── USHURU SAVINGS ── */}
      {tab === 'savings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '12px 16px', background: '#f0faf4', borderRadius: 10, border: '0.5px solid #82c982', fontSize: 14 }}>
            <strong>Total ushuru savings to date: TSH {fmt(totalSavings)}</strong>
          </div>
          <Card style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #e5e3de', background: '#faf9f7' }}>
                    {['Date','Mnada','Expected (TSH)','Paid (TSH)','Saving (TSH)'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '9px 10px', color: '#888', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {savings.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No savings recorded yet</td></tr>
                    : savings.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '0.5px solid #f5f3ee' }}>
                        <td style={{ padding: '8px 10px' }}>{fmtDate(s.date)}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.mnada}</td>
                        <td style={{ padding: '8px 10px', color: '#c0392b' }}>{fmt(s.ushuru_expected)}</td>
                        <td style={{ padding: '8px 10px' }}>{fmt(s.ushuru_actual)}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1e7e34' }}>+{fmt(s.saving)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
