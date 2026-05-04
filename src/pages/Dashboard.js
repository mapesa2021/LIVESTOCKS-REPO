import React, { useEffect, useState } from 'react'
import { getDashboardStats, getAnimals, getDispatches, getPayments } from '../lib/supabase'
import { fmt, fmtDate, Badge, Metric, Card, SectionTitle, Spinner } from '../lib/ui'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [dispatches, setDispatches] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, a, d, p] = await Promise.all([
          getDashboardStats(), getAnimals(), getDispatches(), getPayments()
        ])
        setStats(s)
        setRecent(a.slice(0, 8))
        setDispatches(d.slice(0, 8))
        setPayments(p)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <Spinner />
  if (!stats) return <div style={{ padding: 32, color: '#999' }}>Could not load data</div>

  const pl = stats.netPL
  const plColor = pl >= 0 ? '#1e7e34' : '#c0392b'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
        <Metric label="Total animals" value={stats.totalAnimals} />
        <Metric label="In hand" value={stats.pending} sub="pending dispatch" />
        <Metric label="Dispatched" value={stats.dispatched} />
        <Metric label="Sold / paid" value={stats.sold} />
        <Metric label="Dead losses" value={stats.dead} color="#c0392b" />
        <Metric label="Total kg sold" value={fmt(stats.totalKg) + ' kg'} />
        <Metric label="Total revenue" value={'TSH ' + fmt(stats.totalRevenue)} color="#1e7e34" />
        <Metric label="Net P/L" value={'TSH ' + fmt(pl)} color={plColor}
          sub={pl >= 0 ? '▲ Profit' : '▼ Loss'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Sign P&L */}
        <Card>
          <SectionTitle>P/L by sign</SectionTitle>
          {stats.signPnl.length === 0
            ? <p style={{ color: '#aaa', fontSize: 13 }}>No signs yet</p>
            : stats.signPnl.map(s => {
              const revenue = Number(s.total_revenue)
              const buy = Number(s.total_buy_cost)
              const costs = Number(s.total_costs)
              const pl = revenue - buy - costs
              return (
                <div key={s.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '0.5px solid #f0ede8', fontSize: 13
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                    <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>{s.mnada}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: pl >= 0 ? '#1e7e34' : '#c0392b' }}>
                      {pl >= 0 ? '+' : ''}{fmt(pl)} TSH
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{s.total_animals} animals</div>
                  </div>
                </div>
              )
            })
          }
        </Card>

        {/* Recent animals */}
        <Card>
          <SectionTitle>Recent purchases</SectionTitle>
          {recent.length === 0
            ? <p style={{ color: '#aaa', fontSize: 13 }}>No animals yet</p>
            : recent.map(a => (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0', borderBottom: '0.5px solid #f0ede8', fontSize: 13
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>#{a.id}</span>
                  <Badge type={a.type} />
                  <span style={{ color: '#666', marginLeft: 6 }}>{a.sign_name || '—'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 500 }}>{fmt(a.purchase_price)} TSH</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{fmtDate(a.date)}</div>
                </div>
              </div>
            ))
          }
        </Card>
      </div>

      {/* Dispatch history */}
      <Card>
        <SectionTitle>Dispatch batches</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e5e3de' }}>
                {['Batch #', 'Date', 'Method', 'Animals', 'Revenue (TSH)', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#888', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dispatches.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>No dispatches yet</td></tr>
                : dispatches.map(d => {
                  const paid = payments.filter(p => p.dispatch_id === d.id)
                  const revenue = paid.reduce((s, p) => s + Number(p.revenue), 0)
                  return (
                    <tr key={d.id} style={{ borderBottom: '0.5px solid #f5f3ee' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>#{d.id}</td>
                      <td style={{ padding: '8px 10px' }}>{fmtDate(d.date)}</td>
                      <td style={{ padding: '8px 10px', textTransform: 'capitalize' }}>{d.method}</td>
                      <td style={{ padding: '8px 10px' }}>—</td>
                      <td style={{ padding: '8px 10px', fontWeight: 500, color: revenue > 0 ? '#1e7e34' : '#999' }}>
                        {revenue > 0 ? fmt(revenue) : 'Awaiting payment'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <Badge status={revenue > 0 ? 'sold' : 'dispatched'} />
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
