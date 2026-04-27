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
    <div className="flex items-center gap-0 text-[10px] font-mono border border-zinc-800 bg-zinc-950">
      {/* Wall clock */}
      <div className="px-3 py-1.5 border-r border-zinc-800 text-zinc-400" title="Wall clock">
        <span className="block text-[8px] uppercase tracking-widest text-zinc-600 mb-0.5">UTC</span>
        <span>{now.toLocaleTimeString('en-GB', { hour12: false })}</span>
      </div>
      {/* Elapsed */}
      <div className="px-3 py-1.5 border-r border-zinc-800" title="Elapsed since Go Live">
        <span className="block text-[8px] uppercase tracking-widest text-zinc-600 mb-0.5">ELAPSED</span>
        <span className={isLive ? 'text-red-500' : 'text-zinc-400'}>{formatTime(elapsed)}</span>
      </div>
      {/* Segment */}
      <div className="px-3 py-1.5 border-r border-zinc-800" title="Segment timer">
        <span className="block text-[8px] uppercase tracking-widest text-zinc-600 mb-0.5">SEG</span>
        <span className="text-zinc-400">{formatTime(segment)}</span>
      </div>
      {/* Reset segment */}
      <button
        onClick={resetSegment}
        className="btn-hardware px-2.5 py-1.5 text-[9px] uppercase tracking-widest text-zinc-500 hover:text-orange-500 hover:bg-zinc-900 transition-colors h-full"
        title="Reset segment timer"
      >
        RST
      </button>
    </div>
  )
}
