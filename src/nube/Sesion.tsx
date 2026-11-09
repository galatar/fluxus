import { useEffect, useState, type ReactNode } from 'react'
import type { EmailOtpType, Session } from '@supabase/supabase-js'
import { LogIn } from 'lucide-react'
import { configurado, supabase } from './cliente'
import { Acceso } from './Acceso'
import { Logo } from '../Logo'

/**
 * El enlace del correo trae ?token_hash=…&type=email y solo se canjea cuando la
 * persona pulsa «Entrar». Los filtros de correo (Gmail, Microsoft Safe Links…)
 * abren los enlaces para revisarlos, algunos incluso ejecutan JavaScript, pero
 * no pulsan botones: así no gastan el enlace antes que ella.
 * Devuelve el mensaje de error, o '' si ha ido bien.
 */
async function canjearEnlace(): Promise<string> {
  const datos = new URLSearchParams(location.search)
  const token_hash = datos.get('token_hash') ?? ''
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: (datos.get('type') ?? 'email') as EmailOtpType,
  })
  limpiarUrl()
  return error ? error.message : ''
}

const limpiarUrl = () => history.replaceState(null, '', location.pathname)
const hayEnlace = () => new URLSearchParams(location.search).has('token_hash')

/** Muestra la pantalla de acceso hasta que hay sesión; luego pinta la app con ella. */
export function Sesion({ children }: { children: (sesion: Session) => ReactNode }) {
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined)
  const [enlace, setEnlace] = useState(hayEnlace)
  const [canjeando, setCanjeando] = useState(false)
  const [errorEnlace, setErrorEnlace] = useState('')

  useEffect(() => {
    if (!configurado) return
    supabase.auth.getSession().then(({ data }) => {
      // Ya dentro: el enlace sobra.
      if (data.session && hayEnlace()) limpiarUrl()
      setSesion(data.session)
    })
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSesion(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const entrar = async () => {
    setCanjeando(true)
    const error = await canjearEnlace()
    setErrorEnlace(error)
    setEnlace(false)
    setCanjeando(false)
  }

  if (!configurado)
    return (
      <div className="acceso">
        <div className="acceso-caja">
          <p>
            Falta configurar Supabase: define <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> (ver{' '}
            <code>.env.example</code>).
          </p>
        </div>
      </div>
    )
  if (sesion === undefined) return <div className="acceso" />
  if (sesion) return <>{children(sesion)}</>
  if (enlace)
    return (
      <div className="acceso">
        <div className="acceso-caja">
          <Logo />
          <p className="acceso-lema">Ya casi está. Pulsa el botón para entrar con el enlace de tu correo.</p>
          <button className="boton primario" onClick={entrar} disabled={canjeando}>
            <LogIn size={14} /> {canjeando ? 'Entrando…' : 'Entrar en Fluxus'}
          </button>
        </div>
      </div>
    )
  return <Acceso errorEnlace={errorEnlace} />
}
