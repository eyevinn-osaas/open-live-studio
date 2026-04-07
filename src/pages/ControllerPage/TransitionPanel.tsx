import { useProductionStore, type TransitionType } from '@/store/production.store'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const TRANSITION_TYPES: { type: TransitionType; label: string }[] = [
  { type: 'cut', label: 'CUT' },
  { type: 'mix', label: 'MIX' },
  { type: 'wipe', label: 'WIPE' },
]

export function TransitionPanel() {
  const {
    transitionType, transitionDurationMs, tBarPosition,
    cut, take, setTransitionType, setTransitionDuration, setTBarPosition,
  } = useProductionStore()

  return (
    <div className="flex flex-col gap-3 p-3 bg-[--color-surface-2] rounded border border-[--color-border]">
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[--color-text-muted]">Transitions</span>

      {/* Transition type selector */}
      <div className="flex gap-1.5">
        {TRANSITION_TYPES.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setTransitionType(type)}
            className={cn(
              'flex-1 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-widest border transition-colors',
              transitionType === type
                ? 'bg-[--color-accent] border-indigo-400 text-white'
                : 'bg-[--color-surface-3] border-[--color-border] text-[--color-text-muted] hover:text-[--color-text-primary]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Duration (shown for non-cut transitions) */}
      {transitionType !== 'cut' && (
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-[--color-text-muted] font-mono uppercase w-16">Duration</label>
          <input
            type="range"
            min={100}
            max={3000}
            step={100}
            value={transitionDurationMs}
            onChange={(e) => setTransitionDuration(Number(e.target.value))}
            className="flex-1 h-1 accent-[--color-accent]"
          />
          <span className="text-xs font-mono text-[--color-text-muted] w-14 text-right">{transitionDurationMs}ms</span>
        </div>
      )}

      {/* T-Bar */}
      {transitionType !== 'cut' && (
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-[--color-text-muted] font-mono uppercase w-16">T-Bar</label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(tBarPosition * 100)}
            onChange={(e) => setTBarPosition(Number(e.target.value) / 100)}
            className="flex-1 h-3 accent-[--color-accent]"
          />
          <span className="text-xs font-mono text-[--color-text-muted] w-14 text-right">{Math.round(tBarPosition * 100)}%</span>
        </div>
      )}

      {/* CUT / TAKE buttons */}
      <div className="flex gap-2 pt-1">
        <Button variant="pgm" size="lg" className="flex-1 text-base font-bold" onClick={cut}>CUT</Button>
        <Button variant="pvw" size="lg" className="flex-1 text-base font-bold" onClick={take}>TAKE</Button>
      </div>
    </div>
  )
}
