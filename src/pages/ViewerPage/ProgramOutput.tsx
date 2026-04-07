import { useRef, useEffect } from 'react'
import { useViewerStore } from '@/store/viewer.store'
import { useProductionStore } from '@/store/production.store'
import { useSourcesStore } from '@/store/sources.store'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export function ProgramOutput() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { programStream, connectionState, isMockStream, isMuted, setMuted } = useViewerStore()
  const pgmSourceId = useProductionStore((s) => s.pgmSourceId)
  const isLive = useProductionStore((s) => s.isLive)
  const sources = useSourcesStore((s) => s.sources)
  const pgmSource = sources.find((s) => s.id === pgmSourceId)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.srcObject = programStream
    if (programStream) void el.play().catch(() => undefined)
  }, [programStream])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
  }, [isMuted])

  return (
    <div className="flex flex-col gap-2">
      {/* Status row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant={
            connectionState === 'connected' ? 'connected' :
            connectionState === 'mock' ? 'mock' :
            connectionState === 'connecting' ? 'connecting' : 'disconnected'
          }
        />
        {isMockStream && (
          <span className="text-xs text-[--color-text-muted] font-mono">Mock stream · camera or color bars</span>
        )}
        {isLive && <Badge variant="live" />}
        {pgmSource && (
          <span className="text-xs text-[--color-text-muted]">{pgmSource.name}</span>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant={isMuted ? 'ghost' : 'active'}
            onClick={() => setMuted(!isMuted)}
          >
            {isMuted ? '🔇 Muted' : '🔊 Unmuted'}
          </Button>
        </div>
      </div>

      {/* Video element */}
      <div
        className={cn(
          'relative bg-black rounded overflow-hidden w-full',
          isLive ? 'ring-4 ring-[--color-pgm]' : 'ring-1 ring-[--color-border]',
        )}
        style={{ aspectRatio: '16/9' }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          autoPlay
          muted
        />
        {!programStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
            <div className="text-center">
              <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">NO SIGNAL</p>
              <p className="text-zinc-600 text-xs mt-1">Navigate to Controller to start</p>
            </div>
          </div>
        )}
        {isLive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[--color-live] px-2 py-1 rounded animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="text-white text-xs font-bold font-mono">ON AIR</span>
          </div>
        )}
      </div>
    </div>
  )
}
