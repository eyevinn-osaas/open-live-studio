import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'default' | 'pgm' | 'pvw' | 'ghost' | 'danger' | 'active'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-[--color-surface-3] hover:bg-zinc-700 border border-[--color-border] text-[--color-text-primary]',
  pgm:     'bg-[--color-pgm] hover:bg-red-700 text-white font-bold border border-red-800',
  pvw:     'bg-[--color-pvw] hover:bg-green-700 text-white font-bold border border-green-800',
  ghost:   'bg-transparent hover:bg-[--color-surface-3] border border-transparent text-[--color-text-muted] hover:text-[--color-text-primary]',
  danger:  'bg-red-900 hover:bg-red-800 border border-red-700 text-red-100',
  active:  'bg-[--color-accent] hover:bg-indigo-500 border border-indigo-400 text-white',
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export function Button({ variant = 'default', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent]',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
