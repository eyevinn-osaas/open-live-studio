/**
 * Per-key debounce map — used for Stream Deck button events.
 * Prevents the duplicate HID inputreport events caused by contact bounce.
 * See docs/repo-patterns.md: "Stream Deck fires duplicate button events"
 */
export class KeyedDebounce {
  private timers = new Map<number, ReturnType<typeof setTimeout>>()

  /**
   * Returns true if the key should be processed (not debounced).
   * Returns false if a debounce timer is already running for this key.
   */
  try(key: number, delayMs: number): boolean {
    if (this.timers.has(key)) return false
    this.timers.set(
      key,
      setTimeout(() => {
        this.timers.delete(key)
      }, delayMs),
    )
    return true
  }

  clear(): void {
    this.timers.forEach((t) => clearTimeout(t))
    this.timers.clear()
  }
}
