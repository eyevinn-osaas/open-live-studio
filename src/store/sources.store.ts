import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'

export type SourceType = 'Camera' | 'SRT' | 'NDI' | 'Test'
export type SourceStatus = 'connected' | 'connecting' | 'disconnected'
export type Resolution = '3840x2160' | '1920x1080' | '1280x720'

export interface Source {
  id: string
  name: string
  type: SourceType
  status: SourceStatus
  resolution: Resolution
  lastSeenAt: number
  color: string
  liveCamera?: boolean
}

interface SourcesState {
  sources: Source[]
  lastFetchedAt: number
  isLoading: boolean
}

interface SourcesActions {
  refresh: () => void
  addSource: (source: Omit<Source, 'id' | 'lastSeenAt'>) => void
  removeSource: (id: string) => void
  updateStatus: (id: string, status: SourceStatus) => void
  tickLastSeen: () => void
}

export const useSourcesStore = create<SourcesState & SourcesActions>()(
  devtools(
    immer((set) => ({
      sources: [],
      lastFetchedAt: Date.now(),
      isLoading: false,

      refresh: () =>
        set((state) => {
          state.isLoading = true
        }),

      addSource: (source) =>
        set((state) => {
          const id = `src-${Date.now()}`
          state.sources.push({ ...source, id, lastSeenAt: Date.now() })
        }),

      removeSource: (id) =>
        set((state) => {
          state.sources = state.sources.filter((s) => s.id !== id)
        }),

      updateStatus: (id, status) =>
        set((state) => {
          const source = state.sources.find((s) => s.id === id)
          if (source) {
            source.status = status
            if (status === 'connected') source.lastSeenAt = Date.now()
          }
        }),

      tickLastSeen: () =>
        set((state) => {
          const now = Date.now()
          state.sources.forEach((s) => {
            if (s.status === 'connected') s.lastSeenAt = now
          })
          state.lastFetchedAt = now
        }),
    })),
    { name: 'sources' },
  ),
)
