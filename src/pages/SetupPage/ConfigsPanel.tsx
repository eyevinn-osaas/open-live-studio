import { useState, useEffect } from 'react'
import { useTemplatesStore } from '@/store/templates.store'
import { productionConfigsApi } from '@/lib/api'
import type { ProductionConfig } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

const selectCls =
  'w-full px-3 py-2 rounded bg-[--color-surface-raised] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 appearance-none cursor-pointer'

const inputCls =
  'w-full px-3 py-2 rounded bg-[--color-surface-raised] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30'

// ---------------------------------------------------------------------------
// Shared property fields
// ---------------------------------------------------------------------------

function ConfigFields({
  values,
  onChange,
}: {
  values: Record<string, string | number>
  onChange: (values: Record<string, string | number>) => void
}) {
  const templates = useTemplatesStore((s) => s.templates)
  const template = templates[0] ?? null
  if (!template || (template.properties?.length ?? 0) === 0) return null
  return (
    <div className="flex flex-col gap-3 border-t border-[--color-border] pt-3">
      <span className="text-xs uppercase tracking-wider text-[--color-text-muted]">Values</span>
      {(template.properties ?? []).map((prop) => (
        <div key={prop.id}>
          <label className="text-xs text-[--color-text-muted] block mb-1">{prop.label}</label>
          {prop.type === 'select' ? (
            <select
              value={String(values[prop.id] ?? prop.default)}
              onChange={(e) => onChange({ ...values, [prop.id]: e.target.value })}
              className={selectCls}
            >
              {prop.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : prop.type === 'number' ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={values[prop.id] ?? prop.default}
                min={prop.min}
                max={prop.max}
                onChange={(e) => onChange({ ...values, [prop.id]: e.target.valueAsNumber })}
                className={inputCls}
              />
              {prop.unit && <span className="text-xs text-[--color-text-muted] shrink-0">{prop.unit}</span>}
            </div>
          ) : (
            <input
              type="text"
              value={String(values[prop.id] ?? prop.default)}
              onChange={(e) => onChange({ ...values, [prop.id]: e.target.value })}
              className={inputCls}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create modal
// ---------------------------------------------------------------------------

function CreateConfigModal({ onSave, onClose }: { onSave: (cfg: ProductionConfig) => void; onClose: () => void }) {
  const templates = useTemplatesStore((s) => s.templates)
  const [name, setName] = useState('')
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const props = templates[0]?.properties ?? []
    return Object.fromEntries(props.map((p) => [p.id, p.default]))
  })
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    const templateId = templates[0]?.id
    if (!templateId) return
    setSaving(true)
    try {
      const created = await productionConfigsApi.create({ name: name.trim(), templateId, values })
      onSave(created)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title="New Config" onClose={onClose} className="max-w-md">
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-[--color-text-muted] uppercase tracking-wider block mb-1">Name</label>
          <input
            type="text"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !saving) void handleCreate() }}
            placeholder="HD Standard"
            className={inputCls}
          />
        </div>
        <ConfigFields values={values} onChange={setValues} />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="active" onClick={() => void handleCreate()} disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Edit modal
// ---------------------------------------------------------------------------

function EditConfigModal({ config, onSave, onClose }: { config: ProductionConfig; onSave: (updated: ProductionConfig) => void; onClose: () => void }) {
  const [name, setName] = useState(config.name)
  const [values, setValues] = useState<Record<string, string | number>>({ ...config.values })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const updated = await productionConfigsApi.update(config._id, { name: name.trim(), values })
      onSave(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title={`Edit Config — ${config.name}`} onClose={onClose} className="max-w-md">
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-[--color-text-muted] uppercase tracking-wider block mb-1">Name</label>
          <input
            type="text"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !saving) void handleSave() }}
            className={inputCls}
          />
        </div>
        <ConfigFields values={values} onChange={setValues} />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="active" onClick={() => void handleSave()} disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Configs panel
// ---------------------------------------------------------------------------

export function ConfigsPanel() {
  const { fetchAll: fetchTemplates } = useTemplatesStore()
  const [configs, setConfigs] = useState<ProductionConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ProductionConfig | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductionConfig | null>(null)

  useEffect(() => {
    void fetchTemplates()
    void load()
  }, [fetchTemplates])

  async function load() {
    setIsLoading(true)
    try {
      const data = await productionConfigsApi.listAll()
      setConfigs(data)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(config: ProductionConfig) {
    await productionConfigsApi.remove(config._id)
    setConfigs((prev) => prev.filter((c) => c._id !== config._id))
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[--color-text-muted] font-mono">
          {configs.length} {configs.length === 1 ? 'config' : 'configs'}
          {isLoading && <span className="ml-2 text-[--color-accent]">Loading…</span>}
        </span>
        <Button size="sm" variant="active" onClick={() => setAddOpen(true)}>+ New Config</Button>
      </div>

      {configs.length === 0 && !isLoading && (
        <p className="text-sm text-[--color-text-muted] py-4">No saved configs yet.</p>
      )}

      <div className="flex flex-col gap-1">
        {configs.map((cfg) => (
          <div
            key={cfg._id}
            className="flex items-center gap-3 px-4 py-3 rounded bg-[--color-surface-3] border border-[--color-border] hover:border-orange-500 transition-colors cursor-pointer"
            onClick={() => setEditTarget(cfg)}
          >
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-[--color-text-primary] truncate block">{cfg.name}</span>
              <span className="text-xs text-[--color-text-muted] font-mono truncate block">
                {Object.entries(cfg.values).map(([, v]) => String(v)).join(' · ')}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditTarget(cfg) }}>Edit</Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(cfg) }}
                className="text-white hover:text-red-400"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {addOpen && (
        <CreateConfigModal
          onSave={(cfg) => { setConfigs((prev) => [...prev, cfg]); setAddOpen(false) }}
          onClose={() => setAddOpen(false)}
        />
      )}

      {editTarget && (
        <EditConfigModal
          config={editTarget}
          onSave={(updated) => { setConfigs((prev) => prev.map((c) => (c._id === updated._id ? updated : c))); setEditTarget(null) }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <Modal open title="Delete Config" onClose={() => setDeleteTarget(null)} className="max-w-sm">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[--color-text-primary]">
              Delete <span className="font-semibold">{deleteTarget.name}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => void handleDelete(deleteTarget)}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
