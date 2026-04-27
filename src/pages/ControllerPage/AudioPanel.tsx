import { useRef, useCallback } from 'react'
import { useAudioStore } from '@/store/audio.store'
import { useProductionStore } from '@/store/production.store'
import { cn } from '@/lib/cn'
import type { OutboundMessage } from '@/hooks/useControllerWs'

type SendFn = (msg: OutboundMessage) => void

const FADER_H = 160
const TICK_COUNT = 13

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconGear() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
    </svg>
  )
}

function IconSpeaker() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
      <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
      <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
    </svg>
  )
}

// ── VU Meter ──────────────────────────────────────────────────────────────────

const DB_MIN = -60
const DB_MAX = 0

function dbToRatio(db: number): number {
  return Math.max(0, Math.min(1, (db - DB_MIN) / (DB_MAX - DB_MIN)))
}

function barColor(ratio: number): string {
  if (ratio > 0.9) return '#ef4444'   // > -6 dBFS: clip zone
  if (ratio > 0.7) return '#eab308'   // > -18 dBFS: above nominal
  return '#22c55e'                     // ≤ -18 dBFS: nominal
}

function VuMeter({ elementId }: { elementId: string }) {
  const meter = useAudioStore((s) => s.meters[elementId])
  // bar  = instantaneous peak  (rises fast, falls fast — PPM bar)
  // hold = slowly-decaying peak (stays up longer — peak hold indicator)
  const channels = meter
    ? meter.peak.map((peak, i) => ({ bar: peak, hold: meter.decay?.[i] ?? peak }))
    : [{ bar: DB_MIN, hold: DB_MIN }]

  return (
    <div style={{ width: channels.length > 1 ? 14 : 7, height: FADER_H, display: 'flex', gap: 2, flexShrink: 0 }}>
      {channels.map(({ bar, hold }, i) => {
        const barR  = dbToRatio(bar)
        const holdR = dbToRatio(hold)
        return (
          <div key={i} style={{ flex: 1, position: 'relative', background: '#18181b', borderRadius: 1 }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${barR * 100}%`, background: barColor(barR), transition: 'height 80ms linear' }} />
            <div style={{ position: 'absolute', bottom: `${holdR * 100}%`, left: 0, right: 0, height: 2, background: '#ffffff99' }} />
          </div>
        )
      })}
    </div>
  )
}

// ── Fader taper ───────────────────────────────────────────────────────────────
// Broadcast-standard log taper: pos 1.0 → 0 dB, pos 0.75 → −10 dB, pos 0.5 → −20 dB.
// Formula: volume = 0.01^(1−pos)  ↔  pos = 1 + log10(volume) / 2

function faderToVolume(pos: number): number {
  if (pos <= 0) return 0
  return Math.pow(0.01, 1 - pos)
}

function volumeToFader(vol: number): number {
  if (vol <= 0) return 0
  return Math.max(0, 1 + Math.log10(vol) / 2)
}

// ── Channel strip ─────────────────────────────────────────────────────────────

function ChannelStrip({ elementId, label, send, showMute = true, isPgm = false }: { elementId: string; label: string; send: SendFn; showMute?: boolean; isPgm?: boolean }) {
  const level = useAudioStore((s) => s.levels[elementId] ?? 1.0)
  const muted = useAudioStore((s) => s.muted[elementId] ?? false)
  const setLevel = useAudioStore((s) => s.setLevel)
  const toggleMute = useAudioStore((s) => s.toggleMute)

  const throttleRef = useRef<{ timer: ReturnType<typeof setTimeout>; last: number } | null>(null)
  const atFloorRef = useRef(false)

  const handleChange = useCallback((faderPos: number) => {
    const volume = faderToVolume(faderPos)
    setLevel(elementId, volume)

    // Auto-mute when fader hits floor, auto-unmute when it leaves
    const nowAtFloor = faderPos <= 0.02
    if (nowAtFloor && !atFloorRef.current) {
      atFloorRef.current = true
      if (!muted) {
        toggleMute(elementId)
        send({ type: 'AUDIO_SET', elementId, property: 'mute', value: true })
      }
    } else if (!nowAtFloor && atFloorRef.current) {
      atFloorRef.current = false
      if (muted) {
        toggleMute(elementId)
        send({ type: 'AUDIO_SET', elementId, property: 'mute', value: false })
      }
    }

    if (throttleRef.current) {
      throttleRef.current.last = volume
      return
    }
    send({ type: 'AUDIO_SET', elementId, property: 'volume', value: volume })
    const entry = { timer: null as unknown as ReturnType<typeof setTimeout>, last: volume }
    entry.timer = setTimeout(() => {
      throttleRef.current = null
      if (entry.last !== volume) {
        send({ type: 'AUDIO_SET', elementId, property: 'volume', value: entry.last })
      }
    }, 150)
    throttleRef.current = entry
  }, [elementId, muted, send, setLevel, toggleMute])

  const handleMute = useCallback(() => {
    const next = !muted
    toggleMute(elementId)
    send({ type: 'AUDIO_SET', elementId, property: 'mute', value: next })
  }, [elementId, muted, send, toggleMute])

  return (
    <div className={cn('flex flex-col shrink-0 bg-[--color-surface-1] border-r border-zinc-800 select-none', isPgm && 'ring-2 ring-red-500 ring-inset')} style={{ width: 120 }}>
      {/* Channel name header */}
      <div className="px-2 py-1 text-center border-b" style={{ background: 'rgba(22,163,74,0.2)', borderColor: 'rgba(22,163,74,0.4)' }}>
        <span className="text-[10px] font-bold tracking-wide truncate block" style={{ color: '#16a34a' }}>{label}</span>
      </div>

      {/* Main body */}
      <div className="flex gap-2 px-2 py-3 flex-1">

        {/* Left: action buttons stacked */}
        <div className="flex flex-col gap-1.5 items-center">
          <button
            title="Settings"
            className="w-7 h-7 bg-[#2a2a35] border border-zinc-600 rounded flex items-center justify-center text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            <IconGear />
          </button>
          <button
            title="Solo"
            className="w-7 h-7 bg-[#2a2a35] border border-zinc-600 rounded flex items-center justify-center text-[11px] font-bold text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            S
          </button>
          <button
            title="Info"
            className="w-7 h-7 bg-[#2a2a35] border border-zinc-600 rounded flex items-center justify-center text-[11px] font-bold text-zinc-400 hover:bg-zinc-700 transition-colors"
          >
            i
          </button>
          {/* Speaker / monitor — green when active (not muted) */}
          {showMute && (
            <button
              title={muted ? 'Unmute' : 'Mute'}
              onClick={handleMute}
              className={cn(
                'w-7 h-7 border rounded flex items-center justify-center transition-colors',
                muted
                  ? 'bg-[#2a2a35] border-zinc-600 text-zinc-500'
                  : 'bg-[#1a6b2a] border-[#22c55e] text-white',
              )}
            >
              <IconSpeaker />
            </button>
          )}
        </div>

        <VuMeter elementId={elementId} />

        {/* Right: fader + tick marks */}
        <div className="flex items-center justify-start">
          {/* Outer wrapper: 44px wide × FADER_H tall — input is rotated inside */}
          <div className="relative overflow-visible" style={{ width: 44, height: FADER_H }}>
            {/* Dotted centre track — behind fader */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: 2,
                height: FADER_H,
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundImage: 'repeating-linear-gradient(to bottom, #4b5563 0, #4b5563 3px, transparent 3px, transparent 7px)',
              }}
            />
            {/* Tick marks — behind fader */}
            <div
              className="absolute flex flex-col justify-between pointer-events-none"
              style={{ left: 25, top: 0, height: FADER_H, zIndex: 0 }}
            >
              {Array.from({ length: TICK_COUNT }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i % 4 === 0 ? 9 : 5,
                    height: 1,
                    background: i % 4 === 0 ? '#d4d4d8' : '#71717a',
                  }}
                />
              ))}
            </div>
            {/* Horizontal input rotated -90deg — on top of ticks */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.005}
              value={volumeToFader(level)}
              onChange={(e) => handleChange(parseFloat(e.target.value))}
              aria-label={`${label} fader`}
              className="fader-rotated"
              style={{
                width: FADER_H,
                height: 44,
                left: -(FADER_H - 44) / 2,
                top: (FADER_H - 44) / 2,
                cursor: muted ? 'not-allowed' : 'pointer',
                zIndex: 1,
              }}
            />
          </div>
        </div>
      </div>

      {/* Mute button */}
      {showMute && (
        <div className="border-t border-zinc-800 px-2 py-1.5">
          <button
            onClick={handleMute}
            className={cn(
              'w-full py-1 text-xs font-bold rounded transition-colors',
              muted
                ? 'bg-red-700 text-white border border-red-600'
                : 'bg-[#2a2a35] text-zinc-300 border border-zinc-600 hover:bg-zinc-700',
            )}
          >
            M
          </button>
        </div>
      )}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function AudioPanel({ send }: { send: SendFn }) {
  const elements = useAudioStore((s) => s.elements)
  const pgmInput = useProductionStore((s) => s.pgmInput)

  const mainElement = elements.find((e) => e.elementId === 'main')
  const inputElements = elements.filter((e) => e.elementId !== 'main')

  const hasContent = elements.length > 0

  return (
    <div className="bg-[--color-surface-3] rounded-xl border border-[--color-border] ml-4 overflow-hidden flex items-stretch w-fit">
      {!hasContent ? (
        <div className="flex items-center justify-center min-h-[160px] px-4">
          <p className="text-[10px] text-zinc-600 text-center">No channels available</p>
        </div>
      ) : (
        <>
          {/* Fixed: OUTPUTS label + MAIN strip */}
          <div className="flex items-stretch shrink-0">
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: 18, background: 'rgba(89,203,232,0.15)' }}
            >
              <span
                className="text-[9px] font-bold tracking-widest uppercase whitespace-nowrap"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: '#59cbe8' }}
              >
                OUTPUTS
              </span>
            </div>
            {mainElement ? (
              <ChannelStrip elementId="main" label="MAIN" send={send} />
            ) : (
              <div className="flex items-center justify-center px-3" style={{ minWidth: 60 }}>
                <p className="text-[10px] text-zinc-600 text-center">No output</p>
              </div>
            )}
          </div>

          {/* Fixed: INPUTS separator */}
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: 18, background: 'rgba(22,163,74,0.2)' }}
          >
            <span
              className="text-[9px] font-bold tracking-widest uppercase whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', color: '#16a34a' }}
            >
              INPUTS
            </span>
          </div>

          {/* Scrollable: input strips */}
          <div className="flex items-stretch overflow-x-auto">
            <div className="flex [&>*:last-child]:border-r-0">
              {inputElements.length === 0 ? (
                <div className="flex items-center justify-center px-3" style={{ minWidth: 60 }}>
                  <p className="text-[10px] text-zinc-600 text-center">No inputs</p>
                </div>
              ) : (
                inputElements.map((el) => (
                  <ChannelStrip key={el.elementId} elementId={el.elementId} label={el.label} send={send} isPgm={!!pgmInput && el.mixerInput === pgmInput} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
