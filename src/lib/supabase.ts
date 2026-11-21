import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const rawSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

function isValidSupabaseUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured =
  isValidSupabaseUrl(rawSupabaseUrl) && rawSupabaseAnonKey.length > 0;

/**
 * Strict in-memory auth storage adapter so @supabase/supabase-js never writes
 * to localStorage, sessionStorage, or indexedDB.
 */
class InMemoryAuthStorage {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const memoryStorage = new InMemoryAuthStorage();

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawSupabaseUrl, rawSupabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: memoryStorage,
      },
    })
  : null;

export const SUPABASE_SETUP_SQL = `-- 1. Criar tabela de produtos
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

alter table public.products enable row level security;

create policy "Vitrine publica visualiza produtos ativos"
  on public.products for select to anon using (is_active = true);

create policy "Admin visualiza todos os produtos"
  on public.products for select to authenticated using (true);

create policy "Admin cria produtos"
  on public.products for insert to authenticated with check (true);

create policy "Admin atualiza produtos"
  on public.products for update to authenticated using (true) with check (true);

create policy "Admin exclui produtos"
  on public.products for delete to authenticated using (true);

-- 2. Criar bucket público de imagens
insert into storage.buckets (id, name, public)
values ('vitrine-images', 'vitrine-images', true)
on conflict (id) do update set public = true;

create policy "Leitura publica de imagens da vitrine"
  on storage.objects for select to public
  using (bucket_id = 'vitrine-images');

create policy "Admin envia imagens da vitrine"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'vitrine-images');

create policy "Admin atualiza imagens da vitrine"
  on storage.objects for update to authenticated
  using (bucket_id = 'vitrine-images');

create policy "Admin remove imagens da vitrine"
  on storage.objects for delete to authenticated
  using (bucket_id = 'vitrine-images');`;
