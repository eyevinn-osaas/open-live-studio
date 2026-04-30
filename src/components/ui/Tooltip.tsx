import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)

  const show = useCallback(() => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setPos({ top: r.top + window.scrollY, left: r.left + r.width / 2 + window.scrollX })
    setVisible(true)
  }, [])

  const hide = useCallback(() => setVisible(false), [])

  return (
    <>
      <span ref={triggerRef} onMouseEnter={show} onMouseLeave={hide} className={className}>
        {children}
      </span>
      {visible && createPortal(
        <div
          className="pointer-events-none fixed z-[9999]"
          style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)' }}
        >
          <div className="mb-2">
            {content}
          </div>
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-zinc-800 border-r border-b border-zinc-600 rotate-45 -mt-3" />
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
