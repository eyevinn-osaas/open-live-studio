import { useProductionStore, type TransitionType } from '@/store/production.store'
import { useProductionsStore } from '@/store/productions.store'
import { useSourcesStore } from '@/store/sources.store'
import { cn } from '@/lib/cn'
import { useRef, useCallback } from 'react'

const DURATION_PRESETS_MS = [500, 1000, 2000]
const TRANSITION_TYPES: TransitionType[] = ['mix', 'dip', 'push']

interface TransitionPanelProps {
  onCut: () => void
  onAuto: () => void
  onFtb: () => void
  onSelectPvw: (mixerInput: string) => void
  onSetOvl: (alpha: number) => void
}

export function TransitionPanel({ onCut, onAuto, onFtb, onSelectPvw, onSetOvl }: TransitionPanelProps) {
  const ovlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSetOvl = useCallback((alpha: number) => {
    if (ovlTimerRef.current) clearTimeout(ovlTimerRef.current)
    ovlTimerRef.current = setTimeout(() => onSetOvl(alpha), 150)
  }, [onSetOvl])

  const {
    pgmInput, pvwInput, isFtb,
    transitionType, transitionDurationMs, tBarPosition,
    setPgm, setTransitionType, setTransitionDuration, setTBarPosition,
    activeProductionId,
  } = useProductionStore()

  const production = useProductionsStore((s) => s.productions.find((p) => p.id === activeProductionId))
  const sources = useSourcesStore((s) => s.sources)

  const VIRTUAL_SOURCE_NAMES: Record<string, string> = {
    '__test1__': 'PINWHEEL',
    '__test2__': 'COLORS',
  }

  // One slot per assignment, sorted by mixer input — handles duplicates and virtual sources
  const inputSlots = [...(production?.sources ?? [])]
    .sort((a, b) => a.mixerInput.localeCompare(b.mixerInput))
    .map((a) => {
      const realSource = sources.find((s) => s.id === a.sourceId)
      const name = (realSource?.name ?? VIRTUAL_SOURCE_NAMES[a.sourceId] ?? a.sourceId).toUpperCase()
      return { mixerInput: a.mixerInput, sourceId: a.sourceId, name }
    })

  return (
    <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">

      {/* ── PGM row ──────────────────────────────────────────────────────────── */}
      <div className="flex items-stretch border-b border-zinc-800" style={{ minHeight: 38 }}>
        {/* Row label */}
        <div className="flex items-center justify-center px-2 shrink-0 border-r border-zinc-800"
          style={{ width: 40, background: 'rgba(255,0,0,0.12)' }}>
          <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: '#ff0000' }}>PGM</span>
        </div>

        {/* Source tiles */}
        <div className="flex items-center gap-px flex-1 overflow-x-auto px-1.5 py-1">
          {inputSlots.length === 0 && (
            <span className="text-[9px] text-zinc-600 italic px-1">
              {!production?.templateId ? 'NO TEMPLATE' : 'NO SOURCES'}
            </span>
          )}
          {inputSlots.map((slot) => (
            <div
              key={slot.mixerInput}
              className={cn(
                'flex-1 min-w-14 py-1 px-1.5 text-[10px] font-bold truncate border cursor-default select-none flex items-center justify-center tracking-wide',
                pgmInput === slot.mixerInput
                  ? 'text-white border-white'
                  : 'text-zinc-600 border-zinc-800 bg-zinc-900',
              )}
              style={pgmInput === slot.mixerInput ? { background: '#ff0000', borderColor: '#ffffff' } : {}}
            >
              {slot.name}
            </div>
          ))}
        </div>

        {/* Action group: TAKE + AUTO + FTB */}
        <div className="flex items-center gap-px px-1.5 shrink-0 border-l border-zinc-800 py-1">
          {/* TAKE — large physical button */}
          <button
            onClick={onCut}
            className="btn-hardware px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white border ring-1 ring-inset ring-white transition-opacity hover:opacity-90"
            style={{ background: '#cc0000', borderColor: '#ff0000', minWidth: 64 }}
          >
            TAKE
          </button>
          <button
            onClick={onAuto}
            className="btn-hardware px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-300 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 transition-colors"
          >
            AUTO
          </button>
          <button
            onClick={onFtb}
            className={cn(
              'btn-hardware px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors',
              isFtb
                ? 'text-white border-zinc-400 bg-zinc-700'
                : 'text-zinc-500 bg-zinc-900 border-zinc-700 hover:text-zinc-300',
            )}
          >
            FTB
          </button>
        </div>
      </div>

      {/* ── PVW row ──────────────────────────────────────────────────────────── */}
      <div className="flex items-stretch border-b border-zinc-800" style={{ minHeight: 38 }}>
        {/* Row label */}
        <div className="flex items-center justify-center px-2 shrink-0 border-r border-zinc-800"
          style={{ width: 40, background: 'rgba(0,204,0,0.10)' }}>
          <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: '#00cc00' }}>PVW</span>
        </div>

        {/* Source tiles */}
        <div className="flex items-center gap-px flex-1 overflow-x-auto px-1.5 py-1">
          {inputSlots.length === 0 && (
            <span className="text-[9px] text-zinc-600 italic px-1">
              {!production?.templateId ? 'NO TEMPLATE' : 'NO SOURCES'}
            </span>
          )}
          {inputSlots.map((slot) => {
            const isOnPgm = pgmInput === slot.mixerInput
            const isActive = pvwInput === slot.mixerInput
            return (
              <button
                key={slot.mixerInput}
                onClick={() => !isOnPgm && onSelectPvw(slot.mixerInput)}
                disabled={isOnPgm}
                className={cn(
                  'btn-hardware flex-1 min-w-14 py-1 px-1.5 text-[10px] font-bold truncate border transition-all tracking-wide',
                  isActive
                    ? 'text-black border-white'
                    : isOnPgm
                      ? 'text-zinc-700 bg-zinc-900 border-zinc-800 opacity-40 cursor-not-allowed'
                      : 'text-zinc-500 bg-zinc-900 border-zinc-800 hover:text-white hover:border-zinc-500',
                )}
                style={isActive ? { background: '#00cc00', borderColor: '#ffffff' } : {}}
              >
                {slot.name}
              </button>
            )
          })}
        </div>

        {/* Transition type selector — 3-button hardware bus strip */}
        <div className="flex items-center shrink-0 border-l border-zinc-800 px-1.5 py-1 gap-0">
          {TRANSITION_TYPES.map((type, idx) => (
            <button
              key={type}
              onClick={() => setTransitionType(type)}
              className={cn(
                'btn-hardware px-0 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors',
                idx === 0 ? 'border-r-0' : idx === TRANSITION_TYPES.length - 1 ? 'border-l-0' : 'border-x-0',
                transitionType === type
                  ? 'text-black bg-orange-500 border-orange-400 z-10 relative'
                  : 'text-zinc-500 bg-zinc-900 border-zinc-700 hover:text-zinc-300 hover:bg-zinc-800',
              )}
              style={{ minWidth: 52 }}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVL / T-bar row ─────────────────────────────────────────────────── */}
      <div className="flex items-stretch">
        {/* Row label */}
        <div className="flex items-center justify-center px-2 shrink-0 border-r border-zinc-800" style={{ width: 40 }}>
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600">OVL</span>
        </div>

        {/* T-bar slider — styled like a physical fader */}
        <div className="flex items-center flex-1 px-3 py-2 gap-3">
          <div className="relative flex-1 flex items-center" style={{ height: 24 }}>
            {/* Track background */}
            <div
              className="absolute inset-x-0"
              style={{
                height: 4,
                background: '#1a1a1a',
                border: '1px solid #333333',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            {/* Fill */}
            <div
              className="absolute left-0"
              style={{
                height: 4,
                width: `${tBarPosition * 100}%`,
                background: '#f97316',
                top: '50%',
                transform: 'translateY(-50%)',
                transition: 'width 40ms linear',
              }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(tBarPosition * 100)}
              onChange={(e) => { const v = Number(e.target.value) / 100; setTBarPosition(v); debouncedSetOvl(v) }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              style={{ zIndex: 2 }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 w-10 text-right tabular-nums shrink-0">
            {tBarPosition.toFixed(2)}
          </span>
        </div>

        {/* Duration presets + custom ms input */}
        <div className="flex items-center gap-px px-1.5 py-1 shrink-0 border-l border-zinc-800">
          {DURATION_PRESETS_MS.map((ms) => (
            <button
              key={ms}
              onClick={() => setTransitionDuration(ms)}
              className={cn(
                'btn-hardware px-2.5 py-1.5 text-[9px] font-mono border transition-colors uppercase tracking-widest',
                transitionDurationMs === ms
                  ? 'text-black bg-orange-500 border-orange-400'
                  : 'text-zinc-500 bg-zinc-900 border-zinc-700 hover:text-zinc-300',
              )}
            >
              {ms / 1000}S
            </button>
          ))}
          <input
            type="number"
            min={100}
            max={10000}
            step={100}
            value={transitionDurationMs}
            onChange={(e) => setTransitionDuration(Number(e.target.value))}
            className="w-[64px] px-2 py-1.5 border border-zinc-700 bg-zinc-900 text-[10px] font-mono text-zinc-300 text-right focus:outline-none focus:border-orange-500"
            style={{ appearance: 'textfield' }}
          />
          <span className="text-[9px] text-zinc-600 px-1 uppercase">MS</span>
        </div>
      </div>

    </div>
  )
}
