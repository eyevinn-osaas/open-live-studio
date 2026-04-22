import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { TallyLight } from './TallyLight'
import type { TallyState } from '@/hooks/useTallyLight'

interface VideoTileProps {
  stream: MediaStream | null
  label: string
  sublabel?: string
  tally?: TallyState
  onClick?: () => void
  onDoubleClick?: () => void
  className?: string
  muted?: boolean
  aspectRatio?: '16/9'
}

const tallyRingClasses: Record<TallyState, string> = {
  pgm: 'ring-4 ring-[--color-pgm]',
  pvw: 'ring-4 ring-[--color-pvw]',
  off: 'ring-1 ring-[--color-border]',
}

/**
 * Video element wrapper with tally ring, label, and stream binding.
 * Always uses playsinline autoplay muted for Safari compatibility.
 * See docs/repo-patterns.md: "Safari requires playsinline and autoplay muted"
 */
export function VideoTile({
  stream,
  label,
  sublabel,
  tally = 'off',
  onClick,
  onDoubleClick,
  className,
  muted = true,
  aspectRatio = '16/9',
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.srcObject = stream
    if (stream) {
      void el.play().catch(() => { /* autoplay policy */ })
    }
  }, [stream])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  return (
    <div
      className={cn(
        'relative bg-black rounded overflow-hidden cursor-pointer select-none',
        tallyRingClasses[tally],
        className,
      )}
      style={{ aspectRatio }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Video element — playsinline required for iOS Safari */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        muted
      />

      {/* No stream placeholder */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest">NO SIGNAL</span>
        </div>
      )}

      {/* Tally indicator + label overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-white text-xs font-semibold truncate leading-tight">{label}</span>
          {sublabel && <span className="text-zinc-400 text-[10px] truncate leading-tight">{sublabel}</span>}
        </div>
        <TallyLight state={tally} size="sm" className="ml-2 flex-shrink-0" />
      </div>

      {/* PGM / PVW label at top */}
      {tally !== 'off' && (
        <div
          className={cn(
            'absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest',
            tally === 'pgm' ? 'bg-[--color-pgm] text-white' : 'bg-[--color-pvw] text-white',
          )}
        >
          {tally === 'pgm' ? 'PGM' : 'PVW'}
        </div>
      )}
    </div>
  )
}
