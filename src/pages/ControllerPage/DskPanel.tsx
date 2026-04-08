import { useState } from 'react'
import { cn } from '@/lib/cn'

interface DskPanelProps {
  onToggle: (layer: number, visible: boolean) => void
}

export function DskPanel({ onToggle }: DskPanelProps) {
  const [dsk1, setDsk1] = useState(false)
  const [dsk2, setDsk2] = useState(false)

  const toggle = (layer: number) => {
    if (layer === 0) {
      const next = !dsk1
      setDsk1(next)
      onToggle(0, next)
    } else {
      const next = !dsk2
      setDsk2(next)
      onToggle(1, next)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-[--color-surface-3] rounded-xl border border-[--color-border]">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[--color-text-muted]">DSK</span>
      <div className="flex gap-2">
        {[{ label: 'DSK 1', active: dsk1, layer: 0 }, { label: 'DSK 2', active: dsk2, layer: 1 }].map(({ label, active, layer }) => (
          <button
            key={layer}
            onClick={() => toggle(layer)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border',
              active
                ? 'bg-[--color-pgm] text-white border-[--color-pgm]'
                : 'bg-[--color-surface-raised] text-[--color-text-muted] border-[--color-border] hover:border-[--color-border-strong]',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
