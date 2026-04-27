import { useRef, useImperativeHandle, forwardRef } from 'react'
import { useViewerStore } from '@/store/viewer.store'
import { VideoTile, type VideoTileHandle } from '@/components/ui/VideoTile'
import { Badge } from '@/components/ui/Badge'

export interface ProgramPreviewHandle {
  setMuted: (muted: boolean) => void
}

export const ProgramPreview = forwardRef<ProgramPreviewHandle>(function ProgramPreview(_, ref) {
  const { programStream, connectionState, retryCountdown } = useViewerStore()
  const tileRef = useRef<VideoTileHandle>(null)

  useImperativeHandle(ref, () => ({
    setMuted: (m: boolean) => tileRef.current?.setMuted(m),
  }))

  return (
    <div className="relative h-full aspect-video max-w-full border border-zinc-800" style={{ background: '#000' }}>
      {/* PGM label — top-left corner tally */}
      <div
        className="absolute top-0 left-0 z-10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-white pointer-events-none"
        style={{ background: '#ff0000' }}
      >
        PGM
      </div>

      <VideoTile ref={tileRef} stream={programStream} label="Multiview" tally="off" className="h-full w-full" />

      {/* Connection state badge — bottom right */}
      <div className="absolute bottom-2 right-2 pointer-events-none">
        {connectionState === 'connected' && <Badge variant="live" label="LIVE" />}
        {connectionState === 'connecting' && <Badge variant="connecting" label="CONNECTING" />}
        {connectionState === 'error' && (
          <Badge variant="error" label={retryCountdown != null ? `RETRYING IN ${retryCountdown}` : 'ERROR'} />
        )}
      </div>
    </div>
  )
})
