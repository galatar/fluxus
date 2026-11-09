import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/jetbrains-mono'
import '@xyflow/react/dist/style.css'
import './index.css'
import App from './App.tsx'
import { Sesion } from './nube/Sesion'

// La pantalla de acceso sale antes que App: se aplica ya el tema guardado.
try {
  const tema = localStorage.getItem('fluxus:tema') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  document.documentElement.dataset.theme = tema
} catch {
  // Sin almacenamiento: tema claro.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sesion>{(sesion) => <App sesion={sesion} />}</Sesion>
  </StrictMode>,
)
