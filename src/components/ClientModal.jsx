import { useState } from 'react'
import Modal from './Modal.jsx'

export default function ClientModal({ draft, onSave, onDelete, onClose }) {
  const isNew = !draft.id
  const [name, setName] = useState(draft.name || '')
  const [color, setColor] = useState(draft.color || '#FF6B35')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ ...draft, name: name.trim(), color })
  }

  return (
    <Modal title={isNew ? 'New client' : `Edit ${draft.name}`} onClose={onClose} width="max-w-md">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label-caps mb-2 block">Client name</label>
          <input
            autoFocus
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Northwind Labs"
          />
        </div>
        <div>
          <label className="label-caps mb-2 block">Brand color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
            />
            <span className="font-mono text-sm text-white/70">{color.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {!isNew ? (
            confirmDelete ? (
              <button
                type="button"
                onClick={() => onDelete(draft.id)}
                className="btn-danger"
              >
                Really delete? All posts go too
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger">
                Delete client
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isNew ? 'Add client' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
