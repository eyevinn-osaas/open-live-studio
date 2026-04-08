import { useAudioStore } from '@/store/audio.store'
import { cn } from '@/lib/cn'

function Fader({ elementId, label }: { elementId: string; label: string }) {
  const level = useAudioStore((s) => s.levels[elementId] ?? 1.0)
  const muted = useAudioStore((s) => s.muted[elementId] ?? false)
  const setLevel = useAudioStore((s) => s.setLevel)
  const toggleMute = useAudioStore((s) => s.toggleMute)

  return (
    <div className="flex flex-col items-center gap-1 min-w-[44px]">
      {/* VU meter */}
      <div className="relative w-3 h-20 bg-zinc-800 rounded overflow-hidden">
        <div
          className={cn(
            'absolute bottom-0 w-full rounded transition-none',
            muted ? 'bg-zinc-600' : level > 0.9 ? 'bg-red-500' : level > 0.7 ? 'bg-yellow-500' : 'bg-green-500',
          )}
          style={{ height: `${level * 100}%` }}
        />
      </div>
      {/* Fader */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={level}
        onChange={(e) => setLevel(elementId, parseFloat(e.target.value))}
        disabled={muted}
        className="w-20 cursor-pointer"
        style={{ writingMode: 'vertical-lr', direction: 'rtl', height: '80px' }}
        aria-label={`${label} level`}
      />
      {/* Mute */}
      <button
        onClick={() => toggleMute(elementId)}
        className={cn(
          'text-[9px] font-bold uppercase w-8 py-0.5 rounded border transition-colors',
          muted
            ? 'bg-red-600 text-white border-red-600'
            : 'bg-[--color-surface-raised] text-[--color-text-muted] border-[--color-border]',
        )}
        aria-label={muted ? `Unmute ${label}` : `Mute ${label}`}
      >
        M
      </button>
      <span className="text-[9px] text-[--color-text-muted] text-center max-w-[44px] truncate">{label}</span>
    </div>
  )
}

export function AudioPanel() {
  const elements = useAudioStore((s) => s.elements)

  if (elements.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-[--color-surface-3] rounded-xl border border-[--color-border] min-h-[120px] items-center justify-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[--color-text-muted]">Audio</span>
        <p className="text-[10px] text-[--color-text-muted] text-center">
          No audio elements defined in template
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-[--color-surface-3] rounded-xl border border-[--color-border]">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[--color-text-muted]">Audio</span>
      <div className="flex gap-3 overflow-x-auto">
        {elements.map((el) => (
          <Fader key={el.elementId} elementId={el.elementId} label={el.label} />
        ))}
      </div>
    </div>
  )
}
