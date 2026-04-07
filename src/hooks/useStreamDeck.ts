import { useEffect } from 'react'
import { isWebHIDSupported, parsePressedButtons } from '@/lib/webhid'
import { KeyedDebounce } from '@/lib/debounce'
import { useStreamDeckStore } from '@/store/stream-deck.store'
import { useProductionStore } from '@/store/production.store'
import { useGraphicsStore } from '@/store/graphics.store'
import type { ButtonAction } from '@/store/stream-deck.store'

const debounce = new KeyedDebounce()

/**
 * Wires Stream Deck HID events to production actions.
 * Uses 150ms debounce per button to prevent duplicate events.
 * See docs/repo-patterns.md: "Stream Deck fires duplicate button events"
 */
export function useStreamDeck(): void {
  const { device, buttonMap, setSupported, setLastPressed } = useStreamDeckStore()
  const { cut, take, setPvw, setTransitionType, setLive } = useProductionStore()
  const { toggleOverlay } = useGraphicsStore()

  // Check support on mount
  useEffect(() => {
    setSupported(isWebHIDSupported())
  }, [setSupported])

  // Wire HID input events
  useEffect(() => {
    if (!device) return

    function handleInputReport(event: HIDInputReportEvent) {
      const pressed = parsePressedButtons(event.data)
      pressed.forEach((idx) => {
        if (!debounce.try(idx, 150)) return
        setLastPressed(idx)
        const btn = buttonMap.find((b) => b.index === idx)
        if (!btn) return
        executeAction(btn.action)
      })
    }

    device.addEventListener('inputreport', handleInputReport)
    return () => {
      device.removeEventListener('inputreport', handleInputReport)
      debounce.clear()
    }
  }, [device, buttonMap, setLastPressed])

  function executeAction(action: ButtonAction) {
    switch (action.type) {
      case 'cut': cut(); break
      case 'take': take(); break
      case 'pvw': setPvw(action.sourceId); break
      case 'go-live': setLive(!useProductionStore.getState().isLive); break
      case 'transition': setTransitionType(action.mode); break
      case 'graphic-toggle': toggleOverlay(action.graphicId); break
    }
  }
}
