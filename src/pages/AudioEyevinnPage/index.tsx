import { useState, useRef, useEffect, useCallback } from 'react'

// ── Volume scale (piecewise logarithmic, matching reference exactly) ─────────
function volumePosToVal(pos: number): number {
  let dB = 0
  if (pos >= 0 && pos < 8) {
    dB = (16000 * pos) / 128 - 1060
  } else if (pos >= 8 && pos < 32) {
    dB = (160 * pos) / 128 - 70
  } else if (pos >= 32 && pos < 64) {
    dB = (80 * pos) / 128 - 50
  } else {
    dB = (40 * pos) / 128 - 30
  }
  if (dB < -200) return 0
  return Math.pow(10, dB / 20)
}

function volumeValToPos(val: number): number {
  if (val <= 0) return 0
  const dB = 20 * Math.log10(val)
  if (dB > -10) return Math.round(((dB + 30) * 128) / 40)
  if (dB > -30) return Math.round(((dB + 50) * 128) / 80)
  if (dB > -60) return Math.round(((dB + 70) * 128) / 160)
  return Math.round(((dB + 1060) * 128) / 16000)
}

function posToDb(pos: number): string {
  const val = volumePosToVal(pos)
  if (val <= 0) return '−∞'
  const dB = 20 * Math.log10(val)
  return `${dB >= 0 ? '+' : ''}${dB.toFixed(1)} dB`
}

// ── Types ────────────────────────────────────────────────────────────────────
type NavSection = 'strips' | 'mixes' | 'outputs'
type Mode = 'Stereo' | 'Mono'

interface Strip {
  id: number
  label: string
  volume: number   // 0–127 position
  pan: number      // 0–128 (64 = center)
  muted: boolean
  pfl: boolean
  selected: boolean
  mode: Mode
  slot: number
  leftCh: number
  rightCh: number
  levelL: number   // 0–1
  levelR: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const DEFAULT_VOLUME = volumeValToPos(0.8)

function makeStrip(id: number, label: string, opts: Partial<Strip> = {}): Strip {
  return {
    id, label,
    volume: DEFAULT_VOLUME,
    pan: 64,
    muted: false, pfl: false, selected: false,
    mode: 'Stereo', slot: id, leftCh: 1, rightCh: 2,
    levelL: 0, levelR: 0,
    ...opts,
  }
}

const INITIAL_STRIPS: Strip[] = [
  makeStrip(1, 'Cam 1',   { slot: 1, leftCh: 1, rightCh: 2 }),
  makeStrip(2, 'Cam 2',   { slot: 1, leftCh: 3, rightCh: 4 }),
  makeStrip(3, 'Mic 1',   { slot: 2, mode: 'Mono', leftCh: 1, pan: 50 }),
  makeStrip(4, 'Mic 2',   { slot: 2, mode: 'Mono', leftCh: 3, muted: true, pan: 78 }),
  makeStrip(5, 'Music',   { slot: 3, volume: volumeValToPos(0.4) }),
  makeStrip(6, 'Effects', { slot: 3, leftCh: 3, rightCh: 4, volume: volumeValToPos(0.5) }),
]

// ── SliderLegend SVG (matches reference exactly) ─────────────────────────────
function SliderLegend() {
  const lines = [4, 36, 68, 100, 132, 164, 196, 228, 248, 268, 276]
  const labels: Record<number, string> = {
    4: '10', 36: '5', 68: '0', 100: '-5', 132: '-10',
    164: '-20', 196: '-30', 228: '-40', 248: '-50', 268: '-60', 276: '-∞',
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'relative', top: 9, flexShrink: 0 }}
      height="280"
      width="67"
      viewBox="0 0 67 280"
    >
      {lines.map((y) => (
        <g key={y}>
          <line x1="22" y1={y} x2="67" y2={y} stroke="#777" strokeWidth={y === 68 ? 2.5 : 1.5} />
          <text x="18" y={y + 4} textAnchor="end" fontSize="9" fill="#999" fontFamily="monospace">
            {labels[y]}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ── Level Meter (7×200, matches reference) ───────────────────────────────────
function LevelMeter({ level }: { level: number }) {
  const h = 200
  // reference: levelToPercent converts dB; for mock we just use 0–1 directly
  const pct = Math.min(1, Math.max(0, level)) * 100
  const coverH = Math.round((1 - level) * h)
  const redBorder = 30    // top 30% = red zone (-9dBFS)
  const yellowBorder = 55 // next 25% = yellow zone (-20dBFS)

  return (
    <div style={{ width: 7, height: h, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: '#0e0' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${redBorder}%`, backgroundColor: '#e00' }} />
      <div style={{ position: 'absolute', top: `${redBorder}%`, left: 0, right: 0, height: `${yellowBorder - redBorder}%`, backgroundColor: '#ee0' }} />
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: coverH,
          backgroundColor: 'rgba(20,20,20,0.88)',
          transition: 'height 60ms linear',
        }}
      />
      {/* keep reference unused variable away */}
      <span style={{ display: 'none' }}>{pct}</span>
    </div>
  )
}

// ── Panning Slider ───────────────────────────────────────────────────────────
function PanningSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ position: 'relative', width: 80, height: 50, marginBottom: 10, flexShrink: 0 }}>
      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#999', marginBottom: 2, paddingTop: 2 }}>
        <span>L</span><span>C</span><span>R</span>
      </div>
      {/* Tick marks */}
      <svg width="80" height="8" style={{ display: 'block', marginBottom: 0 }}>
        {[0, 32, 64, 96, 128].map((x) => (
          <line key={x} x1={x * 80 / 128} y1="0" x2={x * 80 / 128} y2="6" stroke="#666" strokeWidth="1" />
        ))}
      </svg>
      <input
        type="range" min={0} max={128} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 2, left: 2,
          width: 78, height: 5,
          background: '#d3d3d3',
          outline: 'none', opacity: 0.8,
          accentColor: '#04aa6d',
        }}
      />
    </div>
  )
}

// ── Input Fields (Slot / Mode / Channels) ────────────────────────────────────
function StripFields({ strip, onUpdate }: { strip: Strip; onUpdate: (patch: Partial<Strip>) => void }) {
  const sel: React.CSSProperties = {
    background: '#3a3b3d', border: '1px solid #555', color: '#ccc',
    borderRadius: 3, padding: '2px 4px', fontSize: 11, width: 70,
  }
  const lbl: React.CSSProperties = { fontSize: 11, color: '#999', marginBottom: 2 }
  const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }

  return (
    <div style={{ padding: '6px 12px 4px' }}>
      <div style={row}>
        <span style={lbl}>Slot</span>
        <input
          type="number" min={1} max={8} value={strip.slot}
          onChange={(e) => onUpdate({ slot: Number(e.target.value) })}
          style={{ ...sel, width: 50 }}
        />
      </div>
      <div style={row}>
        <span style={lbl}>Mode</span>
        <select value={strip.mode} onChange={(e) => onUpdate({ mode: e.target.value as Mode })} style={sel}>
          <option>Stereo</option>
          <option>Mono</option>
        </select>
      </div>
      {strip.mode === 'Stereo' ? (
        <>
          <div style={row}>
            <span style={lbl}>Left Ch</span>
            <select value={strip.leftCh} onChange={(e) => onUpdate({ leftCh: Number(e.target.value) })} style={{ ...sel, width: 50 }}>
              {[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div style={row}>
            <span style={lbl}>Right Ch</span>
            <select value={strip.rightCh} onChange={(e) => onUpdate({ rightCh: Number(e.target.value) })} style={{ ...sel, width: 50 }}>
              {[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </>
      ) : (
        <div style={row}>
          <span style={lbl}>Mono Ch</span>
          <select value={strip.leftCh} onChange={(e) => onUpdate({ leftCh: Number(e.target.value) })} style={{ ...sel, width: 50 }}>
            {[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}

// ── Channel Strip ────────────────────────────────────────────────────────────
interface StripProps {
  strip: Strip
  onUpdate: (id: number, patch: Partial<Strip>) => void
  onDelete: (id: number) => void
}

function ChannelStrip({ strip, onUpdate, onDelete }: StripProps) {
  const upd = (patch: Partial<Strip>) => onUpdate(strip.id, patch)

  const btnBase: React.CSSProperties = {
    border: 'none', borderRadius: 4, color: '#fff',
    fontSize: 11, fontWeight: 'bold', padding: '6px 10px',
    cursor: 'pointer', letterSpacing: 1, width: '100%',
    marginBottom: 5,
  }

  return (
    <div style={{
      minWidth: 180,
      backgroundColor: '#2b2c2e',
      border: strip.selected ? '1px solid #aaa' : '1px solid transparent',
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      {/* Strip header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 10px 4px', color: '#a9a9a9', fontSize: 11,
      }}>
        <span>Strip #{strip.id}</span>
        <button
          onClick={() => onDelete(strip.id)}
          style={{ background: 'none', border: 'none', color: '#e55', cursor: 'pointer', fontSize: 14, padding: 0 }}
        >🗑</button>
      </div>

      {/* Label input */}
      <div style={{ padding: '0 10px 6px' }}>
        <input
          type="text" value={strip.label}
          onChange={(e) => upd({ label: e.target.value })}
          style={{
            width: '100%', boxSizing: 'border-box',
            backgroundColor: '#f9fada', border: 'none', borderRadius: 3,
            padding: '4px 8px', fontSize: 12, color: '#333', textAlign: 'center',
          }}
        />
      </div>

      {/* Input fields */}
      <StripFields strip={strip} onUpdate={upd} />

      {/* Meters + panning/buttons (side by side) */}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', padding: '0 8px', marginBottom: 8 }}>
        {/* L/R level meters */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
          <LevelMeter level={strip.muted ? 0 : strip.levelL} />
          <LevelMeter level={strip.muted ? 0 : (strip.mode === 'Stereo' ? strip.levelR : 0)} />
        </div>

        {/* Panning + action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 0 }}>
          <PanningSlider value={strip.pan} onChange={(v) => upd({ pan: v })} />
          <button
            onClick={() => upd({ selected: !strip.selected })}
            style={{ ...btnBase, backgroundColor: strip.selected ? '#63b65f' : '#4a4b4d' }}
          >SELECT</button>
          <button
            onClick={() => upd({ muted: !strip.muted })}
            style={{ ...btnBase, backgroundColor: strip.muted ? '#b15f5f' : '#4a4b4d' }}
          >MUTE</button>
          <button
            onClick={() => upd({ pfl: !strip.pfl })}
            style={{ ...btnBase, backgroundColor: strip.pfl ? '#b6b15f' : '#4a4b4d', marginBottom: 0 }}
          >PFL</button>
        </div>
      </div>

      {/* Volume fader + dB legend */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 4px 12px' }}>
        <SliderLegend />
        <div style={{ position: 'relative', width: 72, height: 280 }}>
          <input
            type="range" min={0} max={127} step={1}
            value={strip.volume}
            onChange={(e) => upd({ volume: Number(e.target.value) })}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              width: 280, height: 5,
              left: -96, top: 139,
              transform: 'rotate(-90deg)',
              outline: 'none', opacity: 0.85,
              accentColor: '#04aa6d',
            }}
          />
        </div>
      </div>

      {/* dB readout */}
      <div style={{ textAlign: 'center', fontSize: 10, color: '#a9a9a9', paddingBottom: 8, marginTop: -8 }}>
        {posToDb(strip.volume)}
      </div>
    </div>
  )
}

// ── SideNav ──────────────────────────────────────────────────────────────────
interface SideNavProps {
  open: boolean
  active: NavSection
  onSection: (s: NavSection) => void
  onToggle: () => void
  wsConnected: boolean
  onAddStrip: () => void
  onExport: () => void
  onImport: () => void
}

function SideNav({ open, active, onSection, onToggle, wsConnected, onAddStrip, onExport, onImport }: SideNavProps) {
  const navBtn = (section: NavSection, icon: string, label: string) => (
    <button
      key={section}
      onClick={() => onSection(section)}
      title={label}
      style={{
        width: '100%', background: active === section ? '#3f3f46' : 'none',
        border: 'none', color: active === section ? '#fff' : '#a1a1aa',
        padding: open ? '12px 16px' : '12px 0',
        cursor: 'pointer', fontSize: 13,
        display: 'flex', alignItems: 'center',
        justifyContent: open ? 'flex-start' : 'center',
        gap: 12, borderRadius: 6, marginBottom: 2,
        transition: 'background 0.15s',
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      {open && <span style={{ fontSize: 13 }}>{label}</span>}
    </button>
  )

  const bottomBtn = (icon: string, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: '100%', background: 'none', border: 'none',
        color: '#a1a1aa', padding: open ? '10px 16px' : '10px 0',
        cursor: 'pointer', fontSize: 13,
        display: 'flex', alignItems: 'center',
        justifyContent: open ? 'flex-start' : 'center',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {open && <span>{label}</span>}
    </button>
  )

  return (
    <div style={{
      width: open ? 300 : 80,
      flexShrink: 0,
      backgroundColor: '#27272a',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease',
      borderRight: '1px solid #3f3f46',
      overflow: 'hidden',
      height: '100%',
    }}>
      {/* Hamburger */}
      <div style={{
        display: 'flex', flexDirection: open ? 'row-reverse' : 'column',
        alignItems: 'center', justifyContent: 'space-between',
        height: 80, padding: '8px',
      }}>
        <button
          onClick={onToggle}
          style={{
            background: 'none', border: 'none', color: '#fff',
            cursor: 'pointer', fontSize: 22, padding: 8,
            borderRadius: 8, minWidth: 44, minHeight: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >☰</button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px 8px 0' }}>
        {navBtn('strips', '🎚', 'Strips')}
        {navBtn('mixes', '🎛', 'Mixes')}
        {navBtn('outputs', '↔', 'Outputs')}

        {active === 'strips' && (
          <button
            onClick={onAddStrip}
            title="Add Strip"
            style={{
              width: '100%', background: 'none', border: 'none',
              borderTop: '1px solid #3f3f46', color: '#63b65f',
              padding: open ? '10px 16px' : '10px 0', cursor: 'pointer',
              fontSize: 13, marginTop: 8,
              display: 'flex', alignItems: 'center',
              justifyContent: open ? 'flex-start' : 'center', gap: 12,
            }}
          >
            <span style={{ fontSize: 18 }}>＋</span>
            {open && <span>Add Strip</span>}
          </button>
        )}
      </nav>

      {/* Bottom items */}
      <div style={{ borderTop: '1px solid #3f3f46', padding: '8px' }}>
        {bottomBtn('⬇', 'Export', onExport)}
        {bottomBtn('⬆', 'Import', onImport)}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          gap: 10, padding: open ? '8px 16px' : '8px 0',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: wsConnected ? '#63b65f' : '#b15f5f', flexShrink: 0,
          }} />
          {open && <span style={{ fontSize: 11, color: '#a1a1aa' }}>{wsConnected ? 'Connected' : 'Disconnected'}</span>}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export function AudioEyevinnPage() {
  const [navOpen, setNavOpen] = useState(true)
  const [navSection, setNavSection] = useState<NavSection>('strips')
  const [strips, setStrips] = useState<Strip[]>(INITIAL_STRIPS)
  const nextId = useRef(INITIAL_STRIPS.length + 1)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    animRef.current = setInterval(() => {
      setStrips((prev) =>
        prev.map((s) => ({
          ...s,
          levelL: s.muted ? 0 : Math.min(1, Math.max(0, s.levelL * 0.88 + Math.random() * 0.25)),
          levelR: s.muted ? 0 : Math.min(1, Math.max(0, s.levelR * 0.88 + Math.random() * 0.25)),
        }))
      )
    }, 60)
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [])

  const updateStrip = useCallback((id: number, patch: Partial<Strip>) => {
    setStrips((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const deleteStrip = useCallback((id: number) => {
    setStrips((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const addStrip = useCallback(() => {
    const id = nextId.current++
    setStrips((prev) => [...prev, makeStrip(id, `Channel ${id}`)])
  }, [])

  const handleExport = useCallback(() => {
    const data = JSON.stringify(
      strips.map(({ levelL: _l, levelR: _r, ...s }) => s), null, 2
    )
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    Object.assign(document.createElement('a'), { href: url, download: 'mixer.json' }).click()
    URL.revokeObjectURL(url)
  }, [strips])

  const importRef = useRef<HTMLInputElement>(null)
  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as Strip[]
        setStrips(parsed.map((s) => ({ ...s, levelL: 0, levelR: 0 })))
        nextId.current = Math.max(...parsed.map((s) => s.id)) + 1
      } catch { /* ignore */ }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: '#18181b', overflow: 'hidden' }}>
      <SideNav
        open={navOpen}
        active={navSection}
        onSection={setNavSection}
        onToggle={() => setNavOpen((o) => !o)}
        wsConnected={false}
        onAddStrip={addStrip}
        onExport={handleExport}
        onImport={() => importRef.current?.click()}
      />

      <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Page header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderBottom: '1px solid #27272a',
          color: '#fff', fontSize: 18, fontWeight: 600,
        }}>
          <span>
            {navSection === 'strips' && 'Audio Strips'}
            {navSection === 'mixes' && 'Mixes'}
            {navSection === 'outputs' && 'Outputs'}
          </span>
          {navSection === 'strips' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => strips.length > 0 && setStrips([])}
                disabled={strips.length === 0}
                style={{
                  background: strips.length === 0 ? '#3f3f46' : '#7f1d1d',
                  color: strips.length === 0 ? '#666' : '#fff',
                  border: 'none', borderRadius: 6, padding: '7px 14px',
                  cursor: strips.length === 0 ? 'not-allowed' : 'pointer', fontSize: 13,
                }}
              >Delete all strips</button>
              <button
                onClick={addStrip}
                style={{
                  backgroundColor: '#16a34a', color: '#fff',
                  border: 'none', borderRadius: 6, padding: '7px 14px',
                  cursor: 'pointer', fontSize: 13,
                }}
              >Create Strip</button>
            </div>
          )}
        </div>

        {/* Strip scroll area */}
        {navSection === 'strips' && (
          <div style={{
            flex: 1, overflowX: 'auto', overflowY: 'auto',
            padding: '16px 16px',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            {strips.length === 0 && (
              <div style={{ color: '#71717a', fontSize: 13, margin: '40px auto' }}>
                No strips. Click "Create Strip" to add one.
              </div>
            )}
            {strips.map((strip) => (
              <ChannelStrip key={strip.id} strip={strip} onUpdate={updateStrip} onDelete={deleteStrip} />
            ))}
          </div>
        )}

        {(navSection === 'mixes' || navSection === 'outputs') && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', fontSize: 13 }}>
            {navSection === 'mixes' ? 'Mixes' : 'Outputs'} — not yet configured
          </div>
        )}
      </div>
    </div>
  )
}
