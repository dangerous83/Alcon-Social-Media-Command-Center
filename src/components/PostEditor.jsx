import { useState } from 'react'
import Modal from './Modal.jsx'
import ImageGenerator from './ImageGenerator.jsx'
import { FORMATS, PLATFORMS, STATUSES } from '../lib/constants.js'

export default function PostEditor({ draft, client, onSave, onDelete, onDuplicate, onClose }) {
  const isNew = !draft.id
  const [post, setPost] = useState({ ...draft })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (key, value) => setPost((p) => ({ ...p, [key]: value }))

  const submit = (e) => {
    e.preventDefault()
    if (!post.title.trim()) return
    onSave({ ...post, title: post.title.trim() })
  }

  return (
    <Modal
      title={isNew ? `New post — ${client?.name ?? ''}` : post.title || 'Edit post'}
      onClose={onClose}
      width="max-w-3xl"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="label-caps mb-2 block">Title</label>
            <input
              autoFocus={isNew}
              className="field"
              value={post.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Phishing awareness week — tip #3"
            />
          </div>
          <div>
            <label className="label-caps mb-2 block">Date</label>
            <input
              type="date"
              className="field"
              value={post.date || ''}
              onChange={(e) => set('date', e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label-caps mb-2 block">Platform</label>
            <select className="field" value={post.platform} onChange={(e) => set('platform', e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-caps mb-2 block">Format</label>
            <select className="field" value={post.format} onChange={(e) => set('format', e.target.value)}>
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-caps mb-2 block">Status</label>
            <select className="field" value={post.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label-caps mb-2 block">Caption</label>
          <textarea
            className="field min-h-[110px] resize-y"
            value={post.caption}
            onChange={(e) => set('caption', e.target.value)}
            placeholder="Write the caption copy here…"
          />
        </div>

        {client && (
          <ImageGenerator
            post={post}
            client={client}
            onImage={({ image, imagePrompt, imageSize }) =>
              setPost((p) => ({ ...p, image, imagePrompt, imageSize }))
            }
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
          <div className="flex gap-2">
            {!isNew && (
              <>
                {confirmDelete ? (
                  <button type="button" className="btn-danger" onClick={() => onDelete(post.id)}>
                    Really delete?
                  </button>
                ) : (
                  <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  className="btn-ghost"
                  title="Create a copy of this post as a new Idea"
                  onClick={() => onDuplicate(post)}
                >
                  Duplicate
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isNew ? 'Create post' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
