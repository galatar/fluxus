import { useEffect, useState } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { Logo } from '../Logo'
import { supabase } from './cliente'

type Proveedor = 'google' | 'github'

// Lucide ya no trae marcas; estos dos iconos van dibujados aquí.
const IconoGoogle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.9l4-3.1z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
  </svg>
)
const IconoGithub = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
  </svg>
)

/** Pantalla de entrada: enlace por correo, Google o GitHub. */
export function Acceso({ errorEnlace = '' }: { errorEnlace?: string }) {
  const [correo, setCorreo] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(() => (errorEnlace ? traducir(errorEnlace) : errorDeLaUrl()))
  const [ocupado, setOcupado] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [verCodigo, setVerCodigo] = useState(false)
  const vuelta = location.origin + location.pathname

  // Quita el #error=… de la barra de direcciones una vez leído.
  useEffect(() => {
    if (location.hash.includes('error')) history.replaceState(null, '', location.pathname + location.search)
  }, [])

  const conCorreo = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setError('')
    setOcupado(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: correo.trim(),
      options: { emailRedirectTo: vuelta },
    })
    setOcupado(false)
    if (error) setError(traducir(error.message))
    else setEnviado(true)
  }

  // El código del correo sirve aunque el enlace ya se haya gastado: los filtros
  // de correo (Microsoft Safe Links y similares) abren los enlaces antes que la persona.
  const conCodigo = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setError('')
    setOcupado(true)
    const { error } = await supabase.auth.verifyOtp({
      email: correo.trim(),
      token: codigo.replace(/\s/g, ''),
      type: 'email',
    })
    setOcupado(false)
    if (error)
      setError(
        /expired|invalid/i.test(error.message)
          ? 'Ese código no es correcto o ya no vale (sirve una vez y caduca en una hora). Revísalo o pide otro correo.'
          : traducir(error.message),
      )
  }

  const conProveedor = async (proveedor: Proveedor) => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: proveedor,
      options: { redirectTo: vuelta },
    })
    if (error) setError(traducir(error.message))
  }

  return (
    <div className="acceso">
      <div className="acceso-caja">
        <Logo />
        <p className="acceso-lema">Diagramas de flujo para procedimientos de gestión. Entra para ver y guardar los tuyos.</p>

        {enviado ? (
          <>
            <div className="acceso-aviso">
              <Mail size={16} />
              <div>
                Te hemos enviado un correo a <strong>{correo}</strong>. Pulsa el enlace que trae y entrarás directamente.
                <button
                  className="enlace"
                  onClick={() => {
                    setEnviado(false)
                    setVerCodigo(false)
                    setCodigo('')
                  }}
                >
                  Usar otro correo
                </button>
              </div>
            </div>
            {!verCodigo ? (
              <button className="enlace" onClick={() => setVerCodigo(true)}>
                ¿El correo trae un código de 6 cifras? Escríbelo aquí
              </button>
            ) : (
              <form onSubmit={conCodigo} className="acceso-form">
                <label htmlFor="codigo">Código del correo</label>
                <input
                  id="codigo"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  placeholder="123456"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
                <button className="boton primario" disabled={ocupado}>
                  <KeyRound size={14} /> {ocupado ? 'Comprobando…' : 'Entrar con el código'}
                </button>
              </form>
            )}
          </>
        ) : (
          <form onSubmit={conCorreo} className="acceso-form">
            <label htmlFor="correo">Tu correo</label>
            <input
              id="correo"
              type="email"
              required
              autoComplete="email"
              placeholder="nombre@us.es"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
            <button className="boton primario" disabled={ocupado}>
              <Mail size={14} /> {ocupado ? 'Enviando…' : 'Enviarme un enlace para entrar'}
            </button>
          </form>
        )}

        {error && <p className="acceso-error">{error}</p>}

        <div className="acceso-separador">o</div>

        <button className="boton" onClick={() => conProveedor('google')}>
          <IconoGoogle /> Entrar con Google
        </button>
        <button className="boton" onClick={() => conProveedor('github')}>
          <IconoGithub /> Entrar con GitHub
        </button>
      </div>
    </div>
  )
}

/** Si el enlace del correo falla, Supabase vuelve con el error en la URL (#error=…). */
function errorDeLaUrl() {
  const datos = new URLSearchParams(location.hash.slice(1))
  const codigo = datos.get('error_code') ?? datos.get('error')
  return codigo ? traducir(`${codigo} ${datos.get('error_description') ?? ''}`) : ''
}

function traducir(mensaje: string) {
  if (/otp_expired|expired|invalid.*(token|otp)/i.test(mensaje))
    return 'Ese enlace ya no vale: sirve una sola vez, caduca en una hora y, si pediste varios correos, solo vale el último. Pide otro y usa ese.'
  if (/rate limit/i.test(mensaje)) return 'Se han enviado demasiados correos seguidos. Espera unos minutos y vuelve a probar.'
  if (/invalid.*email/i.test(mensaje)) return 'Ese correo no parece válido.'
  if (/provider is not enabled/i.test(mensaje)) return 'Esa forma de entrar todavía no está activada.'
  return `No se ha podido entrar: ${mensaje}`
}
