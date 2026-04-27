import { useGraphicsStore } from '@/store/graphics.store'
import { useProductionsStore } from '@/store/productions.store'
import { useProductionStore } from '@/store/production.store'

const DSK_LABELS: Record<string, string> = {
  dsk_in_0: 'DSK 1',
  dsk_in_1: 'DSK 2',
}

export function GraphicsPanel() {
  const graphics = useGraphicsStore((s) => s.graphics)
  const activeProductionId = useProductionStore((s) => s.activeProductionId)
  const production = useProductionsStore((s) => s.productions.find((p) => p.id === activeProductionId))
  const assignments = production?.graphicAssignments ?? []

  if (assignments.length === 0) return null

  return (
    <div className="flex flex-col gap-2 p-3 bg-[--color-surface-3] rounded-xl border border-[--color-border]">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[--color-text-muted]">Graphics</span>
      <div className="flex flex-col gap-1">
        {assignments.map((a) => {
          const graphic = graphics.find((g) => g.id === a.graphicId)
          return (
            <div key={a.dskInput} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[--color-surface-raised] border border-[--color-border]">
              <span className="text-[10px] font-mono text-[--color-text-muted] w-10 shrink-0">
                {DSK_LABELS[a.dskInput] ?? a.dskInput}
              </span>
              <span className="text-xs text-[--color-text-primary] truncate">
                {graphic?.name ?? a.graphicId}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
