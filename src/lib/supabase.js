import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

const COMMISSION_PER_ANIMAL = 1000
const COMMISSION_MIN_PROFIT = 3000

// ── Animals ──────────────────────────────────────
export async function getAnimals(filters = {}) {
  let q = supabase.from('animals_full').select('*').order('created_at', { ascending: false })
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.type)   q = q.eq('type', filters.type)
  if (filters.sign_id) q = q.eq('sign_id', filters.sign_id)
  if (filters.mnada)  q = q.eq('mnada', filters.mnada)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function addAnimal(animal) {
  const { data, error } = await supabase.from('animals').insert([animal]).select().single()
  if (error) throw error
  if (animal.checkpoint) {
    await supabase.from('checkpoint_history').insert([{
      animal_id: data.id, checkpoint: animal.checkpoint, moved_at: animal.date
    }])
  }
  return data
}

export async function updateAnimal(id, updates) {
  const { data, error } = await supabase.from('animals').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function moveCheckpoint(animalId, checkpoint, date, notes = '') {
  await supabase.from('animals').update({ checkpoint }).eq('id', animalId)
  await supabase.from('checkpoint_history').insert([{ animal_id: animalId, checkpoint, moved_at: date, notes }])
}

export async function getCheckpointHistory(animalId) {
  const { data, error } = await supabase
    .from('checkpoint_history').select('*').eq('animal_id', animalId).order('moved_at')
  if (error) throw error
  return data
}

// ── Signs ─────────────────────────────────────────
export async function getSigns() {
  const { data, error } = await supabase.from('signs').select('*').order('name')
  if (error) throw error
  return data
}

export async function addSign(sign) {
  const { data, error } = await supabase.from('signs').insert([sign]).select().single()
  if (error) throw error
  return data
}

export async function getSignPnl() {
  const { data, error } = await supabase.from('sign_pnl').select('*')
  if (error) throw error
  return data
}

// ── Mnada P/L ─────────────────────────────────────
export async function getMnadaPnl() {
  const { data, error } = await supabase.from('mnada_pnl').select('*')
  if (error) throw error
  return data
}

// ── Agents ────────────────────────────────────────
export async function getAgents() {
  const { data, error } = await supabase.from('agents').select('*').order('name')
  if (error) throw error
  return data
}

export async function addAgent(agent) {
  const { data, error } = await supabase.from('agents').insert([agent]).select().single()
  if (error) throw error
  return data
}

// ── Dispatches ────────────────────────────────────
export async function getDispatches() {
  const { data, error } = await supabase.from('dispatches').select('*').order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function addDispatch(dispatch, animalIds) {
  const { data, error } = await supabase.from('dispatches').insert([dispatch]).select().single()
  if (error) throw error
  const links = animalIds.map(id => ({ dispatch_id: data.id, animal_id: id }))
  await supabase.from('dispatch_animals').insert(links)
  await supabase.from('animals').update({ status: 'dispatched' }).in('id', animalIds)
  return data
}

export async function getDispatchAnimals(dispatchId) {
  const { data, error } = await supabase
    .from('dispatch_animals')
    .select('animal_id, sign_id, animals_full(*)')
    .eq('dispatch_id', dispatchId)
  if (error) throw error
  return data
}

// ── Payments ──────────────────────────────────────
export async function addPayment(payment) {
  // 1. Save payment
  const { data, error } = await supabase.from('payments').insert([payment]).select().single()
  if (error) throw error

  // 2. Get all dispatched animals for this sign in this batch
  const { data: daRows } = await supabase
    .from('dispatch_animals')
    .select('animal_id')
    .eq('dispatch_id', payment.dispatch_id)

  const animalIds = (daRows || []).map(r => r.animal_id)

  const { data: signAnimals } = await supabase
    .from('animals_full')
    .select('*')
    .eq('sign_id', payment.sign_id)
    .in('id', animalIds)
    // status filter removed - animals update during same transaction

  const animals = signAnimals || []
  const count = animals.length
  if (count === 0) return data

  // 3. Mark animals as sold
  await supabase.from('animals')
    .update({ status: 'sold' })
    .in('id', animals.map(a => a.id))

  // 4. Get total linked costs for this sign
  const { data: signCosts } = await supabase
    .from('costs')
    .select('amount')
    .eq('sign_id', payment.sign_id)

  const totalLinkedCosts = (signCosts || []).reduce((s, c) => s + Number(c.amount), 0)
  const totalBuyCost = animals.reduce((s, a) => s + Number(a.purchase_price), 0)

  // 5. Calculate profit per animal (revenue - buy cost - linked costs) / count
  const profitPerAnimal = (Number(payment.revenue) - totalBuyCost - totalLinkedCosts) / count

  // 6. Auto-record commission if profit threshold met
  if (profitPerAnimal > COMMISSION_MIN_PROFIT) {
    // Group by agent
    const agentMap = {}
    animals.forEach(a => {
      if (a.agent_id) {
        if (!agentMap[a.agent_id]) agentMap[a.agent_id] = { name: a.agent_name, count: 0 }
        agentMap[a.agent_id].count++
      }
    })

    for (const [, info] of Object.entries(agentMap)) {
      const commissionAmount = info.count * COMMISSION_PER_ANIMAL
      await supabase.from('costs').insert([{
        date: payment.date,
        type: 'agent-commission',
        amount: commissionAmount,
        sign_id: payment.sign_id,
        notes: `Auto-commission: ${info.name} — ${info.count} animal${info.count !== 1 ? 's' : ''} × TSH ${COMMISSION_PER_ANIMAL.toLocaleString()} (Batch #${payment.dispatch_id})`
      }])
    }
  }

  return data
}

export async function getPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select('*, signs(name), dispatches(date, method)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updatePayment(id, updates) {
  const { data, error } = await supabase.from('payments').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function updateDispatch(id, updates) {
  const { data, error } = await supabase.from('dispatches').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ── Costs ─────────────────────────────────────────
export async function getCosts() {
  const { data, error } = await supabase.from('costs').select('*, signs(name)').order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function addCost(cost) {
  const { data, error } = await supabase.from('costs').insert([cost]).select().single()
  if (error) throw error
  return data
}

export async function deleteCost(id) {
  const { error } = await supabase.from('costs').delete().eq('id', id)
  if (error) throw error
}

// ── Dashboard stats ───────────────────────────────
export async function getDashboardStats() {
  const [animals, payments, costs, signs] = await Promise.all([
    supabase.from('animals').select('status, purchase_price, resale_price'),
    supabase.from('payments').select('revenue, kg_assigned'),
    supabase.from('costs').select('amount'),
    supabase.from('sign_pnl').select('*')
  ])
  if (animals.error) throw animals.error

  const all = animals.data || []
  const totalBuy = all.reduce((s, a) => s + Number(a.purchase_price), 0)
  const totalRevenue = (payments.data || []).reduce((s, p) => s + Number(p.revenue), 0)
  const totalCosts = (costs.data || []).reduce((s, c) => s + Number(c.amount), 0)
  const totalKg = (payments.data || []).reduce((s, p) => s + Number(p.kg_assigned), 0)

  return {
    totalAnimals: all.length,
    pending: all.filter(a => a.status === 'pending').length,
    dispatched: all.filter(a => a.status === 'dispatched').length,
    sold: all.filter(a => a.status === 'sold').length,
    dead: all.filter(a => a.status === 'dead').length,
    totalBuy, totalRevenue, totalCosts, totalKg,
    netPL: totalRevenue - totalBuy - totalCosts,
    signPnl: signs.data || []
  }
}

// ── Settings ──────────────────────────────────────
export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*')
  if (error) throw error
  return Object.fromEntries((data || []).map(r => [r.key, r.value]))
}

export async function saveSetting(key, value) {
  await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
}
