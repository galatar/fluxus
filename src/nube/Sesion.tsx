import { useEffect, useState, type ReactNode } from 'react'
import type { EmailOtpType, Session } from '@supabase/supabase-js'
import { configurado, supabase } from './cliente'
import { Acceso } from './Acceso'

/**
 * El enlace del correo trae ?token_hash=…&type=email y se canjea aquí, con
 * JavaScript. Así, los filtros de correo que abren los enlaces para revisarlos
 * (Microsoft Safe Links y similares) no lo gastan: solo leen la página.
 * Devuelve el mensaje de error, o '' si no había enlace o ha ido bien.
 */
let canje: Promise<string> | null = null // una sola vez, aunque StrictMode repita el efecto
function canjearEnlace(): Promise<string> {
  const datos = new URLSearchParams(location.search)
  const token_hash = datos.get('token_hash')
  if (!token_hash) return Promise.resolve('')
  canje ??= supabase.auth
    .verifyOtp({ token_hash, type: (datos.get('type') ?? 'email') as EmailOtpType })
    .then(({ error }) => {
      history.replaceState(null, '', location.pathname)
      return error ? error.message : ''
    })
  return canje
}

/** Muestra la pantalla de acceso hasta que hay sesión; luego pinta la app con ella. */
export function Sesion({ children }: { children: (sesion: Session) => ReactNode }) {
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined)
  const [errorEnlace, setErrorEnlace] = useState('')

  useEffect(() => {
    if (!configurado) return
    let vivo = true
    let baja = () => {}
    canjearEnlace().then(async (error) => {
      if (!vivo) return
      setErrorEnlace(error)
      const { data } = await supabase.auth.getSession()
      if (!vivo) return
      setSesion(data.session)
      const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, s) => setSesion(s))
      baja = () => suscripcion.subscription.unsubscribe()
    })
    return () => {
      vivo = false
      baja()
    }
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
  if (!sesion) return <Acceso errorEnlace={errorEnlace} />
  return <>{children(sesion)}</>
}
