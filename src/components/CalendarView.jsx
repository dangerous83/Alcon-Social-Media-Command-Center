import { useMemo, useState } from 'react'
import { monthGrid, monthLabel, toKey, todayKey } from '../lib/dates.js'
import { platformById, PLATFORMS } from '../lib/constants.js'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarView({ posts, onCreate, onEdit }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const cells = useMemo(() => monthGrid(year, month), [year, month])
  const byDate = useMemo(() => {
    const map = {}
    for (const p of posts) {
      if (!p.date) continue
      ;(map[p.date] ||= []).push(p)
    }
    return map
  }, [posts])

  const shift = (delta) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const today = todayKey()

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
        <h3 className="text-lg font-semibold tracking-tight text-white">
          {monthLabel(year, month)}
        </h3>
        <div className="flex items-center gap-2">
          <button className="btn-ghost px-3 py-1.5" onClick={() => shift(-1)} title="Previous month">
            ←
          </button>
          <button
            className="btn-ghost px-3 py-1.5"
            onClick={() => {
              setYear(now.getFullYear())
              setMonth(now.getMonth())
            }}
          >
            Today
          </button>
          <button className="btn-ghost px-3 py-1.5" onClick={() => shift(1)} title="Next month">
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-white/[0.07]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          const key = toKey(date)
          const inMonth = date.getMonth() === month
          const dayPosts = byDate[key] || []
          const isToday = key === today
          return (
            <button
              key={i}
              onClick={() => onCreate(key)}
              className={`group relative min-h-[104px] border-b border-r border-white/[0.05] p-2 text-left align-top transition-colors last:border-r-0 hover:bg-white/[0.04] ${
                inMonth ? '' : 'bg-ink-950/40'
              }`}
            >
              <span
                className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs ${
                  isToday
                    ? 'bg-accent font-bold text-ink-950'
                    : inMonth
                      ? 'text-white/80'
                      : 'text-white/30'
                }`}
              >
                {date.getDate()}
              </span>
              <span className="absolute right-2 top-2 hidden font-mono text-[10px] text-teal group-hover:block">
                + add
              </span>
              <div className="mt-1.5 space-y-1">
                {dayPosts.slice(0, 3).map((post) => {
                  const platform = platformById(post.platform)
                  return (
                    <span
                      key={post.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(post)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation()
                          onEdit(post)
                        }
                      }}
                      title={`${post.title} — ${platform.label} ${post.format} (${post.status})`}
                      className="block truncate rounded-md px-1.5 py-1 text-[11px] font-medium leading-none text-white transition-transform hover:scale-[1.02]"
                      style={{
                        backgroundColor: `${platform.color}2E`,
                        boxShadow: `inset 2px 0 0 ${platform.color}`,
                      }}
                    >
                      {post.title || 'Untitled'}
                    </span>
                  )
                })}
                {dayPosts.length > 3 && (
                  <span className="block px-1.5 font-mono text-[10px] text-white/50">
                    +{dayPosts.length - 3} more
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 px-6 py-3.5">
        {PLATFORMS.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-white/60">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.label}
          </span>
        ))}
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-white/40">
          Click a day to add a post
        </span>
      </div>
    </section>
  )
}
