import { isThisMonth, isThisWeek, prettyDate, todayKey } from '../lib/dates.js'
import { platformById } from '../lib/constants.js'

function StatCard({ label, value, tone = 'text-white' }) {
  return (
    <div className="panel p-5">
      <p className="label-caps mb-2">{label}</p>
      <p className={`text-4xl font-bold tracking-tight ${tone}`}>{value}</p>
    </div>
  )
}

export default function Dashboard({ clients, posts, onSelectClient, onOpenPost }) {
  const thisMonth = posts.filter((p) => isThisMonth(p.date))
  const forReview = posts.filter((p) => p.status === 'For Review')
  const dueThisWeek = posts.filter((p) => isThisWeek(p.date) && p.status !== 'Posted')

  const upcoming = posts
    .filter((p) => p.date && p.date >= todayKey() && p.status !== 'Posted')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  const clientName = (id) => clients.find((c) => c.id === id)?.name || '—'

  return (
    <div className="animate-in mx-auto max-w-6xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white">Good to see you 👋</h2>
        <p className="mt-1 text-white/70">
          Here's what's happening across all {clients.length} client accounts.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Posts this month" value={thisMonth.length} />
        <StatCard label="Waiting for review" value={forReview.length} tone="text-accent" />
        <StatCard label="Due this week" value={dueThisWeek.length} tone="text-teal" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="panel p-6 lg:col-span-3">
          <h3 className="label-caps mb-4">Per-client plan</h3>
          <div className="space-y-1.5">
            {clients.map((client) => {
              const count = posts.filter((p) => p.clientId === client.id).length
              const monthCount = posts.filter(
                (p) => p.clientId === client.id && isThisMonth(p.date),
              ).length
              return (
                <button
                  key={client.id}
                  onClick={() => onSelectClient(client.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition-all hover:border-white/10 hover:bg-white/[0.05]"
                >
                  <span
                    className="h-3 w-3 rounded-full ring-2 ring-white/10"
                    style={{ backgroundColor: client.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-white/90">{client.name}</span>
                  <span className="font-mono text-[11px] text-white/55">
                    {monthCount} this month
                  </span>
                  <span className="w-20 text-right font-mono text-[11px] text-white/55">
                    {count} total
                  </span>
                  <span className="text-white/35">→</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="panel p-6 lg:col-span-2">
          <h3 className="label-caps mb-4">Coming up</h3>
          {upcoming.length === 0 && (
            <p className="text-sm text-white/55">
              Nothing scheduled ahead. Pick a client and plan some content.
            </p>
          )}
          <div className="space-y-1.5">
            {upcoming.map((post) => {
              const platform = platformById(post.platform)
              return (
                <button
                  key={post.id}
                  onClick={() => onOpenPost(post)}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-all hover:border-white/10 hover:bg-white/[0.05]"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: platform.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-white/90">{post.title}</span>
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-white/45">
                      {clientName(post.clientId)}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-teal">{prettyDate(post.date)}</span>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
