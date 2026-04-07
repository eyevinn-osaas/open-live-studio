import { useIntercomStore } from '@/store/intercom.store'
import { Button } from '@/components/ui/Button'
import { AudioMeter } from './AudioMeter'
import type { IntercomLine as IntercomLineType } from '@/store/intercom.store'

interface IntercomLineProps {
  line: IntercomLineType
}

export function IntercomLine({ line }: IntercomLineProps) {
  const { joinLine, leaveLine, isJoined, localStream, micMuted } = useIntercomStore()
  const joined = isJoined(line.id)

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded border bg-[--color-surface-3] border-[--color-border]"
      style={{ borderLeftColor: line.color, borderLeftWidth: 4 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[--color-text-primary]">{line.name}</p>
          <p className="text-xs text-[--color-text-muted]">{line.description}</p>
        </div>
        <Button
          variant={joined ? 'pgm' : 'default'}
          size="sm"
          onClick={() => (joined ? leaveLine(line.id) : joinLine(line.id))}
        >
          {joined ? '● Leave' : '+ Join'}
        </Button>
      </div>

      {joined && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[--color-text-muted] uppercase">TX</span>
            <AudioMeter stream={micMuted ? null : localStream} width={200} height={20} />
            {micMuted && <span className="text-[10px] font-mono text-red-400">MUTED</span>}
          </div>
        </div>
      )}
    </div>
  )
}
