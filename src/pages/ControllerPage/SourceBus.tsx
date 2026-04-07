import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSourcesStore } from '@/store/sources.store'
import { useProductionStore } from '@/store/production.store'
import { VideoTile } from '@/components/ui/VideoTile'
import { useTallyLight } from '@/hooks/useTallyLight'
import { getSourceStream } from '@/lib/webrtc'

function SourceCell({ sourceId }: { sourceId: string }) {
  const source = useSourcesStore((s) => s.sources.find((src) => src.id === sourceId))
  const { setPvw, cut } = useProductionStore()
  const tally = useTallyLight(sourceId)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    if (!source) return
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

  if (!source) return null

  return (
    <VideoTile
      stream={stream}
      label={source.name}
      sublabel={source.type}
      tally={tally}
      onClick={() => setPvw(sourceId)}
      onDoubleClick={() => {
        setPvw(sourceId)
        cut()
      }}
      className="min-w-[140px]"
    />
  )
}

export function SourceBus() {
  const sources = useSourcesStore(useShallow((s) => s.sources.filter((s) => s.status !== 'disconnected')))

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[--color-text-muted]">
        Source Bus — Click to preview · Double-click to cut
      </span>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sources.map((src) => (
          <div key={src.id} className="w-[140px] flex-shrink-0">
            <SourceCell sourceId={src.id} />
          </div>
        ))}
      </div>
    </div>
  )
}
