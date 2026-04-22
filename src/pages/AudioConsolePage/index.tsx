import { useState, useEffect, useRef } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'

// ── Types & constants ────────────────────────────────────────────────────────

interface Channel {
  id: string
  label: string
  type: 'mic' | 'line' | 'playback' | 'return' | 'aux'
  baseLevel: number
  stripColor: string
}

const CHANNELS: Channel[] = [
  { id: 'vox1', label: 'VOX 1',  type: 'mic',      baseLevel: 0.68, stripColor: 'bg-violet-700' },
  { id: 'vox2', label: 'VOX 2',  type: 'mic',      baseLevel: 0.60, stripColor: 'bg-violet-700' },
  { id: 'cam1', label: 'CAM 1',  type: 'line',     baseLevel: 0.42, stripColor: 'bg-sky-700' },
  { id: 'cam2', label: 'CAM 2',  type: 'line',     baseLevel: 0.36, stripColor: 'bg-sky-700' },
  { id: 'pkg',  label: 'PKG',    type: 'playback', baseLevel: 0.78, stripColor: 'bg-orange-700' },
  { id: 'fx',   label: 'FX RTN', type: 'return',   baseLevel: 0.22, stripColor: 'bg-emerald-700' },
  { id: 'aux1', label: 'AUX 1',  type: 'aux',      baseLevel: 0.52, stripColor: 'bg-teal-600' },
  { id: 'aux2', label: 'AUX 2',  type: 'aux',      baseLevel: 0.48, stripColor: 'bg-teal-600' },
]

const TYPE_LABELS: Record<Channel['type'], string> = {
  mic: 'MIC', line: 'LINE', playback: 'PLBK', return: 'RTN', aux: 'AUX',
}

const EQ_BANDS = ['HF', 'MF', 'LF']

// ── Helpers ──────────────────────────────────────────────────────────────────

function meterColor(l: number): string {
  if (l > 0.92) return '#ef4444'
  if (l > 0.77) return '#f97316'
  if (l > 0.55) return '#eab308'
  return '#22c55e'
}

function faderDb(v: number): string {
  if (v <= 4) return '-∞'
  const db = (v - 80) / 80 * 40
  return db >= 0 ? `+${db.toFixed(0)}` : `${db.toFixed(0)}`
}

// Knob: renders a circular rotary control (visual only)
function Knob({ value, label, size = 28 }: { value: number; label: string; size?: number }) {
  // value 0-100, maps to -135deg..+135deg sweep
  const angle = -135 + (value / 100) * 270
  const r = size / 2
  const indicatorLen = r - 3
  const rad = (angle * Math.PI) / 180
  const x2 = r + indicatorLen * Math.sin(rad)
  const y2 = r - indicatorLen * Math.cos(rad)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={size} height={size} className="cursor-pointer">
        <circle cx={r} cy={r} r={r - 1} fill="#1c1c1c" stroke="#4b5563" strokeWidth={1.5} />
        <circle cx={r} cy={r} r={r - 4} fill="#27272a" />
        <line x1={r} y1={r} x2={x2} y2={y2} stroke="#59cbe8" strokeWidth={2} strokeLinecap="round" />
      </svg>
      <span className="text-[9px] font-mono text-zinc-500 leading-none">{label}</span>
    </div>
  )
}

// ── Channel strip ─────────────────────────────────────────────────────────────

interface StripProps {
  ch: Channel
  index: number
  fader: number
  muted: boolean
  soloed: boolean
  busPgm: boolean
  busAux1: boolean
  busAux2: boolean
  level: number
  peak: number
  gateActive: boolean
  compActive: boolean
  onFader: (v: number) => void
  onMute: () => void
  onSolo: () => void
  onBus: (bus: 'pgm' | 'aux1' | 'aux2') => void
}

function ChannelStrip({
  ch, fader, muted, soloed, busPgm, busAux1, busAux2,
  level, peak, gateActive, compActive,
  onFader, onMute, onSolo, onBus,
}: StripProps) {
  const [gain, setGain] = useState(60)
  const [eq, setEq] = useState([50, 50, 50])
  const displayLevel = muted ? 0 : level

  return (
    <div className="flex flex-col w-[76px] bg-zinc-900 border-r border-zinc-800 select-none">
      {/* Header */}
      <div className={`${ch.stripColor} px-1.5 py-1.5 flex flex-col gap-0.5`}>
        <span className="text-white text-[11px] font-bold leading-none truncate">{ch.label}</span>
        <span className="text-white/60 text-[9px] font-mono leading-none">{TYPE_LABELS[ch.type]}</span>
      </div>

      {/* Gain */}
      <div className="px-2 py-2 border-b border-zinc-800">
        <div className="flex flex-col items-center gap-1">
          <Knob value={gain} label="GAIN" size={30} />
          <input
            type="range" min={0} max={100} value={gain}
            onChange={e => setGain(Number(e.target.value))}
            className="w-full h-0.5 accent-sky-400 cursor-pointer"
          />
        </div>
      </div>

      {/* EQ */}
      <div className="px-1.5 py-2 border-b border-zinc-800">
        <div className="flex justify-around">
          {EQ_BANDS.map((band, bi) => (
            <Knob key={band} value={eq[bi] ?? 50} label={band} size={22}  />
          ))}
        </div>
      </div>

      {/* Dynamics */}
      <div className="px-2 py-1.5 border-b border-zinc-800 flex justify-around">
        <button
          onClick={() => {}}
          className={`text-[9px] font-mono px-1 py-0.5 rounded border ${gateActive ? 'border-emerald-500 text-emerald-400 bg-emerald-950' : 'border-zinc-700 text-zinc-600'}`}
        >GATE</button>
        <button
          onClick={() => {}}
          className={`text-[9px] font-mono px-1 py-0.5 rounded border ${compActive ? 'border-sky-500 text-sky-400 bg-sky-950' : 'border-zinc-700 text-zinc-600'}`}
        >COMP</button>
      </div>

      {/* Fader + PPM meter */}
      <div className="flex-1 flex flex-col items-center py-2 gap-1 border-b border-zinc-800">
        <div className="flex items-end gap-1.5" style={{ height: 150 }}>
          {/* PPM bar */}
          <div className="w-2.5 h-full bg-zinc-950 rounded-sm relative overflow-hidden flex flex-col-reverse">
            <div
              className="w-full transition-none rounded-sm"
              style={{
                height: `${displayLevel * 100}%`,
                backgroundColor: meterColor(displayLevel),
                transition: 'height 30ms linear',
              }}
            />
            {/* Peak hold marker */}
            <div
              className="absolute left-0 right-0 h-px bg-white/80"
              style={{ bottom: `${peak * 100}%` }}
            />
          </div>
          {/* Fader */}
          <input
            type="range" min={0} max={100} value={fader}
            onChange={e => onFader(Number(e.target.value))}
            style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 150, cursor: 'pointer' } as React.CSSProperties}
            className="accent-zinc-400"
          />
        </div>
        {/* dB readout */}
        <span className="text-[10px] font-mono text-zinc-400">{faderDb(fader)}</span>
      </div>

      {/* Mute / Solo */}
      <div className="flex gap-1 px-1.5 py-1.5 border-b border-zinc-800">
        <button
          onClick={onMute}
          className={`flex-1 py-1.5 rounded text-[10px] font-bold font-mono transition-colors ${
            muted ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >M</button>
        <button
          onClick={onSolo}
          className={`flex-1 py-1.5 rounded text-[10px] font-bold font-mono transition-colors ${
            soloed ? 'bg-cyan-400 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >S</button>
      </div>

      {/* Bus assigns */}
      <div className="flex flex-col gap-0.5 px-1.5 py-1.5">
        {([['pgm', 'PGM', busPgm], ['aux1', 'AUX1', busAux1], ['aux2', 'AUX2', busAux2]] as const).map(
          ([bus, label, active]) => (
            <button
              key={bus}
              onClick={() => onBus(bus)}
              className={`w-full py-0.5 rounded text-[9px] font-mono font-medium transition-colors ${
                active
                  ? bus === 'pgm' ? 'bg-red-700 text-white' : 'bg-zinc-500 text-white'
                  : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700'
              }`}
            >{label}</button>
          )
        )}
      </div>
    </div>
  )
}

// ── Master strip ─────────────────────────────────────────────────────────────

function MasterStrip({ levelL, levelR, peakL, peakR }: {
  levelL: number; levelR: number; peakL: number; peakR: number
}) {
  const [masterFader, setMasterFader] = useState(80)
  const lufs = -23 + (levelL + levelR) / 2 * 14

  return (
    <div className="flex flex-col w-[96px] bg-zinc-900 border-l-2 border-zinc-600 select-none">
      {/* Header */}
      <div className="bg-zinc-700 px-2 py-1.5">
        <span className="text-white text-[11px] font-bold">MASTER</span>
      </div>

      {/* LUFS display */}
      <div className="px-2 py-2 border-b border-zinc-800 flex flex-col items-center gap-1">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">LUFS</span>
        <span className={`text-lg font-mono font-bold tabular-nums ${
          lufs > -6 ? 'text-red-400' : lufs > -12 ? 'text-orange-400' : lufs > -18 ? 'text-yellow-400' : 'text-green-400'
        }`}>
          {lufs.toFixed(1)}
        </span>
        <div className="text-[8px] font-mono text-zinc-500">EBU R128: {lufs < -23 ? 'LOW' : lufs > -18 ? 'HIGH' : 'OK'}</div>
      </div>

      {/* LR Meters + fader */}
      <div className="flex-1 flex flex-col items-center py-2 gap-1 border-b border-zinc-800">
        <div className="flex items-end gap-2" style={{ height: 150 }}>
          {/* L meter */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] font-mono text-zinc-600">L</span>
            <div className="w-3 bg-zinc-950 rounded-sm relative overflow-hidden" style={{ height: 140 }}>
              <div className="absolute bottom-0 left-0 right-0 rounded-sm"
                style={{ height: `${levelL * 100}%`, backgroundColor: meterColor(levelL), transition: 'height 30ms linear' }} />
              <div className="absolute left-0 right-0 h-px bg-white/80" style={{ bottom: `${peakL * 100}%` }} />
            </div>
          </div>
          {/* R meter */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] font-mono text-zinc-600">R</span>
            <div className="w-3 bg-zinc-950 rounded-sm relative overflow-hidden" style={{ height: 140 }}>
              <div className="absolute bottom-0 left-0 right-0 rounded-sm"
                style={{ height: `${levelR * 100}%`, backgroundColor: meterColor(levelR), transition: 'height 30ms linear' }} />
              <div className="absolute left-0 right-0 h-px bg-white/80" style={{ bottom: `${peakR * 100}%` }} />
            </div>
          </div>
          {/* Master fader */}
          <input
            type="range" min={0} max={100} value={masterFader}
            onChange={e => setMasterFader(Number(e.target.value))}
            style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 140, cursor: 'pointer' } as React.CSSProperties}
            className="accent-zinc-400"
          />
        </div>
        <span className="text-[10px] font-mono text-zinc-400">{faderDb(masterFader)}</span>
      </div>

      {/* ON AIR */}
      <div className="p-2">
        <button className="w-full py-2 rounded bg-red-700 hover:bg-red-600 text-white text-[10px] font-mono font-bold tracking-widest transition-colors">
          ON AIR
        </button>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AudioConsolePage() {
  const n = CHANNELS.length

  const [faders, setFaders] = useState<number[]>(CHANNELS.map(() => 80))
  const [muted, setMuted]   = useState<boolean[]>(CHANNELS.map(() => false))
  const [soloed, setSoloed] = useState<boolean[]>(CHANNELS.map(() => false))
  const [busPgm, setBusPgm]   = useState<boolean[]>(CHANNELS.map(() => true))
  const [busAux1, setBusAux1] = useState<boolean[]>(CHANNELS.map(() => false))
  const [busAux2, setBusAux2] = useState<boolean[]>(CHANNELS.map(() => false))
  const [gateOn, setGateOn]   = useState<boolean[]>(CHANNELS.map((_, i) => i < 2))
  const [compOn, setCompOn]   = useState<boolean[]>(CHANNELS.map((_, i) => i < 4))
  const [levels, setLevels]   = useState<number[]>(CHANNELS.map(ch => ch.baseLevel))
  const [peaks, setPeaks]     = useState<number[]>(CHANNELS.map(ch => ch.baseLevel + 0.04))

  const mutedRef = useRef(muted)

  const toggleMute = (i: number) => setMuted(prev => {
    const next = [...prev]; next[i] = !next[i]; mutedRef.current = next; return next
  })
  const toggleSolo = (i: number) => setSoloed(prev => { const n = [...prev]; n[i] = !n[i]; return n })
  const toggleBus = (i: number, bus: 'pgm' | 'aux1' | 'aux2') => {
    if (bus === 'pgm')  setBusPgm(p => { const n = [...p]; n[i] = !n[i]; return n })
    if (bus === 'aux1') setBusAux1(p => { const n = [...p]; n[i] = !n[i]; return n })
    if (bus === 'aux2') setBusAux2(p => { const n = [...p]; n[i] = !n[i]; return n })
  }

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

  const masterL = levels.reduce((s, l, i) => s + (busPgm[i] && !muted[i] ? l : 0), 0) / n
  const masterR = masterL * (0.95 + Math.random() * 0.05)
  const masterPeakL = peaks.reduce((s, p, i) => s + (busPgm[i] ? p : 0), 0) / n
  const masterPeakR = masterPeakL

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <PageHeader title="Console" subtitle="Channel strip mixer — broadcast layout" />
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-w-max">
          {CHANNELS.map((ch, i) => (
            <ChannelStrip
              key={ch.id}
              ch={ch}
              index={i}
              fader={faders[i] ?? 80}
              muted={muted[i] ?? false}
              soloed={soloed[i] ?? false}
              busPgm={busPgm[i] ?? true}
              busAux1={busAux1[i] ?? false}
              busAux2={busAux2[i] ?? false}
              level={levels[i] ?? 0}
              peak={peaks[i] ?? 0}
              gateActive={gateOn[i] ?? false}
              compActive={compOn[i] ?? false}
              onFader={v => setFaders(p => { const n = [...p]; n[i] = v; return n })}
              onMute={() => toggleMute(i)}
              onSolo={() => toggleSolo(i)}
              onBus={bus => toggleBus(i, bus)}
            />
          ))}
          <MasterStrip
            levelL={masterL}
            levelR={masterR}
            peakL={masterPeakL}
            peakR={masterPeakR}
          />
        </div>
      </div>
    </div>
  )
}
