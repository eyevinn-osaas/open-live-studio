import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { macrosApi, type ApiMacro } from '@/lib/api'

interface MacrosState {
  macros: ApiMacro[]
  loading: boolean
  productionId: string | null
}

interface MacrosActions {
  fetchMacros: (productionId: string) => Promise<void>
  createMacro: (productionId: string, body: Omit<ApiMacro, 'id'>) => Promise<ApiMacro>
  updateMacro: (productionId: string, macroId: string, body: Partial<Omit<ApiMacro, 'id'>>) => Promise<void>
  deleteMacro: (productionId: string, macroId: string) => Promise<void>
  applyWsUpdate: (macro: ApiMacro) => void
}

export const useMacrosStore = create<MacrosState & MacrosActions>()(
  devtools(
    immer((set) => ({
      macros: [],
      loading: false,
      productionId: null,

      fetchMacros: async (productionId) => {
        set((s) => { s.loading = true; s.productionId = productionId })
        try {
          const macros = await macrosApi.list(productionId)
          set((s) => { s.macros = macros; s.loading = false })
        } catch {
          set((s) => { s.loading = false })
        }
      },

      createMacro: async (productionId, body) => {
        const macro = await macrosApi.create(productionId, body)
        set((s) => { s.macros.push(macro) })
        return macro
      },

      updateMacro: async (productionId, macroId, body) => {
        const updated = await macrosApi.update(productionId, macroId, body)
        set((s) => {
          const idx = s.macros.findIndex((m) => m.id === macroId)
          if (idx !== -1) s.macros[idx] = updated
        })
      },

      deleteMacro: async (productionId, macroId) => {
        await macrosApi.remove(productionId, macroId)
        set((s) => { s.macros = s.macros.filter((m) => m.id !== macroId) })
      },

      applyWsUpdate: (macro) => {
        set((s) => {
          const idx = s.macros.findIndex((m) => m.id === macro.id)
          if (idx !== -1) s.macros[idx] = macro
        })
      },
    })),
    { name: 'macros' },
  ),
)
