import BrandKit from './BrandKit.jsx'
import CalendarView from './CalendarView.jsx'
import Pipeline from './Pipeline.jsx'
import NotesPanel from './NotesPanel.jsx'
import { exportCalendarCsv } from '../lib/csv.js'
import { platformById } from '../lib/constants.js'

const TABS = [
  { id: 'brand', label: 'Brand Kit' },
  { id: 'calendar', label: 'Content Calendar' },
  { id: 'pipeline', label: 'Post Pipeline' },
  { id: 'notes', label: 'Notes' },
]

export default function Workspace({
  client,
  posts,
  tab,
  setTab,
  onSaveClient,
  onEditPost,
  onCreatePost,
  onPatchPost,
  onDuplicatePost,
}) {
  return (
    <div className="animate-in mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div
          className="grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold text-ink-950 shadow-card"
          style={{ backgroundColor: client.color }}
        >
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="mr-auto">
          <h2 className="text-2xl font-bold tracking-tight text-white">{client.name}</h2>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
            {posts.length} post{posts.length === 1 ? '' : 's'} in plan
          </p>
        </div>
        <button className="btn-teal" onClick={() => exportCalendarCsv(client, posts, platformById)}>
          Export calendar CSV
        </button>
        <button className="btn-primary" onClick={() => onCreatePost({})}>
          + New post
        </button>
      </div>

      <div className="mb-6 flex gap-1 rounded-2xl border border-white/[0.07] bg-ink-850/60 p-1.5 backdrop-blur-md">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm transition-all duration-150 ${
              tab === t.id
                ? 'bg-white/[0.09] font-semibold text-white shadow-card'
                : 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'brand' && <BrandKit client={client} onSave={onSaveClient} />}
      {tab === 'calendar' && (
        <CalendarView
          posts={posts}
          onCreate={(dateKey) => onCreatePost({ date: dateKey })}
          onEdit={onEditPost}
        />
      )}
      {tab === 'pipeline' && (
        <Pipeline
          posts={posts}
          onEdit={onEditPost}
          onPatch={onPatchPost}
          onDuplicate={onDuplicatePost}
        />
      )}
      {tab === 'notes' && <NotesPanel client={client} onSave={onSaveClient} />}
    </div>
  )
}
