import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { MOCK_INTERCOM_LINES, type IntercomLine } from '@/mock/intercom-lines'

interface IntercomState {
  lines: IntercomLine[]
  joinedLineIds: string[]
  micActive: boolean
  micMuted: boolean
  micDeviceId: string | null
  localStream: MediaStream | null
  availableDevices: MediaDeviceInfo[]
}

interface IntercomActions {
  joinLine: (id: string) => void
  leaveLine: (id: string) => void
  setMicActive: (active: boolean) => void
  setMicMuted: (muted: boolean) => void
  setMicDeviceId: (id: string | null) => void
  setLocalStream: (stream: MediaStream | null) => void
  setAvailableDevices: (devices: MediaDeviceInfo[]) => void
  isJoined: (id: string) => boolean
}

export const useIntercomStore = create<IntercomState & IntercomActions>()(
  devtools(
    (set, get) => ({
      lines: MOCK_INTERCOM_LINES,
      joinedLineIds: [],
      micActive: false,
      micMuted: false,
      micDeviceId: null,
      localStream: null,
      availableDevices: [],

      joinLine: (id) => {
        const { joinedLineIds } = get()
        if (!joinedLineIds.includes(id)) set({ joinedLineIds: [...joinedLineIds, id] })
      },

      leaveLine: (id) =>
        set((state) => ({ joinedLineIds: state.joinedLineIds.filter((l) => l !== id) })),

      setMicActive: (micActive) => set({ micActive }),

      setMicMuted: (micMuted) => set({ micMuted }),

      setMicDeviceId: (micDeviceId) => set({ micDeviceId }),

      setLocalStream: (localStream) => set({ localStream }),

      setAvailableDevices: (availableDevices) => set({ availableDevices }),

      isJoined: (id) => get().joinedLineIds.includes(id),
    }),
    { name: 'intercom' },
  ),
)
