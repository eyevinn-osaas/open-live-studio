import { useCallback, useEffect, useRef, useState } from 'react'
import { useMacrosStore } from '@/store/macros.store'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { ApiMacro } from '@/lib/api'

const SLOTS = [0, 1, 2, 3, 4, 5, 6, 7] as const

interface MacroBarProps {
  productionId: string
  onExec: (macroId: string) => void
}

interface MacroFormState {
  label: string
  color: string
  slot: number
}

function MacroSlot({
  slot,
  macro,
  onExec,
  onEdit,
  onEmpty,
}: {
  slot: number
  macro: ApiMacro | undefined
  onExec: () => void
  onEdit: () => void
  onEmpty: () => void
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handlePointerDown = () => {
    if (!macro) return
    longPressTimer.current = setTimeout(() => onEdit(), 500)
  }
  const handlePointerUp = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = undefined }
  }

  if (!macro) {
    return (
      <button
        onClick={onEmpty}
        className="flex-1 min-w-[64px] h-10 rounded-lg border border-dashed border-[--color-border] text-[--color-text-muted] text-xs hover:border-[--color-border-strong] transition-colors flex items-center justify-center gap-1"
        title={`F${slot + 1} — empty slot`}
      >
        <span className="text-[9px] text-[--color-text-muted] mr-0.5">F{slot + 1}</span>
        <span>+</span>
      </button>
    )
  }

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={onExec}
      className="flex-1 min-w-[64px] h-10 rounded-lg text-white text-xs font-bold uppercase tracking-wide border border-transparent transition-all active:scale-95 flex flex-col items-center justify-center px-1"
      style={{ backgroundColor: macro.color }}
      title={`F${slot + 1} — ${macro.label} (long press to edit)`}
    >
      <span className="text-[8px] opacity-60">F{slot + 1}</span>
      <span className="truncate max-w-full leading-none">{macro.label}</span>
    </button>
  )
}

export function MacroBar({ productionId, onExec }: MacroBarProps) {
  const { macros, fetchMacros, createMacro, updateMacro, deleteMacro } = useMacrosStore()

  const [editTarget, setEditTarget] = useState<ApiMacro | null>(null)
  const [createSlot, setCreateSlot] = useState<number | null>(null)
  const [form, setForm] = useState<MacroFormState>({ label: '', color: '#3B82F6', slot: 0 })

  useEffect(() => {
    void fetchMacros(productionId)
  }, [productionId, fetchMacros])

  // F1-F8 keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const fKeyMatch = e.code.match(/^F([1-8])$/)
      if (!fKeyMatch) return
      e.preventDefault()
      const slot = parseInt(fKeyMatch[1]!, 10) - 1
      const macro = macros.find((m) => m.slot === slot)
      if (macro) onExec(macro.id)
    },
    [macros, onExec],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const openCreate = (slot: number) => {
    setCreateSlot(slot)
    setForm({ label: '', color: '#3B82F6', slot })
  }

  const openEdit = (macro: ApiMacro) => {
    setEditTarget(macro)
    setForm({ label: macro.label, color: macro.color, slot: macro.slot })
  }

  const closeModal = () => { setEditTarget(null); setCreateSlot(null) }

  const handleSave = async () => {
    if (editTarget) {
      await updateMacro(productionId, editTarget.id, { label: form.label, color: form.color, slot: form.slot })
    } else if (createSlot !== null) {
      await createMacro(productionId, { slot: form.slot, label: form.label, color: form.color, actions: [] })
    }
    closeModal()
  }

  const handleDelete = async () => {
    if (editTarget) {
      await deleteMacro(productionId, editTarget.id)
      closeModal()
    }
  }

  const macroBySlot = (slot: number) => macros.find((m) => m.slot === slot)

  return (
    <>
      <div className="flex gap-1.5 p-3 bg-[--color-surface-3] rounded-xl border border-[--color-border]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[--color-text-muted] self-center mr-1 flex-shrink-0">
          Macros
        </span>
        {SLOTS.map((slot) => (
          <MacroSlot
            key={slot}
            slot={slot}
            macro={macroBySlot(slot)}
            onExec={() => { const m = macroBySlot(slot); if (m) onExec(m.id) }}
            onEdit={() => { const m = macroBySlot(slot); if (m) openEdit(m) }}
            onEmpty={() => openCreate(slot)}
          />
        ))}
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={editTarget !== null || createSlot !== null}
        onClose={closeModal}
        title={editTarget ? 'Edit Macro' : `New Macro — F${(createSlot ?? 0) + 1}`}
      >
        <div className="flex flex-col gap-3 p-4">
          <label className="flex flex-col gap-1 text-sm">
            Label
            <input
              type="text"
              maxLength={50}
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="px-3 py-1.5 rounded bg-[--color-surface-raised] border border-[--color-border] text-[--color-text-primary] text-sm focus:outline-none focus:border-[--color-accent]"
              placeholder="Go Live"
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Color
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="h-9 w-full rounded cursor-pointer"
            />
          </label>
          <p className="text-xs text-[--color-text-muted]">
            Actions can be configured via the API. UI action editor coming in a future update.
          </p>
          <div className={cn('flex gap-2', editTarget ? 'justify-between' : 'justify-end')}>
            {editTarget && (
              <Button variant="danger" size="sm" onClick={() => void handleDelete()}>
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="default" size="sm" onClick={closeModal}>Cancel</Button>
              <Button variant="pgm" size="sm" onClick={() => void handleSave()} disabled={!form.label}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
