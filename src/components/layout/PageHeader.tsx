import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-5 py-3 border-b border-[--color-border]', className)}>
      <div>
        <h1 className="text-sm font-semibold text-[--color-text-primary] uppercase tracking-widest">{title}</h1>
        {subtitle && <p className="text-xs text-[--color-text-muted] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
