import { useState, useEffect, useRef } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'

// ── Types & mock data ─────────────────────────────────────────────────────────

interface Source {
  id: string
  label: string
  type: 'mic' | 'line' | 'playback' | 'return' | 'aux'
  baseLevel: number
  // Simulate a "loudness target" offset so each source looks different
  lufsOffset: number
}

const SOURCES: Source[] = [
  { id: 'vox1', label: 'VOX 1',   type: 'mic',      baseLevel: 0.68, lufsOffset: -2 },
  { id: 'vox2', label: 'VOX 2',   type: 'mic',      baseLevel: 0.60, lufsOffset: -3 },
  { id: 'cam1', label: 'CAM 1',   type: 'line',     baseLevel: 0.42, lufsOffset: -6 },
  { id: 'cam2', label: 'CAM 2',   type: 'line',     baseLevel: 0.36, lufsOffset: -7 },
  { id: 'pkg',  label: 'PKG',     type: 'playback', baseLevel: 0.78, lufsOffset: 0  },
  { id: 'fx',   label: 'FX RTN',  type: 'return',   baseLevel: 0.22, lufsOffset: -12},
  { id: 'aux1', label: 'AUX 1',   type: 'aux',      baseLevel: 0.52, lufsOffset: -5 },
  { id: 'aux2', label: 'AUX 2',   type: 'aux',      baseLevel: 0.48, lufsOffset: -5 },
]

// EBU R128 target: -23 LUFS integrated
const LUFS_TARGET    = -23
const LUFS_MAX       = -18  // upper tolerance
const LUFS_MIN       = -28  // lower tolerance

// ── Helpers ───────────────────────────────────────────────────────────────────

// Convert linear level (0-1) to approximate LUFS value
function levelToLufs(level: number, offset: number): number {
  if (level < 0.01) return -70
  return LUFS_TARGET + offset + (level - 0.5) * 12
}

// Convert linear level to dBTP (true peak)
function levelToDbtp(level: number): number {
  if (level < 0.01) return -70
  return 20 * Math.log10(level)
}

// Compliance badge based on integrated LUFS
function complianceLabel(lufs: number): { label: string; cls: string } {
  if (lufs > LUFS_MAX)       return { label: 'TOO LOUD', cls: 'bg-red-900 text-red-300 border-red-700' }
  if (lufs < LUFS_MIN)       return { label: 'TOO QUIET', cls: 'bg-zinc-800 text-zinc-400 border-zinc-600' }
  if (lufs >= LUFS_TARGET - 1 && lufs <= LUFS_MAX)
                              return { label: 'R128 OK', cls: 'bg-green-900 text-green-300 border-green-700' }
  return                             { label: 'BORDERLINE', cls: 'bg-yellow-900 text-yellow-300 border-yellow-700' }
}

// Meter zone color: returns gradient stops for EBU R128 zones
// Meter goes left=silence, right=loud; zones are based on dBFS scale
function MeterBar({ level, peak, muted }: { level: number; peak: number; muted: boolean }) {
  const displayLevel = muted ? 0 : level
  // Color zones (thresholds as fraction of total bar width)
  // We render 4 colored segments and clip based on level
  const zones = [
    { from: 0,    to: 0.35, color: '#166534' },   // dark green: silence to -18 dBFS
    { from: 0.35, to: 0.65, color: '#15803d' },   // green: nominal (-18 to -9)
    { from: 0.65, to: 0.80, color: '#ca8a04' },   // yellow: hot (-9 to -3)
    { from: 0.80, to: 0.92, color: '#ea580c' },   // orange: near-clip (-3 to -1)
    { from: 0.92, to: 1.00, color: '#dc2626' },   // red: clip
  ]

  return (
    <div className="relative h-5 bg-zinc-950 rounded overflow-hidden flex-1">
      {/* Zone backgrounds (always visible at low opacity) */}
      {zones.map(z => (
        <div
          key={z.from}
          className="absolute top-0 bottom-0 opacity-20"
          style={{ left: `${z.from * 100}%`, width: `${(z.to - z.from) * 100}%`, backgroundColor: z.color }}
        />
      ))}
      {/* Active fill: clip all zones at current level */}
      {zones.map(z => {
        const start = z.from
        const end   = Math.min(z.to, displayLevel)
        if (end <= start) return null
        return (
          <div
            key={`fill-${z.from}`}
            className="absolute top-0 bottom-0"
            style={{
              left: `${start * 100}%`,
              width: `${(end - start) * 100}%`,
              backgroundColor: z.color,
              transition: 'width 30ms linear',
            }}
          />
        )
      })}
      {/* Peak hold marker */}
      {!muted && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/80"
          style={{ left: `${Math.min(peak, 0.999) * 100}%` }}
        />
      )}
      {/* Zone dividers */}
      {zones.slice(0, -1).map(z => (
        <div
          key={`div-${z.to}`}
          className="absolute top-0 bottom-0 w-px bg-zinc-800"
          style={{ left: `${z.to * 100}%` }}
        />
      ))}
    </div>
  )
}

// ── Loudness history sparkline ────────────────────────────────────────────────

function Sparkline({ history }: { history: number[] }) {
  const w = 120, h = 28
  if (history.length < 2) return <div style={{ width: w, height: h }} />

  const min = -35, max = -6
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * w
    const y = h - ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * h
    return `${x},${y}`
  }).join(' ')

  // target line at -23 LUFS
  const targetY = h - ((-23 - min) / (max - min)) * h

  return (
    <svg width={w} height={h} className="overflow-visible">
      <line x1={0} y1={targetY} x2={w} y2={targetY} stroke="#166534" strokeWidth={0.5} strokeDasharray="2,2" />
      <polyline points={pts} fill="none" stroke="#22c55e" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

// ── Source row ────────────────────────────────────────────────────────────────

function SourceRow({
  source, level, peak, muted, fader,
  integratedLufs, history,
  onMute, onFader,
}: {
  source: Source; level: number; peak: number; muted: boolean; fader: number
  integratedLufs: number; history: number[]
  onMute: () => void; onFader: (v: number) => void
}) {
  const momentaryLufs = levelToLufs(muted ? 0 : level, source.lufsOffset)
  const dbtp = levelToDbtp(muted ? 0 : peak)
  const { label: compLabel, cls: compCls } = complianceLabel(integratedLufs)
  const isClip = !muted && peak > 0.99

  return (
    <div className={`flex items-center gap-3 px-4 py-2 border-b border-zinc-800 transition-colors ${muted ? 'opacity-50' : ''}`}>
      {/* Source name */}
      <div className="w-16 flex-shrink-0">
        <div className="text-sm font-medium text-zinc-200 leading-none">{source.label}</div>
        <div className="text-[10px] font-mono text-zinc-600 mt-0.5">{source.type.toUpperCase()}</div>
      </div>

      {/* Mute / Solo */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onMute}
          className={`w-7 h-7 rounded text-[10px] font-mono font-bold transition-colors ${
            muted ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
          }`}
        >M</button>
      </div>

      {/* Trim fader */}
      <div className="w-24 flex-shrink-0 flex items-center gap-1">
        <span className="text-[9px] font-mono text-zinc-600">TRIM</span>
        <input
          type="range" min={0} max={100} value={fader}
          onChange={e => onFader(Number(e.target.value))}
          className="flex-1 accent-sky-400 cursor-pointer"
        />
      </div>

      {/* PPM bar */}
      <MeterBar level={muted ? 0 : level} peak={peak} muted={muted} />

      {/* Numeric displays */}
      <div className="flex gap-4 flex-shrink-0">
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-mono text-zinc-600 uppercase">Momentary</span>
          <span className={`text-sm font-mono font-bold tabular-nums leading-none ${
            momentaryLufs > -9 ? 'text-red-400' : momentaryLufs > -18 ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {muted ? '–' : momentaryLufs.toFixed(1)}
          </span>
          <span className="text-[9px] font-mono text-zinc-600">LUFS</span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[9px] font-mono text-zinc-600 uppercase">Integrated</span>
          <span className={`text-sm font-mono font-bold tabular-nums leading-none ${
            integratedLufs > LUFS_MAX ? 'text-red-400' : integratedLufs < LUFS_MIN ? 'text-zinc-500' : 'text-green-400'
          }`}>
            {integratedLufs.toFixed(1)}
          </span>
          <span className="text-[9px] font-mono text-zinc-600">LUFS</span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[9px] font-mono text-zinc-600 uppercase">True Peak</span>
          <span className={`text-sm font-mono font-bold tabular-nums leading-none ${
            isClip ? 'text-red-400 animate-pulse' : dbtp > -1 ? 'text-orange-400' : 'text-zinc-300'
          }`}>
            {muted ? '–' : dbtp.toFixed(1)}
          </span>
          <span className="text-[9px] font-mono text-zinc-600">dBTP</span>
        </div>

        {/* Compliance badge */}
        <div className="flex items-center">
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold ${compCls}`}>
            {compLabel}
          </span>
        </div>

        {/* Sparkline */}
        <div className="flex items-center">
          <Sparkline history={history} />
        </div>
      </div>
    </div>
  )
}

// ── Master loudness summary ────────────────────────────────────────────────────

function MasterSummary({ level, integrated, lra }: { level: number; integrated: number; lra: number }) {
  const dbtp = levelToDbtp(level)
  const momentary = integrated + (level - 0.55) * 8

  return (
    <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-700 flex items-center gap-8">
      <div className="flex flex-col">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">PGM Master</span>
        <span className="text-xs font-mono text-zinc-400">EBU R128 Loudness</span>
      </div>

      <div className="flex gap-6">
        {[
          { label: 'Momentary', value: momentary.toFixed(1), unit: 'LUFS', color: momentary > -18 ? 'text-yellow-400' : 'text-green-400' },
          { label: 'Integrated', value: integrated.toFixed(1), unit: 'LUFS', color: integrated > LUFS_MAX ? 'text-red-400' : integrated < LUFS_MIN ? 'text-zinc-400' : 'text-green-400' },
          { label: 'LRA', value: lra.toFixed(1), unit: 'LU', color: 'text-sky-400' },
          { label: 'True Peak', value: dbtp.toFixed(1), unit: 'dBTP', color: dbtp > -1 ? 'text-red-400' : 'text-zinc-300' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="text-[9px] font-mono text-zinc-600 uppercase">{label}</span>
            <span className={`text-2xl font-mono font-bold tabular-nums leading-none ${color}`}>{value}</span>
            <span className="text-[9px] font-mono text-zinc-600">{unit}</span>
          </div>
        ))}
      </div>

      {/* Target indicator */}
      <div className="flex flex-col gap-1 flex-1 max-w-xs">
        <div className="flex justify-between text-[9px] font-mono text-zinc-600">
          <span>-28</span>
          <span className="text-green-600">Target: {LUFS_TARGET} LUFS</span>
          <span>-6</span>
        </div>
        <div className="relative h-3 bg-zinc-950 rounded overflow-hidden">
          {/* EBU zones */}
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-zinc-800/60" />                     {/* too quiet */}
            <div className="w-px bg-zinc-600" />
            <div className="bg-green-900/80" style={{ width: '23%' }} />  {/* target zone */}
            <div className="w-px bg-zinc-600" />
            <div className="flex-1 bg-red-900/40" />                      {/* too loud */}
          </div>
          {/* Needle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white transition-all"
            style={{ left: `${Math.max(0, Math.min(100, (integrated - (-28)) / 22 * 100))}%` }}
          />
        </div>
        <div className="flex justify-center">
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${complianceLabel(integrated).cls}`}>
            {complianceLabel(integrated).label}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AudioMonitorPage() {
  const n = SOURCES.length

  const [faders, setFaders] = useState<number[]>(SOURCES.map(() => 80))
  const [muted, setMuted]   = useState<boolean[]>(SOURCES.map(() => false))
  const [levels, setLevels] = useState<number[]>(SOURCES.map(s => s.baseLevel))
  const [peaks, setPeaks]   = useState<number[]>(SOURCES.map(s => s.baseLevel + 0.04))
  // Simulated integrated LUFS (slowly drifts)
  const [integrated, setIntegrated] = useState<number[]>(
    SOURCES.map(s => LUFS_TARGET + s.lufsOffset)
  )
  // Sparkline history per source (last 40 samples)
  const [histories, setHistories] = useState<number[][]>(
    SOURCES.map(s => Array(40).fill(LUFS_TARGET + s.lufsOffset))
  )

  const mutedRef = useRef(muted)
  const integratedRef = useRef(integrated)

  const toggleMute = (i: number) => setMuted(prev => {
    const next = [...prev]; next[i] = !next[i]; mutedRef.current = next; return next
  })

  useEffect(() => {
    let lvl = SOURCES.map(s => s.baseLevel)
    let pk  = SOURCES.map(s => s.baseLevel + 0.04)
    let intg = SOURCES.map(s => LUFS_TARGET + s.lufsOffset)
    let hist = SOURCES.map(s => Array<number>(40).fill(LUFS_TARGET + s.lufsOffset))

    const id = setInterval(() => {
      lvl = SOURCES.map((s, i) => {
        if (mutedRef.current[i]) return Math.max(0, (lvl[i] ?? 0) - 0.12)
        return Math.max(0, Math.min(1, s.baseLevel + (Math.random() - 0.5) * 0.18))
      })
      pk = pk.map((p, i) => Math.max(lvl[i] ?? 0, p - 0.0025))

      intg = intg.map((v, i) => {
        if (mutedRef.current[i]) return v ?? LUFS_TARGET
        const momentary = levelToLufs(lvl[i] ?? 0, SOURCES[i]?.lufsOffset ?? 0)
        return (v ?? LUFS_TARGET) * 0.98 + momentary * 0.02
      })
      hist = hist.map((h, i) => {
        const next = [...h.slice(1), intg[i] ?? LUFS_TARGET]
        return next
      })

      setLevels([...lvl])
      setPeaks([...pk])
      setIntegrated([...intg])
      setHistories(hist.map(h => [...h]))
    }, 100)
    return () => clearInterval(id)
  }, [])

  const masterLevel = levels.reduce((s, l, i) => s + (!muted[i] ? l : 0), 0) / n
  const masterIntegrated = integrated.reduce((s, v) => s + v, 0) / n
  const masterLra = 4.2 + Math.sin(Date.now() / 30000) * 0.5  // fake LRA drift

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <PageHeader title="Monitor" subtitle="EBU R128 loudness monitor — source metering" />

      {/* Master summary bar */}
      <MasterSummary level={masterLevel} integrated={masterIntegrated} lra={masterLra} />

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-1 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
        <div className="w-16 text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Source</div>
        <div className="w-8 text-[9px] font-mono text-zinc-600">Mute</div>
        <div className="w-24 text-[9px] font-mono text-zinc-600 uppercase">Trim</div>
        <div className="flex-1 text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
          PPM — Zone: <span className="text-zinc-700">■</span> Silence &nbsp;
          <span className="text-green-700">■</span> Nominal &nbsp;
          <span className="text-yellow-700">■</span> Hot &nbsp;
          <span className="text-orange-700">■</span> Near-clip &nbsp;
          <span className="text-red-700">■</span> Clip
        </div>
        <div className="w-8 text-[9px] font-mono text-zinc-600 text-right">M</div>
        <div className="w-8 text-[9px] font-mono text-zinc-600 text-right">I</div>
        <div className="w-8 text-[9px] font-mono text-zinc-600 text-right">TP</div>
        <div className="w-24" />
        <div className="w-[120px] text-[9px] font-mono text-zinc-600">History</div>
      </div>

      {/* Source rows */}
      <div className="flex-1 overflow-y-auto">
        {SOURCES.map((source, i) => (
          <SourceRow
            key={source.id}
            source={source}
            level={levels[i] ?? 0}
            peak={peaks[i] ?? 0}
            muted={muted[i] ?? false}
            fader={faders[i] ?? 80}
            integratedLufs={integrated[i] ?? LUFS_TARGET}
            history={histories[i] ?? []}
            onMute={() => toggleMute(i)}
            onFader={v => setFaders(p => { const n = [...p]; n[i] = v; return n })}
          />
        ))}
      </div>
    </div>
  )
}
