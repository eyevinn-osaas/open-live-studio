import { useShallow } from 'zustand/react/shallow'
import { useSourcesStore } from '@/store/sources.store'
import { useProductionStore } from '@/store/production.store'
import { useTallyLight } from '@/hooks/useTallyLight'
import { cn } from '@/lib/cn'

function TallyBlock({ sourceId }: { sourceId: string }) {
  const source = useSourcesStore((s) => s.sources.find((src) => src.id === sourceId))
  const tally = useTallyLight(sourceId)

  if (!source) return null

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-4 transition-colors',
        tally === 'pgm'
          ? 'bg-red-950 border-red-500'
          : tally === 'pvw'
          ? 'bg-green-950 border-green-500'
          : 'bg-zinc-950 border-zinc-800',
      )}
      style={{ minHeight: '180px' }}
    >
      <span
        className={cn(
          'text-4xl font-black uppercase tracking-widest',
          tally === 'pgm' ? 'text-red-400' : tally === 'pvw' ? 'text-green-400' : 'text-zinc-700',
        )}
      >
        {tally === 'pgm' ? 'PGM' : tally === 'pvw' ? 'PVW' : '—'}
      </span>
      <span
        className={cn(
          'text-lg font-semibold mt-2',
          tally === 'pgm' ? 'text-red-300' : tally === 'pvw' ? 'text-green-300' : 'text-zinc-600',
        )}
      >
        {source.name}
      </span>
    </div>
  )
}

export function TallyPage() {
  const sources = useSourcesStore(useShallow((s) => s.sources))
  const isLive = useProductionStore((s) => s.isLive)

  return (
    <div className="min-h-screen bg-black p-4 flex flex-col gap-4">
      {/* ON AIR indicator */}
      <div className="flex justify-center">
        <div
          className={cn(
            'px-8 py-2 rounded-full text-sm font-black uppercase tracking-[0.3em]',
            isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-900 text-zinc-700',
          )}
        >
          {isLive ? '● ON AIR' : '○ OFF AIR'}
        </div>
      </div>

      {/* Tally grid */}
      {sources.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-700 text-lg uppercase tracking-widest">No sources</p>
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(sources.length, 4)}, 1fr)` }}
        >
          {sources.map((src) => (
            <TallyBlock key={src.id} sourceId={src.id} />
          ))}
        </div>
      )}
    </div>
  )
}
