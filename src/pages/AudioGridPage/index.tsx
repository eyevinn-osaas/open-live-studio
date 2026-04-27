import { useState, useEffect, useRef } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'

// ── Types & mock data ─────────────────────────────────────────────────────────

interface Channel {
  id: string
  label: string
  type: 'mic' | 'line' | 'playback' | 'return' | 'aux'
  baseLevel: number
  accentColor: string    // Tailwind bg class
  accentText: string     // Tailwind text class
}

const CHANNELS: Channel[] = [
  { id: 'vox1', label: 'VOX 1',  type: 'mic',      baseLevel: 0.68, accentColor: 'bg-violet-600', accentText: 'text-violet-400' },
  { id: 'vox2', label: 'VOX 2',  type: 'mic',      baseLevel: 0.60, accentColor: 'bg-violet-600', accentText: 'text-violet-400' },
  { id: 'cam1', label: 'CAM 1',  type: 'line',     baseLevel: 0.42, accentColor: 'bg-sky-600',    accentText: 'text-sky-400' },
  { id: 'cam2', label: 'CAM 2',  type: 'line',     baseLevel: 0.36, accentColor: 'bg-sky-600',    accentText: 'text-sky-400' },
  { id: 'pkg',  label: 'PKG',    type: 'playback', baseLevel: 0.78, accentColor: 'bg-orange-600', accentText: 'text-orange-400' },
  { id: 'fx',   label: 'FX RTN', type: 'return',   baseLevel: 0.22, accentColor: 'bg-emerald-600',accentText: 'text-emerald-400' },
  { id: 'aux1', label: 'AUX 1',  type: 'aux',      baseLevel: 0.52, accentColor: 'bg-teal-600',   accentText: 'text-teal-400' },
  { id: 'aux2', label: 'AUX 2',  type: 'aux',      baseLevel: 0.48, accentColor: 'bg-teal-600',   accentText: 'text-teal-400' },
]

const BUSES = ['PGM', 'AUX 1', 'AUX 2', 'MON'] as const
type Bus = typeof BUSES[number]

// ── Helpers ───────────────────────────────────────────────────────────────────

function meterColor(l: number): string {
  if (l > 0.92) return 'bg-red-500'
  if (l > 0.77) return 'bg-orange-500'
  if (l > 0.55) return 'bg-yellow-500'
  return 'bg-green-500'
}

function faderDb(v: number): string {
  if (v <= 4) return '-∞'
  const db = (v - 80) / 80 * 40
  return db >= 0 ? `+${db.toFixed(0)}` : `${db.toFixed(0)}`
}

// ── Mini channel card ─────────────────────────────────────────────────────────

function ChannelCard({
  ch, fader, muted, soloed, level, selected,
  onSelect, onMute, onSolo,
}: {
  ch: Channel; fader: number; muted: boolean; soloed: boolean
  level: number; selected: boolean
  onSelect: () => void; onMute: () => void; onSolo: () => void
}) {
  const displayLevel = muted ? 0 : level

  return (
    <button
      onClick={onSelect}
      className={`flex flex-col rounded-lg border transition-all text-left overflow-hidden ${
        selected
          ? 'border-sky-400 shadow-lg shadow-sky-900/40 bg-zinc-800'
          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
      }`}
    >
      {/* Color stripe + label */}
      <div className={`${ch.accentColor} px-3 py-2 flex items-center justify-between`}>
        <span className="text-white text-sm font-bold leading-none">{ch.label}</span>
        <span className="text-white/60 text-[10px] font-mono">{ch.type.toUpperCase()}</span>
      </div>

      {/* Level bar */}
      <div className="px-3 pt-2 pb-1">
        <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-none ${meterColor(displayLevel)}`}
            style={{ width: `${displayLevel * 100}%`, transition: 'width 40ms linear' }}
          />
        </div>
      </div>

      {/* Fader position indicator */}
      <div className="px-3 pb-2 flex items-center gap-2">
        <div className="flex-1 h-0.5 bg-zinc-700 rounded-full relative">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-zinc-300 border border-zinc-500 -translate-x-1/2"
            style={{ left: `${fader}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-zinc-500 w-7 text-right">{faderDb(fader)}</span>
      </div>

      {/* Mute / Solo badges */}
      <div className="px-3 pb-3 flex gap-1.5" onClick={e => e.stopPropagation()}>
        <button
          onClick={onMute}
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
            muted ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
          }`}
        >M</button>
        <button
          onClick={onSolo}
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
            soloed ? 'bg-cyan-400 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
          }`}
        >S</button>
        {muted && <span className="ml-auto text-[9px] font-mono text-amber-500 self-center">MUTED</span>}
        {!muted && level > 0.9 && <span className="ml-auto text-[9px] font-mono text-red-400 self-center animate-pulse">CLIP</span>}
      </div>
    </button>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  ch, fader, muted, soloed, level, peak, buses,
  onFader, onMute, onSolo, onBus,
}: {
  ch: Channel; fader: number; muted: boolean; soloed: boolean
  level: number; peak: number
  buses: Set<Bus>
  onFader: (v: number) => void
  onMute: () => void; onSolo: () => void
  onBus: (bus: Bus) => void
}) {
  const [pan, setPan] = useState(50)
  const [eqHf, setEqHf] = useState(50)
  const [eqMf, setEqMf] = useState(50)
  const [eqLf, setEqLf] = useState(50)
  const displayLevel = muted ? 0 : level

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-700">
      {/* Header */}
      <div className={`${ch.accentColor} px-4 py-3 flex items-center justify-between flex-shrink-0`}>
        <div>
          <span className="text-white text-lg font-bold">{ch.label}</span>
          <span className="text-white/60 text-xs font-mono ml-2">{ch.type.toUpperCase()}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onMute} className={`px-3 py-1 rounded font-mono font-bold text-sm transition-colors ${
            muted ? 'bg-amber-500 text-black' : 'bg-black/30 text-white/70 hover:bg-black/50'
          }`}>MUTE</button>
          <button onClick={onSolo} className={`px-3 py-1 rounded font-mono font-bold text-sm transition-colors ${
            soloed ? 'bg-cyan-400 text-black' : 'bg-black/30 text-white/70 hover:bg-black/50'
          }`}>SOLO</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Fader + meter row */}
        <div className="flex gap-4 items-end">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Level</span>
            <div className="flex items-end gap-2" style={{ height: 180 }}>
              {/* PPM */}
              <div className="w-4 h-full bg-zinc-950 rounded relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 rounded"
                  style={{ height: `${displayLevel * 100}%`, backgroundColor: displayLevel > 0.92 ? '#ef4444' : displayLevel > 0.77 ? '#f97316' : displayLevel > 0.55 ? '#eab308' : '#22c55e', transition: 'height 30ms linear' }} />
                <div className="absolute left-0 right-0 h-0.5 bg-white/70" style={{ bottom: `${peak * 100}%` }} />
              </div>
              {/* Fader */}
              <input
                type="range" min={0} max={100} value={fader}
                onChange={e => onFader(Number(e.target.value))}
                style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 180, cursor: 'pointer' } as React.CSSProperties}
                className="accent-sky-400"
              />
            </div>
            <span className="text-sm font-mono text-zinc-300 tabular-nums">{faderDb(fader)} dB</span>
          </div>

          {/* Pan */}
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Pan</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-600">L</span>
              <input type="range" min={0} max={100} value={pan}
                onChange={e => setPan(Number(e.target.value))}
                className="flex-1 accent-sky-400 cursor-pointer" />
              <span className="text-[10px] font-mono text-zinc-600">R</span>
            </div>
            <span className="text-xs font-mono text-zinc-400 text-center">
              {pan === 50 ? 'C' : pan < 50 ? `L${50 - pan}` : `R${pan - 50}`}
            </span>
          </div>
        </div>

        {/* EQ */}
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono block mb-2">EQ</span>
          <div className="grid grid-cols-3 gap-3">
            {[['HF', eqHf, setEqHf], ['MF', eqMf, setEqMf], ['LF', eqLf, setEqLf]] .map(([label, val, setter]) => (
              <div key={label as string} className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-zinc-500">{label as string}</span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {val as number === 50 ? '0' : val as number > 50 ? `+${((val as number - 50) / 5).toFixed(0)}` : `${((val as number - 50) / 5).toFixed(0)}`} dB
                  </span>
                </div>
                <input type="range" min={0} max={100} value={val as number}
                  onChange={e => (setter as (v: number) => void)(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer" />
              </div>
            ))}
          </div>
        </div>

        {/* Bus routing */}
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono block mb-2">Bus Routing</span>
          <div className="grid grid-cols-2 gap-1.5">
            {BUSES.map(bus => (
              <button
                key={bus}
                onClick={() => onBus(bus)}
                className={`py-2 rounded font-mono font-bold text-xs transition-colors ${
                  buses.has(bus)
                    ? bus === 'PGM' ? 'bg-red-700 text-white' : 'bg-zinc-500 text-white'
                    : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                }`}
              >{bus}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AudioGridPage() {
  const n = CHANNELS.length

  const [faders, setFaders]   = useState<number[]>(CHANNELS.map(() => 80))
  const [muted, setMuted]     = useState<boolean[]>(CHANNELS.map(() => false))
  const [soloed, setSoloed]   = useState<boolean[]>(CHANNELS.map(() => false))
  const [buses, setBuses]     = useState<Set<Bus>[]>(CHANNELS.map(() => new Set<Bus>(['PGM'])))
  const [levels, setLevels]   = useState<number[]>(CHANNELS.map(ch => ch.baseLevel))
  const [peaks, setPeaks]     = useState<number[]>(CHANNELS.map(ch => ch.baseLevel + 0.04))
  const [selectedId, setSelectedId] = useState<string>(CHANNELS[0]?.id ?? '')

  const mutedRef = useRef(muted)

  const toggleMute = (i: number) => setMuted(prev => {
    const next = [...prev]; next[i] = !next[i]; mutedRef.current = next; return next
  })
  const toggleSolo = (i: number) => setSoloed(prev => { const n = [...prev]; n[i] = !n[i]; return n })
  const toggleBus = (i: number, bus: Bus) => setBuses(prev => {
    const next = prev.map(s => new Set(s))
    next[i]?.has(bus) ? next[i]?.delete(bus) : next[i]?.add(bus)
    return next
  })

  useEffect(() => {
    let lvl = CHANNELS.map(ch => ch.baseLevel)
    let pk  = CHANNELS.map(ch => ch.baseLevel + 0.04)
    const id = setInterval(() => {
      lvl = CHANNELS.map((ch, i) => {
        if (mutedRef.current[i]) return Math.max(0, (lvl[i] ?? 0) - 0.12)
        return Math.max(0, Math.min(1, ch.baseLevel + (Math.random() - 0.5) * 0.18))
      })
      pk = pk.map((p, i) => Math.max(lvl[i] ?? 0, p - 0.0025))
      setLevels([...lvl])
      setPeaks([...pk])
    }, 50)
    return () => clearInterval(id)
  }, [])

  const selectedIndex = CHANNELS.findIndex(ch => ch.id === selectedId)
  const selectedCh = CHANNELS[selectedIndex]

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <PageHeader title="Grid" subtitle="Touch-style channel grid with detail panel" />

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-3">
            {CHANNELS.map((ch, i) => (
              <ChannelCard
                key={ch.id}
                ch={ch}
                fader={faders[i] ?? 80}
                muted={muted[i] ?? false}
                soloed={soloed[i] ?? false}
                level={levels[i] ?? 0}
                selected={ch.id === selectedId}
                onSelect={() => setSelectedId(ch.id)}
                onMute={() => toggleMute(i)}
                onSolo={() => toggleSolo(i)}
              />
            ))}
          </div>

          {/* Master row */}
          <div className="mt-4 p-3 rounded-lg bg-zinc-900 border border-zinc-700">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Master PGM</span>
              <div className="flex-1 h-3 bg-zinc-950 rounded-full overflow-hidden">
                {(() => {
                  const masterLevel = levels.reduce((s, l, i) => s + ((buses[i]?.has('PGM') ?? false) && !muted[i] ? l : 0), 0) / n
                  return (
                    <div
                      className={`h-full rounded-full ${masterLevel > 0.92 ? 'bg-red-500' : masterLevel > 0.77 ? 'bg-orange-500' : masterLevel > 0.55 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${masterLevel * 100}%`, transition: 'width 40ms linear' }}
                    />
                  )
                })()}
              </div>
            </div>
            <div className="flex gap-2">
              {BUSES.map(bus => (
                <span key={bus} className={`text-[10px] font-mono px-2 py-0.5 rounded ${bus === 'PGM' ? 'bg-red-900 text-red-300' : 'bg-zinc-800 text-zinc-500'}`}>{bus}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedCh && (
          <div className="w-72 flex-shrink-0">
            <DetailPanel
              ch={selectedCh}
              fader={faders[selectedIndex] ?? 80}
              muted={muted[selectedIndex] ?? false}
              soloed={soloed[selectedIndex] ?? false}
              level={levels[selectedIndex] ?? 0}
              peak={peaks[selectedIndex] ?? 0}
              buses={buses[selectedIndex] ?? new Set<Bus>()}
              onFader={v => setFaders(p => { const n = [...p]; n[selectedIndex] = v; return n })}
              onMute={() => toggleMute(selectedIndex)}
              onSolo={() => toggleSolo(selectedIndex)}
              onBus={bus => toggleBus(selectedIndex, bus)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
