-- ============================================================================
-- Baratinhos da Internet - Achadinhos do Mercado Livre
-- Script SQL para configuração inicial no Supabase (SQL Editor)
-- ============================================================================

-- 1. Tabela de Produtos da Vitrine
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  category text not null,
  price text not null,
  old_price text,
  badge text,
  image_url text not null,
  affiliate_url text not null,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para listagem rápida na vitrine pública
create index if not exists idx_products_active_featured_created
  on public.products (is_active, is_featured desc, created_at desc);

create index if not exists idx_products_category
  on public.products (category);

-- Trigger para atualizar updated_at automaticamente
create or replace function public.handle_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row
  execute function public.handle_products_updated_at();

-- 2. Segurança em Nível de Linha (RLS) para a tabela products
alter table public.products enable row level security;

-- Vitrine pública: qualquer visitante pode visualizar produtos ativos
drop policy if exists "Vitrine publica visualiza produtos ativos" on public.products;
create policy "Vitrine publica visualiza produtos ativos"
  on public.products
  for select
  to anon
  using (is_active = true);

-- Painel administrativo: usuário autenticado visualiza todos os produtos (ativos e pausados)
drop policy if exists "Admin visualiza todos os produtos" on public.products;
create policy "Admin visualiza todos os produtos"
  on public.products
  for select
  to authenticated
  using (true);

-- Apenas administrador autenticado pode cadastrar, editar e excluir produtos
drop policy if exists "Admin cria produtos" on public.products;
create policy "Admin cria produtos"
  on public.products
  for insert
  to authenticated
  with check (true);

drop policy if exists "Admin atualiza produtos" on public.products;
create policy "Admin atualiza produtos"
  on public.products
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admin exclui produtos" on public.products;
create policy "Admin exclui produtos"
  on public.products
  for delete
  to authenticated
  using (true);

-- 3. Bucket público do Supabase Storage para fotos dos produtos
insert into storage.buckets (id, name, public)
values ('vitrine-images', 'vitrine-images', true)
on conflict (id) do update set public = true;

-- Políticas de acesso ao bucket vitrine-images
drop policy if exists "Leitura publica de imagens da vitrine" on storage.objects;
create policy "Leitura publica de imagens da vitrine"
  on storage.objects
  for select
  to public
  using (bucket_id = 'vitrine-images');

drop policy if exists "Admin envia imagens da vitrine" on storage.objects;
create policy "Admin envia imagens da vitrine"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'vitrine-images');

drop policy if exists "Admin atualiza imagens da vitrine" on storage.objects;
create policy "Admin atualiza imagens da vitrine"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'vitrine-images');

drop policy if exists "Admin remove imagens da vitrine" on storage.objects;
create policy "Admin remove imagens da vitrine"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'vitrine-images');
