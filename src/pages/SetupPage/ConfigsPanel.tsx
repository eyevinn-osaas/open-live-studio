import { useState, useEffect } from 'react'
import { useTemplatesStore } from '@/store/templates.store'
import { productionConfigsApi } from '@/lib/api'
import type { ProductionConfig } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

// Re-used from ProductionsPanel — inline here to keep the panel self-contained
const selectCls =
  'w-full px-3 py-2 rounded bg-[--color-surface-raised] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent] appearance-none cursor-pointer'

const inputCls =
  'w-full px-3 py-2 rounded bg-[--color-surface-raised] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent]'

// ---------------------------------------------------------------------------
// Edit modal
// ---------------------------------------------------------------------------

interface EditModalProps {
  config: ProductionConfig
  onSave: (updated: ProductionConfig) => void
  onClose: () => void
}

function EditConfigModal({ config, onSave, onClose }: EditModalProps) {
  const templates = useTemplatesStore((s) => s.templates)
  const template = templates.find((t) => t.id === config.templateId) ?? null

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
        {/* Name */}
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

        {/* Template (read-only) */}
        <div>
          <label className="text-xs text-[--color-text-muted] uppercase tracking-wider block mb-1">Template</label>
          <span className="text-sm text-[--color-text-primary]">{template?.name ?? config.templateId}</span>
        </div>

        {/* Property values */}
        {template && (template.properties?.length ?? 0) > 0 && (
          <div className="flex flex-col gap-3 border-t border-[--color-border] pt-3">
            <span className="text-xs uppercase tracking-wider text-[--color-text-muted]">Values</span>
            {(template.properties ?? []).map((prop) => (
              <div key={prop.id}>
                <label className="text-xs text-[--color-text-muted] block mb-1">{prop.label}</label>
                {prop.type === 'select' ? (
                  <select
                    value={String(values[prop.id] ?? prop.default)}
                    onChange={(e) => setValues((v) => ({ ...v, [prop.id]: e.target.value }))}
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
                      onChange={(e) => setValues((v) => ({ ...v, [prop.id]: e.target.valueAsNumber }))}
                      className={inputCls}
                    />
                    {prop.unit && <span className="text-xs text-[--color-text-muted] shrink-0">{prop.unit}</span>}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={String(values[prop.id] ?? prop.default)}
                    onChange={(e) => setValues((v) => ({ ...v, [prop.id]: e.target.value }))}
                    className={inputCls}
                  />
                )}
              </div>
            ))}
          </div>
        )}

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
  const { fetchAll: fetchTemplates, templates } = useTemplatesStore()
  const [configs, setConfigs] = useState<ProductionConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
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

  function handleSaved(updated: ProductionConfig) {
    setConfigs((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))
    setEditTarget(null)
  }

  // Group configs by template for display
  const byTemplate = configs.reduce<Record<string, ProductionConfig[]>>((acc, cfg) => {
    const key = cfg.templateId
    if (!acc[key]) acc[key] = []
    acc[key].push(cfg)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[--color-text-muted] font-mono">
          {configs.length} {configs.length === 1 ? 'config' : 'configs'}
        </span>
        {isLoading && <span className="text-xs text-[--color-accent]">Loading…</span>}
      </div>

      {configs.length === 0 && !isLoading && (
        <p className="text-sm text-[--color-text-muted] py-4">
          No saved configs yet. Create one when setting up a production.
        </p>
      )}

      {Object.entries(byTemplate).map(([templateId, cfgs]) => {
        const template = templates.find((t) => t.id === templateId)
        return (
          <div key={templateId} className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-[--color-text-muted] mb-1">
              {template?.name ?? templateId}
            </span>
            {cfgs.map((cfg) => (
              <div
                key={cfg._id}
                className="flex items-center gap-3 px-4 py-3 rounded bg-[--color-surface-3] border border-[--color-border] hover:border-orange-500 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[--color-text-primary] truncate block">{cfg.name}</span>
                  <span className="text-xs text-[--color-text-muted] font-mono truncate block">
                    {Object.entries(cfg.values)
                      .map(([k, v]) => {
                        const prop = template?.properties?.find((p) => p.id === k)
                        const label = prop?.type === 'select'
                          ? (prop.options?.find((o) => o.value === String(v))?.label ?? String(v))
                          : `${v}${prop?.unit ? ` ${prop.unit}` : ''}`
                        return label
                      })
                      .join(' · ')}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setEditTarget(cfg)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(cfg)}
                    className="text-white hover:text-red-400"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      })}

      {/* Edit modal */}
      {editTarget && (
        <EditConfigModal
          config={editTarget}
          onSave={handleSaved}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete confirmation */}
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
