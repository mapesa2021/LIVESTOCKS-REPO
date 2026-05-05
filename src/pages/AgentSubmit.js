import React, { useEffect, useState } from 'react'
import { getAgents, addAgentReport } from '../lib/supabase'
import { fmt, Input, Alert, Grid } from '../lib/ui'
import { today } from '../lib/ui'

const empty = (agentId) => ({
  agent_id: agentId || '', date: today(), mnada: '',
  cash_at_start: '', zero_day: false, zero_day_reason: '',
  animals_bought: '', purchase_cost: '',
  ushuru_expected: '', ushuru_actual: '',
  transport_cost: '', matumizi: '',
  boma_checkpoint: '', boma_cost: '',
  other_costs: '', other_costs_notes: '',
  mkopo_amount: '', mkopo_type: 'none', notes: ''
})

export default function AgentSubmit() {
  const [agents, setAgents] = useState([])
  const [form, setForm] = useState(empty())
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { getAgents().then(setAgents) }, [])

  function f(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function calcTotals(updated) {
    const p = { ...form, ...updated }
    const jumla = (Number(p.purchase_cost)||0) + (Number(p.ushuru_actual)||0) +
      (Number(p.transport_cost)||0) + (Number(p.matumizi)||0) +
      (Number(p.boma_cost)||0) + (Number(p.other_costs)||0)
    const baki = (Number(p.cash_at_start)||0) - jumla
    return { ...p, jumla, baki }
  }

  function fu(k, v) { setForm(calcTotals({ [k]: v })) }

  const jumla = (Number(form.purchase_cost)||0) + (Number(form.ushuru_actual)||0) +
    (Number(form.transport_cost)||0) + (Number(form.matumizi)||0) +
    (Number(form.boma_cost)||0) + (Number(form.other_costs)||0)
  const baki = (Number(form.cash_at_start)||0) - jumla

  async function handleSubmit() {
    if (!form.agent_id || !form.mnada || !form.date) {
      setMsg({ type: 'danger', text: 'Jaza: Jina lako, tarehe, na mnada.' }); return
    }
    setSaving(true)
    try {
      await addAgentReport({
        agent_id: Number(form.agent_id), date: form.date, mnada: form.mnada,
        cash_at_start: Number(form.cash_at_start)||0,
        zero_day: form.zero_day, zero_day_reason: form.zero_day_reason || null,
        animals_bought: Number(form.animals_bought)||0,
        purchase_cost: Number(form.purchase_cost)||0,
        ushuru_expected: Number(form.ushuru_expected)||0,
        ushuru_actual: Number(form.ushuru_actual)||0,
        transport_cost: Number(form.transport_cost)||0,
        matumizi: Number(form.matumizi)||0,
        boma_checkpoint: form.boma_checkpoint || null,
        boma_cost: Number(form.boma_cost)||0,
        other_costs: Number(form.other_costs)||0,
        other_costs_notes: form.other_costs_notes || null,
        jumla, baki,
        mkopo_amount: Number(form.mkopo_amount)||0,
        mkopo_type: form.mkopo_type || 'none',
        notes: form.notes || null,
        submitted_by: 'agent'
      })
      setSubmitted(true)
    } catch (e) { setMsg({ type: 'danger', text: e.message }) }
    finally { setSaving(false) }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: '-apple-system, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Imesalia salama!</h2>
          <p style={{ color: '#666', fontSize: 14 }}>Ripoti yako ya {form.mnada} imesajiliwa. Asante {agents.find(a => a.id === Number(form.agent_id))?.name}.</p>
          <button onClick={() => { setSubmitted(false); setForm(empty()) }}
            style={{ marginTop: 24, padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            Ingiza ripoti nyingine
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: '-apple-system, sans-serif', padding: '0 0 40px' }}>
      <div style={{ background: '#1a1a1a', color: '#fff', padding: '16px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>🐐 Ripoti ya Kila Siku</div>
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>Ingiza taarifa ya mnada wa leo</div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {msg && <Alert type={msg.type}>{msg.text}</Alert>}

        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 16px', border: '0.5px solid #e5e3de' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#aaa', letterSpacing: 1, marginBottom: 10 }}>MAELEZO YA MSINGI</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Jina lako</label>
              <select value={form.agent_id} onChange={e => f('agent_id', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 14, fontFamily: 'inherit' }}>
                <option value="">— Chagua jina lako —</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <Input label="Tarehe" type="date" value={form.date} onChange={e => f('date', e.target.value)} />
            <Input label="Mnada" value={form.mnada} onChange={e => f('mnada', e.target.value)} placeholder="e.g. Galapo, Luqmanda..." />
            <Input label="Cash uliyoanza nayo (TSH)" type="number" value={form.cash_at_start} onChange={e => fu('cash_at_start', e.target.value)} placeholder="0" />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 16px', border: '0.5px solid #e5e3de' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, marginBottom: form.zero_day ? 10 : 0 }}>
            <input type="checkbox" checked={form.zero_day} onChange={e => f('zero_day', e.target.checked)} style={{ width: 16, height: 16 }} />
            Siku ya bure (Hatukwenda / Hamna mbuzi)
          </label>
          {form.zero_day && (
            <Input label="Sababu" value={form.zero_day_reason} onChange={e => f('zero_day_reason', e.target.value)} placeholder="e.g. Hatukwenda, Hamna mbuzi..." />
          )}
        </div>

        {!form.zero_day && (<>
          <div style={{ background: '#fff', borderRadius: 14, padding: '18px 16px', border: '0.5px solid #e5e3de' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#aaa', letterSpacing: 1, marginBottom: 10 }}>MANUNUZI</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="Idadi ya mbuzi/kondoo" type="number" value={form.animals_bought} onChange={e => f('animals_bought', e.target.value)} placeholder="0" />
              <Input label="Gharama ya manunuzi (TSH)" type="number" value={form.purchase_cost} onChange={e => fu('purchase_cost', e.target.value)} placeholder="0" />
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: '18px 16px', border: '0.5px solid #e5e3de' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#aaa', letterSpacing: 1, marginBottom: 10 }}>MATUMIZI MENGINE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Grid cols={2} gap={8}>
                <Input label="Ushuru ilikuwa (TSH)" type="number" value={form.ushuru_expected} onChange={e => fu('ushuru_expected', e.target.value)} placeholder="0" />
                <Input label="Ushuru uliulipa (TSH)" type="number" value={form.ushuru_actual} onChange={e => fu('ushuru_actual', e.target.value)} placeholder="0" />
              </Grid>
              {Number(form.ushuru_expected) > Number(form.ushuru_actual) && Number(form.ushuru_actual) > 0 && (
                <div style={{ fontSize: 12, color: '#1e7e34', fontWeight: 600 }}>✓ Umeokoa: TSH {fmt(Number(form.ushuru_expected) - Number(form.ushuru_actual))}</div>
              )}
              <Input label="Gari / usafiri (TSH)" type="number" value={form.transport_cost} onChange={e => fu('transport_cost', e.target.value)} placeholder="0" />
              <Input label="Matumizi yako (TSH)" type="number" value={form.matumizi} onChange={e => fu('matumizi', e.target.value)} placeholder="0" />
              <Grid cols={2} gap={8}>
                <Input label="Boma (mahali)" value={form.boma_checkpoint} onChange={e => f('boma_checkpoint', e.target.value)} placeholder="e.g. Nangara" />
                <Input label="Gharama ya boma (TSH)" type="number" value={form.boma_cost} onChange={e => fu('boma_cost', e.target.value)} placeholder="0" />
              </Grid>
              <Input label="Matumizi mengine (TSH)" type="number" value={form.other_costs} onChange={e => fu('other_costs', e.target.value)} placeholder="0" />
              <Input label="Maelezo ya matumizi mengine" value={form.other_costs_notes} onChange={e => f('other_costs_notes', e.target.value)} placeholder="optional" />
            </div>
          </div>
        </>)}

        <div style={{ background: '#FFFDF0', borderRadius: 14, padding: '18px 16px', border: '0.5px solid #F5D27A' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#92600A', letterSpacing: 1, marginBottom: 10 }}>MKOPO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Mkopo leo</label>
              <select value={form.mkopo_type} onChange={e => f('mkopo_type', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 14, fontFamily: 'inherit' }}>
                <option value="none">Hakuna mkopo</option>
                <option value="given">Nimetumia pesa zangu (mkopo)</option>
                <option value="repaid">Mkopo ulirudishwa kwangu</option>
              </select>
            </div>
            {form.mkopo_type !== 'none' && (
              <Input label="Kiasi (TSH)" type="number" value={form.mkopo_amount} onChange={e => f('mkopo_amount', e.target.value)} placeholder="0" />
            )}
          </div>
        </div>

        <div style={{ background: '#f0faf4', borderRadius: 14, padding: '18px 16px', border: '0.5px solid #82c982' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#888' }}>JUMLA</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#c0392b' }}>TSH {fmt(jumla)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#888' }}>BAKI</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: baki >= 0 ? '#1e7e34' : '#c0392b' }}>TSH {fmt(baki)}</div>
            </div>
          </div>
        </div>

        <Input label="Maelezo zaidi (optional)" value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Kitu chochote kingine..." />

        <button onClick={handleSubmit} disabled={saving} style={{
          padding: '14px', background: '#1a1a1a', color: '#fff', border: 'none',
          borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
        }}>
          {saving ? 'Inatuma...' : 'Tuma Ripoti'}
        </button>
      </div>
    </div>
  )
}
