import { useViewerStore } from '@/store/viewer.store'
import { VideoTile } from '@/components/ui/VideoTile'
import { Badge } from '@/components/ui/Badge'

export function ProgramPreview() {
  const { programStream, connectionState, retryCountdown } = useViewerStore()

  return (
    <div className="relative h-full aspect-video max-w-full">
      <VideoTile stream={programStream} label="Multiview" tally="off" className="h-full w-full" />
      <div className="absolute bottom-2 right-2 pointer-events-none">
        {connectionState === 'connected' && <Badge variant="live" label="LIVE" />}
        {connectionState === 'connecting' && <Badge variant="connecting" label="CONNECTING" />}
        {connectionState === 'error' && (
          <Badge variant="error" label={retryCountdown != null ? `RETRYING IN ${retryCountdown}` : 'ERROR'} />
        )}
      </div>
    </div>
  )
}
