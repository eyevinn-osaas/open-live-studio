import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { MOCK_GRAPHIC_OVERLAYS, type GraphicOverlay } from '@/mock/graphics'

interface GraphicsState {
  overlays: GraphicOverlay[]
  activeOverlayIds: string[]
}

interface GraphicsActions {
  toggleOverlay: (id: string) => void
  updateField: (id: string, field: string, value: string) => void
  isActive: (id: string) => boolean
}

export const useGraphicsStore = create<GraphicsState & GraphicsActions>()(
  devtools(
    immer((set, get) => ({
      overlays: MOCK_GRAPHIC_OVERLAYS.map((o) => ({ ...o, fields: { ...o.fields } })),
      activeOverlayIds: [],

      toggleOverlay: (id) =>
        set((state) => {
          const idx = state.activeOverlayIds.indexOf(id)
          if (idx >= 0) {
            state.activeOverlayIds.splice(idx, 1)
          } else {
            state.activeOverlayIds.push(id)
          }
        }),

      updateField: (id, field, value) =>
        set((state) => {
          const overlay = state.overlays.find((o) => o.id === id)
          if (overlay) overlay.fields[field] = value
        }),

      isActive: (id) => get().activeOverlayIds.includes(id),
    })),
    { name: 'graphics' },
  ),
)
