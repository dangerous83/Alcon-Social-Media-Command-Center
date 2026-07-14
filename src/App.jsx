import { useCallback, useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Workspace from './components/Workspace.jsx'
import PostEditor from './components/PostEditor.jsx'
import ClientModal from './components/ClientModal.jsx'
import * as db from './lib/db.js'

export default function App() {
  const [ready, setReady] = useState(false)
  const [initError, setInitError] = useState(null)
  const [clients, setClients] = useState([])
  const [posts, setPosts] = useState([])
  const [activeClientId, setActiveClientId] = useState(null)
  const [tab, setTab] = useState('calendar')
  const [editorDraft, setEditorDraft] = useState(null) // post being edited/created
  const [clientDraft, setClientDraft] = useState(null) // client being edited/created

  const refresh = useCallback(async () => {
    const [c, p] = await Promise.all([db.listClients(), db.listAllPosts()])
    setClients(c)
    setPosts(p)
  }, [])

  useEffect(() => {
    db.seedIfEmpty()
      .then(refresh)
      .then(() => setReady(true))
      .catch((err) => {
        console.error('Could not open local storage', err)
        setInitError(err)
      })
  }, [refresh])

  const activeClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) || null,
    [clients, activeClientId],
  )

  const selectClient = (id) => {
    setActiveClientId(id)
    if (id) setTab('calendar')
  }

  const openPost = (post) => {
    setActiveClientId(post.clientId)
    setEditorDraft(post)
  }

  const savePost = async (post) => {
    await db.savePost(post)
    await refresh()
    setEditorDraft(null)
  }

  const deletePost = async (postId) => {
    await db.deletePost(postId)
    await refresh()
    setEditorDraft(null)
  }

  const duplicatePost = async (post) => {
    const copy = await db.duplicatePost(post)
    await refresh()
    return copy
  }

  const patchPost = async (post, patch) => {
    await db.savePost({ ...post, ...patch })
    await refresh()
  }

  const saveClient = async (client) => {
    const saved = await db.saveClient(client)
    await refresh()
    setClientDraft(null)
    return saved
  }

  const removeClient = async (clientId) => {
    await db.deleteClient(clientId)
    if (activeClientId === clientId) setActiveClientId(null)
    setClientDraft(null)
    await refresh()
  }

  if (initError) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="panel max-w-md p-8 text-center">
          <p className="text-3xl">🔒</p>
          <h1 className="mt-3 text-xl font-bold text-white">Can't open local storage</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            This app saves everything in your browser (IndexedDB), and your browser is blocking
            it — this usually happens in private/incognito windows or with strict privacy
            settings. Try a regular window, or allow site data for this page.
          </p>
          <button className="btn-primary mt-5" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        clients={clients}
        activeClientId={activeClientId}
        onSelect={selectClient}
        onAdd={() => setClientDraft({})}
        onEdit={(client) => setClientDraft(client)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar posts={posts} clients={clients} onOpenPost={openPost} activeClient={activeClient} />

        <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-6 lg:px-10">
          {activeClient ? (
            <Workspace
              key={activeClient.id}
              client={activeClient}
              posts={posts.filter((p) => p.clientId === activeClient.id)}
              tab={tab}
              setTab={setTab}
              onSaveClient={saveClient}
              onEditPost={setEditorDraft}
              onCreatePost={(defaults) =>
                setEditorDraft({
                  clientId: activeClient.id,
                  title: '',
                  platform: 'instagram',
                  format: 'Static',
                  caption: '',
                  status: 'Idea',
                  date: '',
                  image: null,
                  imagePrompt: '',
                  ...defaults,
                })
              }
              onPatchPost={patchPost}
              onDuplicatePost={duplicatePost}
            />
          ) : (
            <Dashboard clients={clients} posts={posts} onSelectClient={selectClient} onOpenPost={openPost} />
          )}
        </main>
      </div>

      {editorDraft && (
        <PostEditor
          draft={editorDraft}
          client={clients.find((c) => c.id === editorDraft.clientId)}
          onSave={savePost}
          onDelete={deletePost}
          onDuplicate={async (post) => {
            const copy = await duplicatePost(post)
            setEditorDraft(copy)
          }}
          onClose={() => setEditorDraft(null)}
        />
      )}

      {clientDraft && (
        <ClientModal
          draft={clientDraft}
          onSave={saveClient}
          onDelete={removeClient}
          onClose={() => setClientDraft(null)}
        />
      )}
    </div>
  )
}
