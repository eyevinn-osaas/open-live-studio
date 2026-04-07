import { useEffect } from 'react'
import { useViewerStore } from '@/store/viewer.store'
import { getViewerStream } from '@/lib/webrtc'

/**
 * Initialises the viewer stream on mount.
 * Uses real camera via getUserMedia, falls back to canvas color bars.
 * See docs/repo-patterns.md: "WebRTC viewer fails on mobile without TURN"
 */
export function useWebRTC(): void {
  const setProgramStream = useViewerStore((s) => s.setProgramStream)
  const setConnectionState = useViewerStore((s) => s.setConnectionState)
  const disconnect = useViewerStore((s) => s.disconnect)

  useEffect(() => {
    let cancelled = false
    setConnectionState('connecting')

    void getViewerStream().then(({ stream, isMock }) => {
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      setProgramStream(stream, isMock)
    })

    return () => {
      cancelled = true
      disconnect()
    }
  }, [setProgramStream, setConnectionState, disconnect])
}
