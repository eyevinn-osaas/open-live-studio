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
    <div className={cn(
      'flex items-center justify-between px-6 py-4 border-b border-[--color-border]',
      className,
    )}>
      <div>
        <h1 className="text-xl font-bold text-[--color-text-primary]">{title}</h1>
        {subtitle && <p className="text-xs text-[--color-text-muted] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
