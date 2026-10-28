/** Logotipo de Fluxus: caja → decisión → caja unidas por un camino en zigzag, con el degradado cian a violeta. */
export function Logo() {
  return (
    <span className="logo">
      <svg className="logo-icono" width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="fluxus-degradado" x1="2" y1="3" x2="30" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0" style={{ stopColor: 'var(--logo-a)' }} />
            <stop offset="1" style={{ stopColor: 'var(--logo-b)' }} />
          </linearGradient>
        </defs>
        <g stroke="url(#fluxus-degradado)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="12" height="8" rx="2.6" fill="url(#fluxus-degradado)" fillOpacity=".2" />
          <path d="M23 11 L28.5 16 L23 21 L17.5 16 Z" fill="url(#fluxus-degradado)" fillOpacity=".2" />
          <rect x="2" y="21" width="12" height="8" rx="2.6" fill="url(#fluxus-degradado)" fillOpacity=".2" />
          <path d="M14 7 H23 V11" />
          <path d="M23 21 V25 H16.5" />
          <path d="M18.5 22.8 L16 25 L18.5 27.2" />
        </g>
      </svg>
      <span className="logo-nombre">fluxus</span>
    </span>
  )
}
