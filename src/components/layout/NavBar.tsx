import { NavLink } from 'react-router'
import { cn } from '@/lib/cn'
import { useProductionStore } from '@/store/production.store'
import { ConnectionStatus } from '@/components/ui/ConnectionStatus'

const NAV_ITEMS = [
  { to: '/setup',         label: 'Setup',    icon: '⚙' },
  { to: '/controller',    label: 'Control',  icon: '🎬' },
  { to: '/audio/console', label: 'Console',  icon: '🎚' },
  { to: '/audio/grid',    label: 'Grid',     icon: '🎛' },
  { to: '/audio/monitor', label: 'Monitor',  icon: '📊' },
  { to: '/audio/eyevinn', label: 'Eyevinn',  icon: '🎙' },
]

export function NavBar() {
  const isLive = useProductionStore((s) => s.isLive)

  return (
    <nav className="flex flex-col items-stretch w-16 bg-[--color-surface-2] border-r border-[--color-border] flex-shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center justify-center border-b border-[--color-border]">
        <span className="text-[--color-accent] font-bold text-sm font-mono">OL</span>
      </div>

      {/* Nav items */}
      <div className="flex-1 flex flex-col gap-1 p-1.5 pt-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 py-3 rounded text-[10px] font-medium transition-all',
                isActive
                  ? 'bg-[--color-accent] text-[--color-text-dark]'
                  : 'text-[--color-text-muted] hover:text-[--color-text-primary] hover:bg-[rgba(89,203,232,0.1)]',
              )
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Bottom: ON AIR when live, connection status always */}
      <div className="p-1.5 pb-5 flex flex-col gap-2">
        {isLive && (
          <div className="w-full py-1.5 rounded text-[9px] font-mono font-bold text-center uppercase tracking-widest bg-[--color-live] text-white animate-pulse">
            ON AIR
          </div>
        )}
        <ConnectionStatus />
      </div>
    </nav>
  )
}
