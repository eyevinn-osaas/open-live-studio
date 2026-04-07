import { cn } from '@/lib/cn'
import type { ChangeEvent } from 'react'

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  error?: string | null
  className?: string
  readOnly?: boolean
}

export function JsonEditor({ value, onChange, error, className, readOnly = false }: JsonEditorProps) {
  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value)
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <textarea
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        spellCheck={false}
        className={cn(
          'w-full h-full min-h-[300px] p-3 rounded font-mono text-xs',
          'bg-[--color-surface-raised] text-[--color-text-primary] border resize-none',
          'focus:outline-none focus:ring-1 focus:ring-[--color-accent]',
          error ? 'border-red-600' : 'border-[--color-border-strong]',
        )}
      />
      {error && (
        <p className="text-red-400 text-xs font-mono px-1">{error}</p>
      )}
    </div>
  )
}
