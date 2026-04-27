import { useStatsStore } from '@/store/stats.store'
import { cn } from '@/lib/cn'

export function StreamingStatus() {
  const { active, rtpStats, error } = useStatsStore()

  const dotColor = !active
    ? 'bg-zinc-700'
    : error
    ? 'bg-red-500'
    : rtpStats == null
    ? 'bg-yellow-500'
    : 'bg-green-500'

  // Best-effort bitrate extraction from rtpStats
  const bitrate = (() => {
    if (!rtpStats || typeof rtpStats !== 'object') return null
    const s = rtpStats as Record<string, unknown>
    const val = s['bitrate'] ?? s['bit_rate'] ?? s['bytes_sent']
    if (typeof val === 'number') return `${(val / 1000).toFixed(0)} K`
    return null
  })()

  const statusLabel = active ? (bitrate ?? 'LIVE') : 'OFF'

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 border border-zinc-800 bg-zinc-950 text-[10px] font-mono"
      title={error ?? (active ? 'Streaming' : 'Not streaming')}
    >
      <span className={cn('w-1.5 h-1.5 flex-shrink-0', dotColor)} style={{ borderRadius: '50%' }} />
      <span className="uppercase tracking-widest text-zinc-400">{statusLabel}</span>
      {active && bitrate && (
        <span className="text-zinc-600 text-[9px]">{bitrate}</span>
      )}
    </div>
  )
}
