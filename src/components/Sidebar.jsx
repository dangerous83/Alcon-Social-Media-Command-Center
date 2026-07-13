export default function Sidebar({ clients, activeClientId, onSelect, onAdd, onEdit }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-ink-950/60 backdrop-blur-md">
      <button
        onClick={() => onSelect(null)}
        className="group flex items-center gap-3 px-5 py-5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-soft text-base font-bold text-ink-950 shadow-glow">
          A
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-tight text-white">
            Alcon Command Center
          </span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 group-hover:text-teal/80">
            Social · Multi-client
          </span>
        </span>
      </button>

      <div className="mx-5 border-t border-white/[0.06]" />

      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <span className="label-caps">Clients</span>
        <button
          onClick={onAdd}
          title="Add client"
          className="grid h-6 w-6 place-items-center rounded-md border border-white/10 text-sm text-white/70 transition-colors hover:border-teal/50 hover:text-teal"
        >
          +
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {clients.map((client) => {
          const active = client.id === activeClientId
          return (
            <div
              key={client.id}
              className={`group flex items-center rounded-xl border transition-all duration-150 ${
                active
                  ? 'border-white/15 bg-white/[0.07] shadow-card'
                  : 'border-transparent hover:border-white/10 hover:bg-white/[0.04]'
              }`}
            >
              <button
                onClick={() => onSelect(client.id)}
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/10"
                  style={{ backgroundColor: client.color }}
                />
                <span className={`truncate text-sm ${active ? 'font-semibold text-white' : 'text-white/85'}`}>
                  {client.name}
                </span>
              </button>
              <button
                onClick={() => onEdit(client)}
                title={`Edit ${client.name}`}
                className="mr-2 hidden rounded-md px-1.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/50 hover:bg-white/10 hover:text-white group-hover:block"
              >
                Edit
              </button>
            </div>
          )
        })}
        {clients.length === 0 && (
          <p className="px-3 py-4 text-sm text-white/50">No clients yet — add your first one.</p>
        )}
      </nav>

      <div className="border-t border-white/[0.06] px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
          Local · IndexedDB
        </p>
      </div>
    </aside>
  )
}
