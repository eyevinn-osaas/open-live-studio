import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { audioApi, type ApiAudioElement } from '@/lib/api'

// Throttle: max one PATCH per elementId per 100ms
const pendingThrottle = new Map<string, ReturnType<typeof setTimeout>>()

function throttledUpdate(productionId: string, elementId: string, property: string, value: unknown) {
  if (pendingThrottle.has(elementId)) return
  const timer = setTimeout(() => {
    pendingThrottle.delete(elementId)
    void audioApi.updateElement(productionId, elementId, { property, value })
  }, 100)
  pendingThrottle.set(elementId, timer)
}

interface AudioState {
  elements: ApiAudioElement[]
  levels: Record<string, number>      // elementId → 0.0–1.0
  muted: Record<string, boolean>      // elementId → boolean
  productionId: string | null
}

interface AudioActions {
  setElements: (elements: ApiAudioElement[], productionId: string) => void
  setLevel: (elementId: string, value: number) => void
  toggleMute: (elementId: string) => void
}

export const useAudioStore = create<AudioState & AudioActions>()(
  devtools(
    immer((set, get) => ({
      elements: [],
      levels: {},
      muted: {},
      productionId: null,

      setElements: (elements, productionId) =>
        set((s) => {
          s.elements = elements
          s.productionId = productionId
          // Initialise levels to 1.0 and muted to false for new elements
          elements.forEach((el) => {
            if (s.levels[el.elementId] === undefined) s.levels[el.elementId] = 1.0
            if (s.muted[el.elementId] === undefined) s.muted[el.elementId] = false
          })
        }),

      setLevel: (elementId, value) => {
        const clamped = Math.max(0, Math.min(1, value))
        set((s) => { s.levels[elementId] = clamped })
        const { productionId } = get()
        if (productionId) throttledUpdate(productionId, elementId, 'volume', clamped)
      },

      toggleMute: (elementId) => {
        set((s) => { s.muted[elementId] = !s.muted[elementId] })
        const { muted, productionId } = get()
        if (productionId) {
          void audioApi.updateElement(productionId, elementId, {
            property: 'mute',
            value: muted[elementId],
          })
        }
      },
    })),
    { name: 'audio' },
  ),
)
