import { createContext } from 'react'

/** Problemas por caja; solo se rellena mientras está abierta la revisión. */
export const ProblemasContexto = createContext<Map<string, { nivel: 'error' | 'aviso'; textos: string[] }>>(new Map())
