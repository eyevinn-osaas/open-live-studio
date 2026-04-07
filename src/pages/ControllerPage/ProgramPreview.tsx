import { useEffect, useState } from 'react'
import { useProductionStore } from '@/store/production.store'
import { useSourcesStore } from '@/store/sources.store'
import { VideoTile } from '@/components/ui/VideoTile'
import { Badge } from '@/components/ui/Badge'
import { getSourceStream } from '@/lib/webrtc'
import type { Source } from '@/store/sources.store'
import type { TallyState } from '@/hooks/useTallyLight'

function SourceMonitor({ source, tally }: { source: Source | undefined; tally: TallyState }) {
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    if (!source) { setStream(null); return }
    let cancelled = false
    void getSourceStream(source).then((s) => {
      if (cancelled) { s.getTracks().forEach((t) => t.stop()); return }
      setStream(s)
    })
    return () => {
      cancelled = true
      setStream((prev) => { prev?.getTracks().forEach((t) => t.stop()); return null })
    }
  }, [source?.id, source?.color, source?.name, source?.liveCamera])

  return (
    <VideoTile
      stream={stream}
      label={source?.name ?? 'No Source'}
      sublabel={source?.resolution}
      tally={tally}
    />
  )
}

export function ProgramPreview() {
  const { pgmSourceId, pvwSourceId } = useProductionStore()
  const sources = useSourcesStore((s) => s.sources)

  const pgmSource = sources.find((s) => s.id === pgmSourceId)
  const pvwSource = sources.find((s) => s.id === pvwSourceId)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[--color-pgm]">Program</span>
            {pgmSource?.liveCamera && <Badge variant="connected" label="LIVE CAM" />}
          </div>
          <SourceMonitor source={pgmSource} tally="pgm" />
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[--color-pvw]">Preview</span>
            {pvwSource?.liveCamera && <Badge variant="connected" label="LIVE CAM" />}
          </div>
          <SourceMonitor source={pvwSource} tally="pvw" />
        </div>
      </div>
    </div>
  )
}
