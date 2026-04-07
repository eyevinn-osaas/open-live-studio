import { useEffect, useCallback } from 'react'
import { useWebRTC } from '@/hooks/useWebRTC'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgramPreview } from './ProgramPreview'
import { SourceBus } from './SourceBus'
import { TransitionPanel } from './TransitionPanel'
import { GraphicsPanel } from './GraphicsPanel'
import { StreamDeckSurface } from './StreamDeckSurface'
import { useProductionStore } from '@/store/production.store'

export function ControllerPage() {
  useWebRTC()

  const { isLive, setLive, cut, take } = useProductionStore()

  // Keyboard shortcuts: Space = Cut, Enter = Take
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.code === 'Space') { e.preventDefault(); cut() }
    if (e.code === 'Enter') { e.preventDefault(); take() }
  }, [cut, take])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Production Controller"
        subtitle="Space = Cut  ·  Enter = Take"
        actions={
          <Button
            variant={isLive ? 'pgm' : 'default'}
            size="md"
            onClick={() => setLive(!isLive)}
          >
            {isLive ? '● ON AIR' : '○ Go Live'}
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {/* PGM / PVW monitors */}
        <ProgramPreview />

        {/* Source bus */}
        <SourceBus />

        {/* Controls row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TransitionPanel />
          <GraphicsPanel />
        </div>

        {/* Stream Deck */}
        <StreamDeckSurface />
      </div>
    </div>
  )
}
