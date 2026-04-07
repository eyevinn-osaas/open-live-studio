import { useEffect } from 'react'
import { useSourcesStore } from '@/store/sources.store'

const POLL_INTERVAL_MS = 10_000 // 10s — max staleness per repo-patterns.md

/**
 * Starts a polling interval that refreshes source lastSeenAt timestamps.
 * Mounts once at app root. Respects the ≤10s staleness requirement.
 */
export function useSourcePolling(): void {
  const tickLastSeen = useSourcesStore((s) => s.tickLastSeen)

  useEffect(() => {
    const id = setInterval(tickLastSeen, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [tickLastSeen])
}
