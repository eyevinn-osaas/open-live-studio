import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { statsApi, type ApiStreamingStats } from '@/lib/api'

const POLL_INTERVAL_MS = 2000

interface StatsState {
  active: boolean
  rtpStats: unknown
  webrtcStats: unknown
  error: string | undefined
  polling: boolean
}

interface StatsActions {
  startPolling: (productionId: string) => void
  stopPolling: () => void
}

let intervalId: ReturnType<typeof setInterval> | undefined

export const useStatsStore = create<StatsState & StatsActions>()(
  devtools(
    immer((set) => ({
      active: false,
      rtpStats: undefined,
      webrtcStats: undefined,
      error: undefined,
      polling: false,

      startPolling: (productionId) => {
        if (intervalId) clearInterval(intervalId)
        set((s) => { s.polling = true })

        const poll = async () => {
          try {
            const result: ApiStreamingStats = await statsApi.streaming(productionId)
            set((s) => {
              s.active = result.active
              s.rtpStats = result.rtpStats
              s.webrtcStats = result.webrtcStats
              s.error = result.error
            })
          } catch (err) {
            set((s) => { s.error = err instanceof Error ? err.message : String(err) })
          }
        }

        void poll()
        intervalId = setInterval(() => { void poll() }, POLL_INTERVAL_MS)
      },

      stopPolling: () => {
        if (intervalId) { clearInterval(intervalId); intervalId = undefined }
        set((s) => { s.polling = false; s.active = false })
      },
    })),
    { name: 'stats' },
  ),
)
