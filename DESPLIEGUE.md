# Despliegue en Vercel (rama `vercel-deploy`)

Esta rama añade cuentas de usuario: cada persona entra con un enlace por correo, con Google o
con GitHub, y sus esquemas se guardan en Supabase (Postgres con reglas por usuario). `main`
sigue sin autenticación y con localStorage.

Qué cambia respecto a `main`:

- `src/nube/`: cliente de Supabase, pantalla de acceso, sesión y `useEsquemasNube` (carga los
  esquemas y sube solo los que cambian, agrupando 800 ms; borra los que desaparecen).
- `App.tsx` recibe la sesión y usa ese hook en lugar de localStorage; en el lateral sale la
  cuenta, el estado de guardado y el botón de salir.
- `supabase/migrations/`: tabla `esquemas` con RLS (cada persona solo ve, cambia y borra lo suyo).
- Una persona nueva empieza con el ejemplo de teletrabajo. Lo hecho en la versión local se trae
  con Exportar (en local) e Importar (aquí).

## 1. Supabase

1. Crear un proyecto en supabase.com, en una región de la UE (los correos son datos personales).
2. Crear la tabla: pegar `supabase/migrations/20261109000000_esquemas.sql` en el editor SQL, o
   `npx supabase link --project-ref <ref>` y `npx supabase db push`.
3. **Authentication → URL Configuration**
   - Site URL: la dirección de producción en Vercel (`https://fluxus-….vercel.app`).
   - Redirect URLs: esa misma con `/**`, `https://*-<tu-equipo>.vercel.app/**` para las
     vistas previas y `http://localhost:5199/**`.
4. **Plantillas de correo** (Authentication → Emails → Templates): pegar
   `supabase/plantillas/entrar.html` en «Magic Link» y `supabase/plantillas/confirmar.html` en
   «Confirm signup», con el asunto «Tu código para entrar en Fluxus». El correo trae un código de
   6 cifras y un enlace que lleva a la propia app (`?token_hash=…`), que lo canjea con JavaScript.
   Así los filtros que abren los enlaces para revisarlos (Microsoft 365 en la US) no lo gastan,
   cosa que sí pasaba con el enlace de Supabase por defecto (`{{ .ConfirmationURL }}`).
5. **Correo**: el envío que trae Supabase solo deja unos pocos correos por hora. Para usarlo de
   verdad, configurar un SMTP propio en Authentication → Emails (Resend, o el de la US).

## 2. Google y GitHub

La URL de vuelta en los dos es `https://<ref>.supabase.co/auth/v1/callback`.

- **Google**: Google Cloud Console → APIs y servicios → Credenciales → ID de cliente OAuth
  (aplicación web) con esa URL de vuelta. Copiar ID y secreto en Supabase → Authentication →
  Providers → Google.
- **GitHub**: GitHub → Settings → Developer settings → OAuth Apps → New OAuth App con esa URL
  de vuelta. Copiar Client ID y un Client secret en Supabase → Providers → GitHub.

## 3. Vercel

1. Importar el repositorio (Vite se detecta solo: `npm run build`, salida `dist`).
2. **Settings → Git → Production Branch: `vercel-deploy`**. Si no, producción saldría de `main`,
   que no tiene acceso con cuenta.
3. Variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (la clave pública o
   «publishable» de Supabase). Si se conecta Supabase desde el Marketplace de Vercel, no hace
   falta: valen las `VITE_PUBLIC_SUPABASE_URL` y `VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY` que crea.
   Como Vite las mete en el código al compilar, tras cambiarlas hay que volver a desplegar.

## Probar en local

Con Docker en marcha:

```bash
npx supabase start          # aplica la migración; correo de prueba en http://127.0.0.1:54324
cp .env.example .env.local  # URL http://127.0.0.1:54321 y la PUBLISHABLE_KEY que imprime
npx vite --port 5199
```

El enlace de entrada llega al buzón de prueba (Mailpit). Google y GitHub no funcionan en local
sin sus credenciales. `npx supabase stop` para pararlo.

## Traer cambios de `main`

`git switch vercel-deploy && git merge main`. Los conflictos, si los hay, salen casi siempre en
`App.tsx` (lista de esquemas y lateral).
