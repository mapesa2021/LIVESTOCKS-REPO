import React, { useEffect, useState } from 'react'
import { getMnadaPnl, getAnimals } from '../lib/supabase'
import { fmt, fmtDate, Badge, Card, SectionTitle, Spinner, Metric } from '../lib/ui'

export default function Mnadas() {
  const [pnl, setPnl] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [mnadaAnimals, setMnadaAnimals] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMnadaPnl().then(data => { setPnl(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  async function toggleMnada(mnada) {
    if (expanded === mnada) { setExpanded(null); return }
    setExpanded(mnada)
    if (!mnadaAnimals[mnada]) {
      const animals = await getAnimals({ mnada })
      setMnadaAnimals(p => ({ ...p, [mnada]: animals }))
    }
  }

  if (loading) return <Spinner />

  const grandRevenue = pnl.reduce((s, m) => s + Number(m.total_revenue), 0)
  const grandBuy = pnl.reduce((s, m) => s + Number(m.total_buy_cost), 0)
  const grandCosts = pnl.reduce((s, m) => s + Number(m.total_costs), 0)
  const grandPL = grandRevenue - grandBuy - grandCosts

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Grand summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <Metric label="Total mnadas" value={pnl.length} />
        <Metric label="Total animals" value={pnl.reduce((s, m) => s + Number(m.total_animals), 0)} />
        <Metric label="Total buy cost" value={'TSH ' + fmt(grandBuy)} />
        <Metric label="Total revenue" value={'TSH ' + fmt(grandRevenue)} color="#1e7e34" />
        <Metric label="Total other costs" value={'TSH ' + fmt(grandCosts)} color="#c0392b" />
        <Metric label="Net P/L all mnadas" value={'TSH ' + fmt(grandPL)} color={grandPL >= 0 ? '#1e7e34' : '#c0392b'} />
      </div>

      {/* Summary table */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #f0ede8' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>P/L by mnada</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e5e3de', background: '#faf9f7' }}>
                {['Mnada','Animals','Pending','Sold','Dead','Buy cost (TSH)','Revenue (TSH)','Other costs','Net P/L'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 10px', color: '#888', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pnl.length === 0
                ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No mnada data yet</td></tr>
                : pnl.map(m => {
                  const revenue = Number(m.total_revenue)
                  const buy = Number(m.total_buy_cost)
                  const costs = Number(m.total_costs)
                  const pl = revenue - buy - costs
                  return (
                    <tr key={m.mnada} style={{ borderBottom: '0.5px solid #f5f3ee', cursor: 'pointer' }}
                      onClick={() => toggleMnada(m.mnada)}>
                      <td style={{ padding: '9px 10px', fontWeight: 700 }}>
                        <span style={{ marginRight: 6, color: '#aaa' }}>{expanded === m.mnada ? '▼' : '▶'}</span>
                        {m.mnada}
                      </td>
                      <td style={{ padding: '9px 10px' }}>{m.total_animals}</td>
                      <td style={{ padding: '9px 10px' }}>{m.pending}</td>
                      <td style={{ padding: '9px 10px' }}>{m.sold}</td>
                      <td style={{ padding: '9px 10px', color: m.dead > 0 ? '#c0392b' : '#aaa' }}>{m.dead}</td>
                      <td style={{ padding: '9px 10px' }}>{fmt(buy)}</td>
                      <td style={{ padding: '9px 10px', color: '#1e7e34', fontWeight: 500 }}>{revenue > 0 ? fmt(revenue) : '—'}</td>
                      <td style={{ padding: '9px 10px', color: '#c0392b' }}>{costs > 0 ? fmt(costs) : '—'}</td>
                      <td style={{ padding: '9px 10px', fontWeight: 700, color: pl >= 0 ? '#1e7e34' : '#c0392b' }}>
                        {revenue > 0 ? (pl >= 0 ? '+' : '') + fmt(pl) : '—'}
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expandable animal detail per mnada */}
      {pnl.map(m => expanded === m.mnada && (
        <Card key={m.mnada} style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #f0ede8', background: '#faf9f7', borderRadius: '14px 14px 0 0' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{m.mnada} — all animals</span>
          </div>

          {/* Mnada metrics */}
          <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #f0ede8' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
              <Metric label="Total animals" value={m.total_animals} />
              <Metric label="Pending" value={m.pending} />
              <Metric label="Dispatched" value={m.dispatched} />
              <Metric label="Sold" value={m.sold} />
              <Metric label="Dead" value={m.dead} color={m.dead > 0 ? '#c0392b' : undefined} />
              <Metric label="Resold" value={m.resold} />
              <Metric label="Buy cost" value={'TSH ' + fmt(m.total_buy_cost)} />
              <Metric label="Revenue" value={'TSH ' + fmt(m.total_revenue)} color="#1e7e34" />
              <Metric label="Other costs" value={'TSH ' + fmt(m.total_costs)} color="#c0392b" />
              {(() => {
                const pl = Number(m.total_revenue) - Number(m.total_buy_cost) - Number(m.total_costs)
                return <Metric label="Net P/L" value={'TSH ' + fmt(pl)} color={pl >= 0 ? '#1e7e34' : '#c0392b'} />
              })()}
            </div>
          </div>

          {/* Animals table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #e5e3de', background: '#faf9f7' }}>
                  {['#','Type','Date','Sign','Price (TSH)','Agent','Status','Checkpoint'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#888', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!mnadaAnimals[m.mnada]
                  ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#aaa' }}>Loading...</td></tr>
                  : mnadaAnimals[m.mnada].length === 0
                  ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#aaa' }}>No animals</td></tr>
                  : mnadaAnimals[m.mnada].map(a => (
                    <tr key={a.id} style={{ borderBottom: '0.5px solid #f5f3ee' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 700 }}>#{a.id}</td>
                      <td style={{ padding: '7px 10px' }}><Badge type={a.type} /></td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{fmtDate(a.date)}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 500 }}>{a.sign_name || '—'}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 500 }}>{fmt(a.purchase_price)}</td>
                      <td style={{ padding: '7px 10px', color: '#666' }}>{a.agent_name || '—'}</td>
                      <td style={{ padding: '7px 10px' }}><Badge status={a.status} /></td>
                      <td style={{ padding: '7px 10px', color: '#666' }}>{a.checkpoint || '—'}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {pnl.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>
          No mnada data yet — add animals first
        </div>
      )}
    </div>
  )
}
