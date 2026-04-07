import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProgramOutput } from './ProgramOutput'
import { MultiviewGrid } from './MultiviewGrid'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

type ViewMode = 'program' | 'multiview' | 'both'
type GridSize = '2x2' | '3x3' | '4x4'

export function ViewerPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('both')
  const [gridSize, setGridSize] = useState<GridSize>('2x2')

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Viewer"
        subtitle="Program output and multiview monitoring"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {(['program', 'both', 'multiview'] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-mono uppercase transition-colors',
                    viewMode === m
                      ? 'bg-[--color-accent] text-white'
                      : 'bg-[--color-surface-3] text-[--color-text-muted] hover:text-white',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            {(viewMode === 'multiview' || viewMode === 'both') && (
              <select
                value={gridSize}
                onChange={(e) => setGridSize(e.target.value as GridSize)}
                className="px-2 py-1 rounded bg-[--color-surface-3] border border-[--color-border] text-xs text-[--color-text-primary] focus:outline-none"
              >
                <option value="2x2">2×2</option>
                <option value="3x3">3×3</option>
                <option value="4x4">4×4</option>
              </select>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {(viewMode === 'program' || viewMode === 'both') && (
          <ProgramOutput />
        )}
        {(viewMode === 'multiview' || viewMode === 'both') && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[--color-text-muted]">Multiview</span>
            <MultiviewGrid gridSize={gridSize} />
          </div>
        )}
      </div>
    </div>
  )
}
