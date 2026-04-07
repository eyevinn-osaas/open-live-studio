import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSourcesStore } from '@/store/sources.store'
import { VideoTile } from '@/components/ui/VideoTile'
import { useTallyLight } from '@/hooks/useTallyLight'
import { getSourceStream } from '@/lib/webrtc'

function SourceCell({ sourceId }: { sourceId: string }) {
  const source = useSourcesStore((s) => s.sources.find((src) => src.id === sourceId))
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
      className="w-full"
    />
  )
}

type GridSize = '2x2' | '3x3' | '4x4'

const gridCols: Record<GridSize, string> = {
  '2x2': 'grid-cols-2',
  '3x3': 'grid-cols-3',
  '4x4': 'grid-cols-4',
}

export function MultiviewGrid({ gridSize }: { gridSize: GridSize }) {
  const sources = useSourcesStore(useShallow((s) => s.sources.filter((s) => s.status !== 'disconnected')))
  const maxCells = gridSize === '2x2' ? 4 : gridSize === '3x3' ? 9 : 16
  const cells = sources.slice(0, maxCells)

  return (
    <div className={`grid ${gridCols[gridSize]} gap-px bg-black`}>
      {cells.map((src) => (
        <SourceCell key={src.id} sourceId={src.id} />
      ))}
      {/* Empty cells to fill grid */}
      {Array.from({ length: Math.max(0, maxCells - cells.length) }, (_, i) => (
        <div key={`empty-${i}`} className="aspect-video bg-zinc-950 flex items-center justify-center">
          <span className="text-zinc-700 text-xs font-mono uppercase tracking-widest">Empty</span>
        </div>
      ))}
    </div>
  )
}
