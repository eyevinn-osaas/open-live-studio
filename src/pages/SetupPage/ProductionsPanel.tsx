import { useState } from 'react'
import { useProductionStore } from '@/store/production.store'
import { useSourcesStore } from '@/store/sources.store'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'

interface Production {
  id: string
  name: string
  sourceIds: string[]
  createdAt: string
  isActive: boolean
}

export function ProductionsPanel() {
  const [productions, setProductions] = useState<Production[]>([])
  const { activeProductionId, setActiveProduction } = useProductionStore()
  const sources = useSourcesStore((s) => s.sources)
  const [newName, setNewName] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  function handleActivate(id: string) {
    setProductions((prev) => prev.map((p) => ({ ...p, isActive: p.id === id })))
    setActiveProduction(id)
  }

  function handleAdd() {
    if (!newName.trim()) return
    const prod: Production = {
      id: `prod-${Date.now()}`,
      name: newName.trim(),
      sourceIds: sources.slice(0, 2).map((s) => s.id),
      createdAt: new Date().toISOString(),
      isActive: false,
    }
    setProductions((prev) => [...prev, prod])
    setNewName('')
    setAddOpen(false)
  }

  function handleDelete(id: string) {
    setProductions((prev) => prev.filter((p) => p.id !== id))
    if (activeProductionId === id) setActiveProduction(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" variant="active" onClick={() => setAddOpen(true)}>+ New Production</Button>
      </div>

      <div className="flex flex-col gap-2">
        {productions.map((prod) => {
          const isActive = activeProductionId === prod.id
          return (
            <div
              key={prod.id}
              className={`flex items-center gap-3 px-4 py-3 rounded border transition-colors ${
                isActive
                  ? 'bg-[--color-surface-3] border-[--color-accent]'
                  : 'bg-[--color-surface-3] border-[--color-border] hover:border-zinc-600'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[--color-text-primary] truncate">{prod.name}</span>
                  {isActive && <Badge variant="live" label="ACTIVE" />}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-[--color-text-muted]">{prod.sourceIds.length} sources</span>
                  <span className="text-xs text-[--color-text-muted] font-mono">
                    {new Date(prod.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {!isActive && (
                  <Button size="sm" variant="pvw" onClick={() => handleActivate(prod.id)}>Activate</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleDelete(prod.id)} className="opacity-40 hover:opacity-100">✕</Button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={addOpen} title="New Production" onClose={() => setAddOpen(false)}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-[--color-text-muted] uppercase tracking-wider block mb-1">Production Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Evening News — May 1"
              className="w-full px-3 py-2 rounded bg-[--color-surface-raised] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="active" onClick={handleAdd} disabled={!newName.trim()}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
