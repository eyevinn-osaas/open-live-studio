import { useState } from 'react'
import { useGraphicsStore } from '@/store/graphics.store'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { GraphicOverlay } from '@/mock/graphics'

function OverlayCard({ overlay }: { overlay: GraphicOverlay }) {
  const { toggleOverlay, updateField, activeOverlayIds } = useGraphicsStore()
  const isActive = activeOverlayIds.includes(overlay.id)
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        'rounded border transition-colors',
        isActive ? 'border-[--color-accent] bg-indigo-950/30' : 'border-[--color-border] bg-[--color-surface-3]',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => toggleOverlay(overlay.id)}
          className={cn(
            'w-3 h-3 rounded-full border flex-shrink-0 transition-colors',
            isActive ? 'bg-[--color-accent] border-[--color-accent]' : 'border-zinc-500',
          )}
        />
        <span className="flex-1 text-sm font-medium truncate">{overlay.name}</span>
        <span className="text-[10px] font-mono text-[--color-text-muted] uppercase">{overlay.type.replace('-', ' ')}</span>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[--color-text-muted] hover:text-[--color-text-primary] text-xs px-1"
        >
          {expanded ? '▲' : '▼'}
        </button>
        <button
          onClick={() => toggleOverlay(overlay.id)}
          className={cn(
            'text-xs px-2 py-0.5 rounded border font-mono transition-colors',
            isActive
              ? 'bg-[--color-accent] border-indigo-400 text-white'
              : 'border-[--color-border] text-[--color-text-muted] hover:text-white',
          )}
        >
          {isActive ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Editable fields */}
      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-[--color-border] pt-2">
          {Object.entries(overlay.fields).map(([field, value]) => (
            <div key={field} className="flex items-center gap-2">
              <label className="text-[10px] text-[--color-text-muted] font-mono uppercase w-20 flex-shrink-0">{field}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => updateField(overlay.id, field, e.target.value)}
                className="flex-1 px-2 py-1 rounded bg-[--color-surface-1] border border-[--color-border] text-xs text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function GraphicsPanel() {
  const { overlays, activeOverlayIds } = useGraphicsStore()

  return (
    <div className="flex flex-col gap-2 p-3 bg-[--color-surface-2] rounded border border-[--color-border]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[--color-text-muted]">Graphics</span>
        <span className="text-[10px] font-mono text-[--color-text-muted]">{activeOverlayIds.length} active</span>
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-64">
        {overlays.map((overlay) => (
          <OverlayCard key={overlay.id} overlay={overlay} />
        ))}
      </div>
    </div>
  )
}
