import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSourcesStore } from '@/store/sources.store'
import { PageHeader } from '@/components/layout/PageHeader'
import { MultiviewCell } from './MultiviewCell'
import { cn } from '@/lib/cn'

type GridSize = '2x2' | '3x3' | '4x4'

const GRID_COLS: Record<GridSize, number> = { '2x2': 2, '3x3': 3, '4x4': 4 }
const GRID_MAX: Record<GridSize, number> = { '2x2': 4, '3x3': 9, '4x4': 16 }

const LS_KEY = 'openlive:multiviewer-grid'

export function MultiviewerPage() {
  const [gridSize, setGridSize] = useState<GridSize>(() => {
    const saved = localStorage.getItem(LS_KEY)
    return (saved as GridSize | null) ?? '2x2'
  })

  useEffect(() => {
    localStorage.setItem(LS_KEY, gridSize)
  }, [gridSize])

  const sources = useSourcesStore(useShallow((s) =>
    s.sources.filter((src) => src.status !== 'disconnected').slice(0, GRID_MAX[gridSize]),
  ))

  const cols = GRID_COLS[gridSize]
  const maxCells = GRID_MAX[gridSize]
  const emptyCells = Math.max(0, maxCells - sources.length)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Multiviewer"
        subtitle="Multi-source monitoring with tally lights"
        actions={
          <div className="flex gap-1">
            {(['2x2', '3x3', '4x4'] as GridSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-mono uppercase transition-colors',
                  gridSize === size
                    ? 'bg-[--color-accent] text-white'
                    : 'bg-[--color-surface-3] text-[--color-text-muted] hover:text-white',
                )}
              >
                {size}
              </button>
            ))}
          </div>
        }
      />

      {/* Grid — black gaps between cells (broadcast convention) */}
      <div className="flex-1 overflow-auto bg-black p-px">
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {sources.map((src) => (
            <MultiviewCell key={src.id} source={src} />
          ))}
          {Array.from({ length: emptyCells }, (_, i) => (
            <div
              key={`empty-${i}`}
              className="aspect-video bg-zinc-950 flex items-center justify-center"
            >
              <span className="text-zinc-700 text-xs font-mono uppercase tracking-widest">No Source</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
