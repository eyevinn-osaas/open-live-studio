import { cn } from '@/lib/cn'
import type { StreamDeckButton as StreamDeckButtonType } from '@/store/stream-deck.store'

interface StreamDeckButtonProps {
  button: StreamDeckButtonType
  isPressed?: boolean
  isActive?: boolean
  onClick?: () => void
}

export function StreamDeckButton({ button, isPressed = false, isActive = false, onClick }: StreamDeckButtonProps) {
  return (
    <button
      onClick={onClick}
      title={`${button.label}${button.sublabel ? ` — ${button.sublabel}` : ''}`}
      className={cn(
        'aspect-square w-full flex flex-col items-center justify-center gap-0.5 rounded',
        'border transition-all duration-75 select-none',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[--color-accent]',
        isPressed && 'scale-95 brightness-75',
        isActive
          ? 'border-[--color-accent] brightness-125'
          : 'border-[--color-border] hover:brightness-110',
      )}
      style={{ backgroundColor: button.color }}
    >
      <span className="text-white text-[10px] font-bold font-mono leading-tight text-center px-1 uppercase tracking-wider">
        {button.label}
      </span>
      {button.sublabel && (
        <span className="text-white/60 text-[8px] font-mono leading-tight text-center px-1 truncate w-full uppercase">
          {button.sublabel}
        </span>
      )}
    </button>
  )
}
