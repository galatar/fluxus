import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // NEXT_PUBLIC_ por las variables que crea la integración de Supabase en Vercel.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
