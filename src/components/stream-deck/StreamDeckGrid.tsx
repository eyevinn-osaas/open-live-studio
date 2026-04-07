import { StreamDeckButton } from './StreamDeckButton'
import { useStreamDeckStore } from '@/store/stream-deck.store'
import { useProductionStore } from '@/store/production.store'
import { useGraphicsStore } from '@/store/graphics.store'
import type { ButtonAction } from '@/store/stream-deck.store'

function isButtonActive(action: ButtonAction, pgmSourceId: string | null, pvwSourceId: string | null, activeOverlayIds: string[]): boolean {
  switch (action.type) {
    case 'pvw': return action.sourceId === pvwSourceId
    case 'graphic-toggle': return activeOverlayIds.includes(action.graphicId)
    default: return false
  }
}

export function StreamDeckGrid() {
  const { buttonMap, lastPressedIndex } = useStreamDeckStore()
  const { pgmSourceId, pvwSourceId, cut, take, setPvw, setTransitionType, setLive, isLive } = useProductionStore()
  const { toggleOverlay, activeOverlayIds } = useGraphicsStore()

  function handleButtonClick(index: number) {
    const btn = buttonMap.find((b) => b.index === index)
    if (!btn) return
    const action = btn.action
    switch (action.type) {
      case 'cut': cut(); break
      case 'take': take(); break
      case 'pvw': setPvw(action.sourceId); break
      case 'go-live': setLive(!isLive); break
      case 'transition': setTransitionType(action.mode); break
      case 'graphic-toggle': toggleOverlay(action.graphicId); break
    }
  }

  // 5 columns × 3 rows = 15 buttons
  const COLS = 5
  const ROWS = 3

  return (
    <div
      className="grid gap-1.5 p-2"
      style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
    >
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const btn = buttonMap.find((b) => b.index === i)
        if (!btn) return (
          <div key={i} className="aspect-square rounded bg-[--color-surface-3] border border-[--color-border]" />
        )
        return (
          <StreamDeckButton
            key={i}
            button={btn}
            isPressed={lastPressedIndex === i}
            isActive={isButtonActive(btn.action, pgmSourceId, pvwSourceId, activeOverlayIds)}
            onClick={() => handleButtonClick(i)}
          />
        )
      })}
    </div>
  )
}
