import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type ButtonAction =
  | { type: 'pvw'; sourceId: string }
  | { type: 'cut' }
  | { type: 'take' }
  | { type: 'go-live' }
  | { type: 'graphic-toggle'; graphicId: string }
  | { type: 'transition'; mode: 'cut' | 'mix' | 'wipe' }
  | { type: 'dsk-toggle'; layer: number }
  | { type: 'macro-exec'; macroId: string }
  | { type: 'none' }

export interface StreamDeckButton {
  index: number
  label: string
  sublabel?: string
  action: ButtonAction
  color: string
}

interface StreamDeckState {
  device: HIDDevice | null
  isConnected: boolean
  isSupported: boolean
  buttonMap: StreamDeckButton[]
  lastPressedIndex: number | null
}

interface StreamDeckActions {
  setDevice: (device: HIDDevice | null) => void
  setConnected: (connected: boolean) => void
  setSupported: (supported: boolean) => void
  setLastPressed: (index: number | null) => void
  disconnect: () => void
}

export const useStreamDeckStore = create<StreamDeckState & StreamDeckActions>()(
  devtools(
    (set, get) => ({
      device: null,
      isConnected: false,
      isSupported: false,
      buttonMap: [],
      lastPressedIndex: null,

      setDevice: (device) => set({ device, isConnected: device !== null }),

      setConnected: (isConnected) => set({ isConnected }),

      setSupported: (isSupported) => set({ isSupported }),

      setLastPressed: (lastPressedIndex) => set({ lastPressedIndex }),

      disconnect: () => {
        const { device } = get()
        if (device) void device.close()
        set({ device: null, isConnected: false })
      },
    }),
    { name: 'stream-deck' },
  ),
)
