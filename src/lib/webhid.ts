/**
 * WebHID device utilities for Stream Deck integration.
 * See docs/repo-patterns.md: "Stream Deck fires duplicate button events"
 * Always request on user gesture. Degrade gracefully when not supported.
 */

export const ELGATO_VENDOR_ID = 0x0fd9

export const STREAM_DECK_PRODUCT_IDS = [
  0x0060, // Stream Deck Original
  0x006d, // Stream Deck MK.2
  0x0080, // Stream Deck XL
  0x0090, // Stream Deck Mini
  0x00b3, // Stream Deck Plus
]

export function isWebHIDSupported(): boolean {
  return 'hid' in navigator
}

/**
 * Request access to a connected Stream Deck.
 * Must be called from a user gesture (button click).
 */
export async function requestStreamDeck(): Promise<HIDDevice | null> {
  if (!isWebHIDSupported()) return null

  try {
    const devices = await navigator.hid.requestDevice({
      filters: STREAM_DECK_PRODUCT_IDS.map((productId) => ({
        vendorId: ELGATO_VENDOR_ID,
        productId,
      })),
    })
    const device = devices[0]
    if (!device) return null
    if (!device.opened) await device.open()
    return device
  } catch {
    return null
  }
}

/**
 * Parse button index from a Stream Deck HID input report.
 * The Stream Deck sends a report where each byte corresponds to a button (1=pressed, 0=released).
 */
export function parsePressedButtons(data: DataView): number[] {
  const pressed: number[] = []
  // Stream Deck reports start with a report ID byte, then button states
  // Button data starts at offset 1 for most models
  for (let i = 1; i < data.byteLength; i++) {
    if (data.getUint8(i) === 1) {
      pressed.push(i - 1)
    }
  }
  return pressed
}
