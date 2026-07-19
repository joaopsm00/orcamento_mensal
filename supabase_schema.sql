-- ========================================================
-- Schema do Orçamento — rode isso no SQL Editor do Supabase
-- (Painel do projeto > SQL Editor > New query > colar > Run)
-- ========================================================

-- Lançamentos: receita, despesa fixa, despesa variável e aportes da reserva
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('receita', 'fixa', 'variavel', 'reserva')),
  month_key text, -- formato 'YYYY-MM', nulo para reserva (é acumulada, não mensal)
  data text not null, -- formato 'DD/MM'
  nome text not null,
  valor numeric not null,
  created_at timestamptz default now()
);

-- Investimentos (globais, não resetam por mês)
create table if not exists investimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null,
  valor_investido numeric not null,
  rentabilidade numeric not null default 0,
  periodo text not null default 'mes' check (periodo in ('mes', 'ano')),
  data_aporte text, -- formato 'DD/MM', data em que o aporte foi feito
  created_at timestamptz default now()
);

-- Configurações do usuário (meta da reserva de emergência)
create table if not exists settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  meta_reserva numeric not null default 15000
);

-- Ativa segurança por linha: cada pessoa só vê/edita os próprios dados
alter table entries enable row level security;
alter table investimentos enable row level security;
alter table settings enable row level security;

create policy "usuário vê seus próprios lançamentos" on entries
  for select using (auth.uid() = user_id);
create policy "usuário insere seus próprios lançamentos" on entries
  for insert with check (auth.uid() = user_id);
create policy "usuário atualiza seus próprios lançamentos" on entries
  for update using (auth.uid() = user_id);
create policy "usuário remove seus próprios lançamentos" on entries
  for delete using (auth.uid() = user_id);

create policy "usuário vê seus próprios investimentos" on investimentos
  for select using (auth.uid() = user_id);
create policy "usuário insere seus próprios investimentos" on investimentos
  for insert with check (auth.uid() = user_id);
create policy "usuário atualiza seus próprios investimentos" on investimentos
  for update using (auth.uid() = user_id);
create policy "usuário remove seus próprios investimentos" on investimentos
  for delete using (auth.uid() = user_id);

create policy "usuário vê suas próprias configurações" on settings
  for select using (auth.uid() = user_id);
create policy "usuário insere suas próprias configurações" on settings
  for insert with check (auth.uid() = user_id);
create policy "usuário atualiza suas próprias configurações" on settings
  for update using (auth.uid() = user_id);

-- ========================================================
-- MIGRAÇÃO — se sua tabela "investimentos" já existia antes
-- (rode só esse bloco no SQL Editor, o resto acima já está criado)
-- ========================================================
alter table investimentos add column if not exists data_aporte text;
