import { usePipelineStore } from '@/store/pipeline.store'
import { JsonEditor } from '@/components/ui/JsonEditor'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

function formatUptime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function PipelineEditor() {
  const { stromJson, parseError, executionState, uptimeSeconds, setStromJson, setExecutionState } = usePipelineStore()

  function handleValidate() {
    // Trigger re-parse by re-setting the current value
    setStromJson(stromJson)
  }

  function handleSimulateToggle() {
    setExecutionState(executionState === 'running' ? 'idle' : 'running')
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Status bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant={executionState === 'running' ? 'running' : executionState === 'error' ? 'error' : 'idle'} />
        {executionState === 'running' && (
          <span className="text-xs text-[--color-text-muted] font-mono">Uptime: {formatUptime(uptimeSeconds)}</span>
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleValidate}>Validate JSON</Button>
          <Button
            size="sm"
            variant={executionState === 'running' ? 'danger' : 'pvw'}
            onClick={handleSimulateToggle}
          >
            {executionState === 'running' ? 'Stop Pipeline' : 'Start Pipeline'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-[--color-text-muted]">
        Strom pipeline topology (internal JSON format). Edit and validate before applying.
        {' '}Changes are not applied to a live pipeline in mock mode.
      </p>

      {/* JSON editor */}
      <div className="flex-1">
        <JsonEditor
          value={stromJson}
          onChange={setStromJson}
          error={parseError}
          className="h-full"
        />
      </div>

      {!parseError && (
        <p className="text-xs text-emerald-400">✓ Valid JSON</p>
      )}
    </div>
  )
}
