import { createClient } from '@supabase/supabase-js'

// Solo existe en la rama vercel-deploy: la versión publicada guarda los esquemas
// de cada persona en Supabase (autenticación + Postgres con reglas por usuario).
// Las variables pueden venir con prefijo VITE_ (puestas a mano) o NEXT_PUBLIC_
// (las que crea la integración de Supabase en Vercel); ver vite.config.ts.
const env = import.meta.env
const url: string | undefined = env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
const clave: string | undefined =
  env.VITE_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const configurado = Boolean(url && clave)

export const supabase = createClient(url ?? 'http://sin-configurar.invalid', clave ?? 'sin-clave', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
