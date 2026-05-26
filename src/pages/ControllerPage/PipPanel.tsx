import { useState, useRef, useCallback, useEffect } from 'react'
import { useProductionStore, type PipConfig, type PipZone } from '@/store/production.store'
import { useProductionsStore } from '@/store/productions.store'
import { useSourcesStore } from '@/store/sources.store'
import { cn } from '@/lib/cn'

interface PipPanelProps {
  onApply: (pipIdx: number, config: PipConfig) => void
  className?: string
}

const ZONE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899']

const HANDLE_POSITIONS: Record<string, React.CSSProperties> = {
  n:  { top: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
  ne: { top: -5, right: -5, cursor: 'ne-resize' },
  e:  { top: '50%', transform: 'translateY(-50%)', right: -5, cursor: 'e-resize' },
  se: { bottom: -5, right: -5, cursor: 'se-resize' },
  s:  { bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
  sw: { bottom: -5, left: -5, cursor: 'sw-resize' },
  w:  { top: '50%', transform: 'translateY(-50%)', left: -5, cursor: 'w-resize' },
  nw: { top: -5, left: -5, cursor: 'nw-resize' },
}
const HANDLES = Object.keys(HANDLE_POSITIONS) as Array<keyof typeof HANDLE_POSITIONS>

type DragState = {
  type: 'move' | 'resize'
  zoneIdx: number
  handle: string | null
  startX: number
  startY: number
  startRect: { x: number; y: number; w: number; h: number }
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

export function PipPanel({ onApply, className }: PipPanelProps) {
  const { pgmPip, pvwPip, pips, activeProductionId } = useProductionStore()
  const production = useProductionsStore((s) => s.productions.find((p) => p.id === activeProductionId))
  const sources = useSourcesStore((s) => s.sources)

  const [editingPipIdx, setEditingPipIdx] = useState(0)
  const [draft, setDraft] = useState<PipConfig>({ bg: null, zones: [] })
  const [activeZoneIdx, setActiveZoneIdx] = useState(0)
  const isDirtyRef = useRef(false)

  // Sync draft from server pips (only when not dirty)
  useEffect(() => {
    if (isDirtyRef.current) return
    const pip = pips[editingPipIdx]
    setDraft(pip ? structuredClone(pip) : { bg: null, zones: [] })
    setActiveZoneIdx(0)
  }, [pips, editingPipIdx])

  // Input slots: same pattern as TransitionPanel
  const VIRTUAL_SOURCE_NAMES: Record<string, string> = { '__test1__': 'PINWHEEL', '__test2__': 'COLORS' }
  const inputSlots = [...(production?.sources ?? [])]
    .sort((a, b) => a.mixerInput.localeCompare(b.mixerInput))
    .map((a, idx) => {
      const src = sources.find((s) => s.id === a.sourceId)
      const name = (src?.name ?? VIRTUAL_SOURCE_NAMES[a.sourceId] ?? a.sourceId).toUpperCase().slice(0, 8)
      return { idx, name }
    })

  const markDirty = () => { isDirtyRef.current = true }

  const isUsedAsBg = (idx: number) => draft.bg === idx
  const isInAnyZone = (idx: number) => draft.zones.some((z) => z.sources.includes(idx))
  const isInActiveZone = (idx: number) => (draft.zones[activeZoneIdx]?.sources ?? []).includes(idx)

  const toggleSource = (inputIdx: number) => {
    if (isUsedAsBg(inputIdx)) return
    markDirty()
    setDraft((prev) => {
      const next = structuredClone(prev)
      const zone = next.zones[activeZoneIdx]
      if (!zone) return prev
      const existingIdx = zone.sources.indexOf(inputIdx)
      if (existingIdx >= 0) {
        zone.sources.splice(existingIdx, 1)
      } else {
        // Remove from any other zone first (input can only be in one place)
        for (const z of next.zones) {
          const i = z.sources.indexOf(inputIdx)
          if (i >= 0) z.sources.splice(i, 1)
        }
        // FIFO evict if at capacity
        if (zone.capacity !== null && zone.sources.length >= zone.capacity) {
          zone.sources.shift()
        }
        zone.sources.push(inputIdx)
      }
      return next
    })
  }

  const handleSourceClick = (inputIdx: number) => {
    if (isUsedAsBg(inputIdx)) return
    if (draft.zones.length === 0) {
      // No zones yet — create a full-screen zone and add this source to it
      markDirty()
      setDraft((prev) => ({
        ...prev,
        zones: [{ rect: { x: 0, y: 0, w: 1, h: 1 }, capacity: null, sources: [inputIdx] }],
      }))
      setActiveZoneIdx(0)
    } else {
      toggleSource(inputIdx)
    }
  }

  const setBg = (inputIdx: number | null) => {
    markDirty()
    setDraft((prev) => {
      const next = structuredClone(prev)
      if (inputIdx !== null) {
        for (const z of next.zones) {
          const i = z.sources.indexOf(inputIdx)
          if (i >= 0) z.sources.splice(i, 1)
        }
      }
      next.bg = inputIdx
      return next
    })
  }

  const addZone = () => {
    markDirty()
    const newIdx = draft.zones.length
    setDraft((prev) => {
      const next = structuredClone(prev)
      next.zones.push({ rect: { x: 0.55, y: 0.10, w: 0.42, h: 0.42 }, capacity: null, sources: [] })
      return next
    })
    setActiveZoneIdx(newIdx)
  }

  const removeZone = (zoneIdx: number) => {
    markDirty()
    setDraft((prev) => {
      const next = structuredClone(prev)
      next.zones.splice(zoneIdx, 1)
      return next
    })
    setActiveZoneIdx((prev) => Math.max(0, Math.min(prev, draft.zones.length - 2)))
  }

  const setZoneCapacity = (zoneIdx: number, cap: number | null) => {
    markDirty()
    setDraft((prev) => {
      const next = structuredClone(prev)
      const zone = next.zones[zoneIdx]
      if (!zone) return prev
      zone.capacity = cap
      if (cap !== null && zone.sources.length > cap) {
        zone.sources.splice(0, zone.sources.length - cap)
      }
      return next
    })
  }

  // Drag state
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const startDrag = useCallback((e: React.MouseEvent, zoneIdx: number, handle: string | null) => {
    e.stopPropagation()
    e.preventDefault()
    setActiveZoneIdx(zoneIdx)
    const zone = draft.zones[zoneIdx]
    if (!zone?.rect) return
    dragRef.current = {
      type: handle ? 'resize' : 'move',
      zoneIdx,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...zone.rect },
    }
  }, [draft.zones])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current
      const canvas = canvasRef.current
      if (!drag || !canvas) return
      const rect = canvas.getBoundingClientRect()
      const dx = (e.clientX - drag.startX) / rect.width
      const dy = (e.clientY - drag.startY) / rect.height
      const r = drag.startRect
      setDraft((prev) => {
        const next = structuredClone(prev)
        const zone = next.zones[drag.zoneIdx]
        if (!zone?.rect) return prev
        if (drag.type === 'move') {
          zone.rect.x = clamp(r.x + dx, 0, 1 - zone.rect.w)
          zone.rect.y = clamp(r.y + dy, 0, 1 - zone.rect.h)
        } else {
          const h = drag.handle ?? ''
          if (h.includes('e')) zone.rect.w = clamp(r.w + dx, 0.05, 1 - zone.rect.x)
          if (h.includes('s')) zone.rect.h = clamp(r.h + dy, 0.05, 1 - zone.rect.y)
          if (h.includes('w')) {
            const newX = clamp(r.x + dx, 0, r.x + r.w - 0.05)
            zone.rect.w = r.x + r.w - newX
            zone.rect.x = newX
          }
          if (h.includes('n')) {
            const newY = clamp(r.y + dy, 0, r.y + r.h - 0.05)
            zone.rect.h = r.y + r.h - newY
            zone.rect.y = newY
          }
        }
        return next
      })
      isDirtyRef.current = true
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  if (pips.length === 0) {
    return (
      <div className="p-4 text-zinc-500 text-xs text-center">
        No PiP slots in this flow.
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2 p-2 border border-zinc-800 bg-zinc-950', className)}>
      {/* PiP tab selector */}
      {pips.length > 1 && (
        <div className="flex gap-1">
          {pips.map((_, i) => (
            <button
              key={i}
              onClick={() => { setEditingPipIdx(i); isDirtyRef.current = false }}
              className={cn(
                'px-2 py-0.5 text-[10px] font-bold border',
                editingPipIdx === i
                  ? 'bg-orange-500 text-black border-orange-400'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-200',
              )}
            >
              PiP {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Canvas + right panel side by side */}
      <div className="flex gap-2">
        {/* Zone canvas */}
        <div
          ref={canvasRef}
          className="relative select-none overflow-hidden shrink-0"
          style={{ width: 420, aspectRatio: '16/9', background: '#111', border: '1px solid #3f3f46' }}
        >
          {draft.zones.map((zone, zIdx) => {
            const r = zone.rect ?? { x: 0, y: 0, w: 1, h: 1 }
            const isActive = zIdx === activeZoneIdx
            const color = ZONE_COLORS[zIdx % ZONE_COLORS.length]!
            return (
              <div
                key={zIdx}
                style={{
                  position: 'absolute',
                  left: `${r.x * 100}%`,
                  top: `${r.y * 100}%`,
                  width: `${r.w * 100}%`,
                  height: `${r.h * 100}%`,
                  border: `2px solid ${color}`,
                  background: isActive ? `${color}33` : `${color}11`,
                  cursor: 'move',
                  boxSizing: 'border-box',
                }}
                onMouseDown={(e) => startDrag(e, zIdx, null)}
              >
                <div
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    fontSize: 9, fontWeight: 700, padding: '1px 3px',
                    color, background: 'rgba(0,0,0,0.65)', lineHeight: 1.4,
                    pointerEvents: 'none',
                  }}
                >
                  Z{zIdx + 1}{zone.sources.length > 0 ? `: ${zone.sources.map((s) => s + 1).join(',')}` : ''}
                </div>
                {zone.rect === null && (
                  <div style={{ position: 'absolute', inset: 0, border: '1px dashed', borderColor: color, margin: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, color, opacity: 0.7 }}>AUTO</span>
                  </div>
                )}
                {isActive && HANDLES.map((h) => (
                  <div
                    key={h}
                    style={{
                      position: 'absolute',
                      width: 8, height: 8,
                      background: color,
                      border: '1px solid rgba(0,0,0,0.5)',
                      ...HANDLE_POSITIONS[h],
                    }}
                    onMouseDown={(e) => startDrag(e, zIdx, h)}
                  />
                ))}
              </div>
            )
          })}
          {draft.bg !== null && (
            <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 8, color: '#a1a1aa', background: 'rgba(0,0,0,0.6)', padding: '1px 4px' }}>
              BG: {(inputSlots[draft.bg]?.name ?? String(draft.bg + 1))}
            </div>
          )}
          {draft.zones.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] text-zinc-600">Click a source below to fill this PiP</span>
            </div>
          )}
        </div>

        {/* Right panel: background + zones + apply */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {/* Background picker */}
          <div>
            <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-0.5">Background</label>
            <select
              value={draft.bg ?? ''}
              onChange={(e) => { setBg(e.target.value === '' ? null : parseInt(e.target.value, 10)) }}
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] px-1 py-0.5 focus:outline-none"
            >
              <option value="">None</option>
              {inputSlots.map((slot) => (
                <option key={slot.idx} value={slot.idx} disabled={isInAnyZone(slot.idx)}>
                  {slot.name}
                </option>
              ))}
            </select>
          </div>

          {/* Zone list */}
          <div className="flex flex-col gap-0.5 flex-1 min-h-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Zones</span>
              <button
                onClick={addZone}
                className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200 hover:border-zinc-500"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              {draft.zones.map((zone, zIdx) => {
                const color = ZONE_COLORS[zIdx % ZONE_COLORS.length]!
                return (
                  <div
                    key={zIdx}
                    className={cn(
                      'flex items-center gap-0.5 px-1 py-0.5 border cursor-pointer',
                      zIdx === activeZoneIdx ? 'border-orange-500 bg-zinc-800' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600',
                    )}
                    onClick={() => setActiveZoneIdx(zIdx)}
                  >
                    <div style={{ width: 6, height: 6, background: color, borderRadius: 1, flexShrink: 0 }} />
                    <span className="text-[9px] text-zinc-400 font-bold">Z{zIdx + 1}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="∞"
                      value={zone.capacity ?? ''}
                      onChange={(e) => {
                        e.stopPropagation()
                        const v = e.target.value === '' ? null : parseInt(e.target.value, 10)
                        setZoneCapacity(zIdx, Number.isFinite(v) ? v : null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-6 bg-transparent border-0 text-zinc-300 text-[9px] text-center focus:outline-none"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeZone(zIdx) }}
                      className="ml-auto text-[9px] text-zinc-600 hover:text-red-400 leading-none px-0.5"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Apply — pinned to bottom of canvas-height-constrained right panel */}
          <div className="flex justify-end mt-auto">
            <button
              onClick={() => { onApply(editingPipIdx, draft); isDirtyRef.current = false }}
              className="px-3 py-1 text-[10px] font-bold bg-orange-500 text-black border border-orange-400 hover:bg-orange-400 uppercase tracking-widest"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Source chips — always visible; clicking when no zones creates a full-screen zone */}
      <div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
          {draft.zones.length === 0 ? 'Sources' : `Sources → Zone ${activeZoneIdx + 1}`}
        </span>
        <div className="flex flex-wrap gap-1">
          {inputSlots.map((slot) => {
            const inActive = isInActiveZone(slot.idx)
            const asBg = isUsedAsBg(slot.idx)
            const inOther = !inActive && !asBg && isInAnyZone(slot.idx)
            return (
              <button
                key={slot.idx}
                onClick={() => handleSourceClick(slot.idx)}
                disabled={asBg}
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-bold border',
                  inActive
                    ? 'bg-orange-500 text-black border-orange-400'
                    : asBg
                      ? 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed'
                      : inOther
                        ? 'bg-zinc-900 text-zinc-600 border-zinc-700 italic'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white',
                )}
              >
                {slot.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
