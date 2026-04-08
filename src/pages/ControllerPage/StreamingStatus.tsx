import { useStatsStore } from '@/store/stats.store'
import { cn } from '@/lib/cn'

export function StreamingStatus() {
  const { active, rtpStats, error } = useStatsStore()

  const dot = !active
    ? 'bg-zinc-600'
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
    if (typeof val === 'number') return `${(val / 1000).toFixed(0)} kbps`
    return null
  })()

  return (
    <div className="flex items-center gap-1.5" title={error ?? (active ? 'Streaming' : 'Not streaming')}>
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dot)} />
      <span className="text-[10px] font-mono text-[--color-text-muted]">
        {active ? (bitrate ?? 'Live') : 'Off'}
      </span>
    </div>
  )
}
