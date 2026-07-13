import { useEffect, useRef, useState } from 'react'
import { platformById } from '../lib/constants.js'
import { prettyDate } from '../lib/dates.js'

export default function TopBar({ posts, clients, onOpenPost, activeClient }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  const q = query.trim().toLowerCase()
  const results = q
    ? posts
        .filter((p) => p.title.toLowerCase().includes(q))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 8)
    : []

  const clientName = (id) => clients.find((c) => c.id === id)?.name || '—'
  const clientColor = (id) => clients.find((c) => c.id === id)?.color || '#666'

  return (
    <header className="flex shrink-0 items-center gap-4 border-b border-white/[0.06] bg-ink-900/70 px-6 py-3.5 backdrop-blur-md lg:px-10">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight text-white">
          {activeClient ? activeClient.name : 'Dashboard'}
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
          {activeClient ? 'Client workspace' : 'All clients overview'}
        </p>
      </div>

      <div ref={boxRef} className="relative w-full max-w-sm">
        <input
          className="field py-2 pl-9"
          placeholder="Search posts across all clients…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
          ⌕
        </span>

        {open && q && (
          <div className="panel absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto p-1.5">
            {results.length === 0 && (
              <p className="px-3 py-3 text-sm text-white/55">No posts match “{query}”.</p>
            )}
            {results.map((post) => (
              <button
                key={post.id}
                onClick={() => {
                  onOpenPost(post)
                  setOpen(false)
                  setQuery('')
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/[0.07]"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: clientColor(post.clientId) }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white/90">{post.title}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-white/45">
                    {clientName(post.clientId)} · {platformById(post.platform).label} ·{' '}
                    {prettyDate(post.date)}
                  </span>
                </span>
                <span
                  className="rounded-md px-1.5 py-0.5 font-mono text-[10px]"
                  style={{ color: platformById(post.platform).color }}
                >
                  {post.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
