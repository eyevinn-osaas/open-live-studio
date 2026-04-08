import { useEffect, useRef, useState } from 'react'
import { useProductionStore } from '@/store/production.store'

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function TimerBar() {
  const isLive = useProductionStore((s) => s.isLive)
  const now = useClock()

  const goLiveAtRef = useRef<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [segment, setSegment] = useState(0)
  const segmentStartRef = useRef<number>(Date.now())

  // Track go-live start time
  useEffect(() => {
    if (isLive) {
      goLiveAtRef.current = Date.now()
    } else {
      goLiveAtRef.current = null
      setElapsed(0)
    }
  }, [isLive])

  // Tick elapsed and segment timers
  useEffect(() => {
    const id = setInterval(() => {
      if (goLiveAtRef.current !== null) {
        setElapsed(Date.now() - goLiveAtRef.current)
      }
      setSegment(Date.now() - segmentStartRef.current)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const resetSegment = () => {
    segmentStartRef.current = Date.now()
    setSegment(0)
  }

  return (
    <div className="flex items-center gap-4 text-xs font-mono text-[--color-text-muted]">
      <span title="Wall clock">{now.toLocaleTimeString()}</span>
      <span className="text-[--color-border]">|</span>
      <span title="Elapsed since Go Live" className={isLive ? 'text-[--color-pgm]' : ''}>
        {formatTime(elapsed)}
      </span>
      <span className="text-[--color-border]">|</span>
      <span title="Segment timer">{formatTime(segment)}</span>
      <button
        onClick={resetSegment}
        className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-[--color-surface-raised] border border-[--color-border] hover:bg-[--color-surface-3] transition-colors"
      >
        RST
      </button>
    </div>
  )
}
