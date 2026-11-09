import { createClient } from '@supabase/supabase-js'

// Solo existe en la rama vercel-deploy: la versión publicada guarda los esquemas
// de cada persona en Supabase (autenticación + Postgres con reglas por usuario).
// La integración de Supabase en Vercel crea VITE_PUBLIC_SUPABASE_*; a mano valen
// VITE_SUPABASE_*, y también NEXT_PUBLIC_SUPABASE_* (ver vite.config.ts).
const env = import.meta.env
const primera = (...nombres: string[]): string | undefined => nombres.map((n) => env[n]).find(Boolean)
const url = primera('VITE_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
const clave = primera(
  'VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'VITE_PUBLIC_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
)

export const configurado = Boolean(url && clave)

export const supabase = createClient(url ?? 'http://sin-configurar.invalid', clave ?? 'sin-clave', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
