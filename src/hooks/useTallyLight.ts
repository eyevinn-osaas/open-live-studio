import { useProductionStore } from '@/store/production.store'

export type TallyState = 'pgm' | 'pvw' | 'off'

/**
 * Returns the tally state for a given source ID.
 * Derived from production store — no additional state needed.
 */
export function useTallyLight(sourceId: string): TallyState {
  const pgmSourceId = useProductionStore((s) => s.pgmSourceId)
  const pvwSourceId = useProductionStore((s) => s.pvwSourceId)

  if (sourceId === pgmSourceId) return 'pgm'
  if (sourceId === pvwSourceId) return 'pvw'
  return 'off'
}
