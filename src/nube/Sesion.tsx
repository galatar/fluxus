import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { configurado, supabase } from './cliente'
import { Acceso } from './Acceso'

/** Muestra la pantalla de acceso hasta que hay sesión; luego pinta la app con ella. */
export function Sesion({ children }: { children: (sesion: Session) => ReactNode }) {
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    if (!configurado) return
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSesion(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!configurado)
    return (
      <div className="acceso">
        <div className="acceso-caja">
          <p>
            Falta configurar Supabase: define <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> (ver <code>.env.example</code>).
          </p>
        </div>
      </div>
    )
  if (sesion === undefined) return <div className="acceso" />
  if (!sesion) return <Acceso />
  return <>{children(sesion)}</>
}
