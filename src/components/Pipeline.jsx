import { useState } from 'react'
import { STATUSES, STATUS_COLORS, platformById } from '../lib/constants.js'
import { prettyDate, todayKey } from '../lib/dates.js'

export default function Pipeline({ posts, onEdit, onPatch, onDuplicate }) {
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  const drop = (status) => {
    const post = posts.find((p) => p.id === dragId)
    if (post && post.status !== status) onPatch(post, { status })
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
      {STATUSES.map((status) => {
        const columnPosts = posts
          .filter((p) => p.status === status)
          .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault()
              setOverCol(status)
            }}
            onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
            onDrop={(e) => {
              e.preventDefault()
              drop(status)
            }}
            className={`panel flex min-h-[320px] flex-col border-dashed p-3 transition-colors ${
              overCol === status && dragId ? 'drag-over' : ''
            }`}
          >
            <header className="mb-3 flex items-center gap-2 px-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
              <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
                {status}
              </h3>
              <span className="ml-auto rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-white/60">
                {columnPosts.length}
              </span>
            </header>

            <div className="flex-1 space-y-2.5">
              {columnPosts.map((post) => {
                const platform = platformById(post.platform)
                const overdue = post.date && post.date < todayKey() && status !== 'Posted'
                return (
                  <article
                    key={post.id}
                    draggable
                    onDragStart={(e) => {
                      // Firefox cancels drags that set no data
                      e.dataTransfer.setData('text/plain', post.id)
                      e.dataTransfer.effectAllowed = 'move'
                      setDragId(post.id)
                    }}
                    onDragEnd={() => {
                      setDragId(null)
                      setOverCol(null)
                    }}
                    onClick={() => onEdit(post)}
                    className={`group cursor-grab rounded-xl border border-white/10 bg-ink-800/90 p-3 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-white/25 active:cursor-grabbing ${
                      dragId === post.id ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold leading-snug text-white">
                        {post.title || 'Untitled'}
                      </h4>
                      {post.image && <span title="Has generated image">🖼</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                        style={{ backgroundColor: `${platform.color}26`, color: platform.color }}
                      >
                        {platform.label}
                      </span>
                      <span className="rounded-md bg-white/[0.07] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/70">
                        {post.format}
                      </span>
                      <span
                        className={`ml-auto font-mono text-[10px] ${overdue ? 'text-red-300' : 'text-white/55'}`}
                        title={overdue ? 'Overdue' : 'Due date'}
                      >
                        {prettyDate(post.date)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicate(post)
                      }}
                      className="mt-2 hidden w-full rounded-lg border border-white/10 py-1 font-mono text-[10px] uppercase tracking-wider text-white/60 transition-colors hover:border-teal/40 hover:text-teal group-hover:block"
                    >
                      Duplicate
                    </button>
                  </article>
                )
              })}
              {columnPosts.length === 0 && (
                <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-white/40">
                  Drop cards here
                </p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
