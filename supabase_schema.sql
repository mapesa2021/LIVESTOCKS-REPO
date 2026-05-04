-- ============================================
-- LIVESTOCK LEDGER — SUPABASE DATABASE SCHEMA
-- Run this entire file in your Supabase SQL Editor
-- ============================================

-- Enable Row Level Security
-- (We use a simple password approach for solo use)

-- SIGNS (animal group identifiers)
create table if not exists signs (
  id bigint primary key generated always as identity,
  name text not null,
  mnada text not null,
  description text,
  created_at timestamptz default now()
);

-- AGENTS (buying agents / wageuzaji)
create table if not exists agents (
  id bigint primary key generated always as identity,
  name text not null,
  phone text,
  created_at timestamptz default now()
);

-- ANIMALS (one row per animal purchased)
create table if not exists animals (
  id bigint primary key generated always as identity,
  date date not null,
  type text not null check (type in ('goat', 'sheep')),
  sign_id bigint references signs(id),
  mnada text not null,
  mnada_date date,
  purchase_price numeric not null default 0,
  live_weight_est numeric,
  checkpoint text,
  agent_id bigint references agents(id),
  notes text,
  status text not null default 'pending'
    check (status in ('pending','dispatched','sold','dead','rejected','resold')),
  rejection_reason text,
  resale_price numeric default 0,
  rejection_notes text,
  created_at timestamptz default now()
);

-- CHECKPOINT HISTORY (track every movement)
create table if not exists checkpoint_history (
  id bigint primary key generated always as identity,
  animal_id bigint references animals(id) on delete cascade,
  checkpoint text not null,
  moved_at date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- DISPATCHES (batch shipments to Tanchoice)
create table if not exists dispatches (
  id bigint primary key generated always as identity,
  date date not null,
  method text not null check (method in ('slaughter', 'ranch')),
  rate_per_kg numeric not null default 11000,
  destination text,
  notes text,
  created_at timestamptz default now()
);

-- DISPATCH ANIMALS (which animals are in which dispatch)
create table if not exists dispatch_animals (
  id bigint primary key generated always as identity,
  dispatch_id bigint references dispatches(id) on delete cascade,
  animal_id bigint references animals(id),
  sign_id bigint references signs(id)
);

-- PAYMENTS (Tanchoice payment per sign per dispatch)
create table if not exists payments (
  id bigint primary key generated always as identity,
  dispatch_id bigint references dispatches(id),
  sign_id bigint references signs(id),
  kg_assigned numeric not null default 0,
  revenue numeric not null default 0,
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- COSTS (all operational expenses)
create table if not exists costs (
  id bigint primary key generated always as identity,
  date date not null,
  type text not null,
  amount numeric not null default 0,
  sign_id bigint references signs(id),
  notes text,
  created_at timestamptz default now()
);

-- SETTINGS (app config, e.g. rate per kg)
create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Insert default settings
insert into settings (key, value) values
  ('rate_per_kg', '11000'),
  ('commission_per_animal', '1000'),
  ('commission_min_profit', '3000'),
  ('meat_ratio', '0.43'),
  ('business_name', 'Livestock Ledger'),
  ('owner_name', 'Marley')
on conflict (key) do nothing;

-- ============================================
-- ROW LEVEL SECURITY (optional but recommended)
-- Disable for simple solo use, enable later
-- ============================================
-- alter table animals enable row level security;
-- (leave disabled for now — you control access via env vars)

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- Animal summary with sign and agent names
create or replace view animals_full as
select
  a.*,
  s.name as sign_name,
  s.mnada as sign_mnada,
  ag.name as agent_name,
  ag.phone as agent_phone
from animals a
left join signs s on s.id = a.sign_id
left join agents ag on ag.id = a.agent_id;

-- Sign P&L summary
create or replace view sign_pnl as
select
  s.id,
  s.name,
  s.mnada,
  count(a.id) as total_animals,
  count(a.id) filter (where a.status = 'pending') as pending,
  count(a.id) filter (where a.status = 'dispatched') as dispatched,
  count(a.id) filter (where a.status = 'sold') as sold,
  count(a.id) filter (where a.status = 'dead') as dead,
  coalesce(sum(a.purchase_price), 0) as total_buy_cost,
  coalesce(sum(a.resale_price), 0) as total_resale,
  coalesce((select sum(p.revenue) from payments p where p.sign_id = s.id), 0) as total_revenue,
  coalesce((select sum(c.amount) from costs c where c.sign_id = s.id), 0) as total_costs
from signs s
left join animals a on a.sign_id = s.id
group by s.id, s.name, s.mnada;

-- ============================================
-- DONE. Your database is ready.
-- ============================================
