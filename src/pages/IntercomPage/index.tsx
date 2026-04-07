import { PageHeader } from '@/components/layout/PageHeader'
import { MicControl } from './MicControl'
import { IntercomLine } from './IntercomLine'
import { useIntercomStore } from '@/store/intercom.store'

export function IntercomPage() {
  const lines = useIntercomStore((s) => s.lines)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Intercom"
        subtitle="Browser-based commentator and production audio — no app installation required"
      />

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {/* Mic setup */}
          <MicControl />

          {/* Intercom lines */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[--color-text-muted]">
              Intercom Lines
            </span>
            {lines.map((line) => (
              <IntercomLine key={line.id} line={line} />
            ))}
          </div>

          <p className="text-xs text-[--color-text-muted] text-center py-2">
            Works on mobile and desktop. No software installation required.
            All audio uses echo cancellation and noise suppression.
          </p>
        </div>
      </div>
    </div>
  )
}
