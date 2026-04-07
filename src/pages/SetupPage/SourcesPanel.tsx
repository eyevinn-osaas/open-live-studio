import { useState } from 'react'
import { useSourcesStore } from '@/store/sources.store'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'
import { Modal } from '@/components/ui/Modal'
import type { Source, SourceType, Resolution } from '@/mock/sources'

const SOURCE_COLORS: Record<string, string> = {
  Camera: 'text-blue-400', SRT: 'text-orange-400', NDI: 'text-teal-400', Test: 'text-zinc-400',
}

function statusToDot(status: Source['status']): 'green' | 'yellow' | 'gray' {
  if (status === 'connected') return 'green'
  if (status === 'connecting') return 'yellow'
  return 'gray'
}

function timeSince(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000)
  if (secs < 5) return 'just now'
  if (secs < 60) return `${secs}s ago`
  return `${Math.floor(secs / 60)}m ago`
}

export function SourcesPanel() {
  const { sources, isLoading, lastFetchedAt, refresh, removeSource, addSource } = useSourcesStore()
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<SourceType>('Camera')
  const [newRes, setNewRes] = useState<Resolution>('1920x1080')

  function handleAdd() {
    if (!newName.trim()) return
    addSource({ name: newName.trim(), type: newType, status: 'connecting', resolution: newRes, color: '#27272a' })
    setNewName('')
    setAddOpen(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[--color-text-muted] font-mono">
            {sources.length} sources · refreshed {timeSince(lastFetchedAt)}
          </span>
          {isLoading && <span className="text-xs text-[--color-accent]">Refreshing…</span>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={refresh} disabled={isLoading}>↻ Refresh</Button>
          <Button size="sm" variant="active" onClick={() => setAddOpen(true)}>+ Add Source</Button>
        </div>
      </div>

      {/* Source list */}
      <div className="flex flex-col gap-1">
        {sources.map((src) => (
          <div
            key={src.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded bg-[--color-surface-3] border border-[--color-border] hover:border-zinc-600 transition-colors"
          >
            <StatusDot color={statusToDot(src.status)} pulse={src.status === 'connecting'} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[--color-text-primary] truncate">{src.name}</span>
                <span className={`text-xs font-mono ${SOURCE_COLORS[src.type] ?? ''}`}>{src.type}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-[--color-text-muted] font-mono">{src.resolution}</span>
                <span className="text-xs text-[--color-text-muted]">· {timeSince(src.lastSeenAt)}</span>
              </div>
            </div>
            <Badge
              variant={src.status === 'connected' ? 'connected' : src.status === 'connecting' ? 'connecting' : 'disconnected'}
            />
            <Button size="sm" variant="ghost" onClick={() => removeSource(src.id)} className="opacity-40 hover:opacity-100">✕</Button>
          </div>
        ))}
      </div>

      {/* Add source modal */}
      <Modal open={addOpen} title="Add Source" onClose={() => setAddOpen(false)}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-[--color-text-muted] uppercase tracking-wider block mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Camera 4 — Closeup"
              className="w-full px-3 py-2 rounded bg-[--color-surface-1] border border-[--color-border] text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent]"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-[--color-text-muted] uppercase tracking-wider block mb-1">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as SourceType)}
                className="w-full px-3 py-2 rounded bg-[--color-surface-1] border border-[--color-border] text-sm text-[--color-text-primary] focus:outline-none"
              >
                {(['Camera', 'SRT', 'NDI', 'Test'] as SourceType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-[--color-text-muted] uppercase tracking-wider block mb-1">Resolution</label>
              <select
                value={newRes}
                onChange={(e) => setNewRes(e.target.value as Resolution)}
                className="w-full px-3 py-2 rounded bg-[--color-surface-1] border border-[--color-border] text-sm text-[--color-text-primary] focus:outline-none"
              >
                {(['1920x1080', '1280x720', '3840x2160'] as Resolution[]).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="active" onClick={handleAdd} disabled={!newName.trim()}>Add Source</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
