import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type ViewerConnectionState = 'disconnected' | 'connecting' | 'connected' | 'mock' | 'error'

interface ViewerState {
  programStream: MediaStream | null
  connectionState: ViewerConnectionState
  isMockStream: boolean
  isMuted: boolean
}

interface ViewerActions {
  setProgramStream: (stream: MediaStream | null, isMock: boolean) => void
  setConnectionState: (state: ViewerConnectionState) => void
  setMuted: (muted: boolean) => void
  disconnect: () => void
}

export const useViewerStore = create<ViewerState & ViewerActions>()(
  devtools(
    (set, get) => ({
      programStream: null,
      connectionState: 'disconnected',
      isMockStream: false,
      isMuted: true,

      setProgramStream: (stream, isMock) =>
        set({
          programStream: stream,
          isMockStream: isMock,
          connectionState: stream ? (isMock ? 'mock' : 'connected') : 'disconnected',
        }),

      setConnectionState: (connectionState) => set({ connectionState }),

      setMuted: (muted) => set({ isMuted: muted }),

      disconnect: () => {
        const { programStream } = get()
        if (programStream) programStream.getTracks().forEach((t) => t.stop())
        set({ programStream: null, connectionState: 'disconnected', isMockStream: false })
      },
    }),
    { name: 'viewer' },
  ),
)
