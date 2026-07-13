import { openDB } from 'idb'

const DB_NAME = 'alcon-command-center'
const DB_VERSION = 1

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const clients = db.createObjectStore('clients', { keyPath: 'id' })
        clients.createIndex('name', 'name')
        const posts = db.createObjectStore('posts', { keyPath: 'id' })
        posts.createIndex('clientId', 'clientId')
        posts.createIndex('date', 'date')
      },
    })
  }
  return dbPromise
}

const uid = () =>
  `${Date.now().toString(36)}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`

export const emptyBrand = () => ({
  colors: [],
  fonts: '',
  logoUrl: '',
  tone: '',
  rules: '',
})

const SEED_CLIENTS = [
  { name: 'ITSEC', color: '#FF6B35' },
  { name: 'SecureVisa', color: '#2DD4BF' },
  { name: 'ILS', color: '#818CF8' },
  { name: 'Dubinex', color: '#FACC15' },
  { name: 'Power Media', color: '#F472B6' },
]

export async function seedIfEmpty() {
  const db = await getDB()
  const count = await db.count('clients')
  if (count > 0) return
  const tx = db.transaction('clients', 'readwrite')
  // deterministic ids keep seeding idempotent (React StrictMode mounts effects twice)
  for (const [i, seed] of SEED_CLIENTS.entries()) {
    await tx.store.put({
      id: `seed-${seed.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: seed.name,
      color: seed.color,
      brand: { ...emptyBrand(), colors: [seed.color] },
      notes: '',
      createdAt: Date.now() + i, // keep the seed order stable when sorting
    })
  }
  await tx.done
}

// ---- clients ----

export async function listClients() {
  const db = await getDB()
  const all = await db.getAll('clients')
  return all.sort((a, b) => a.createdAt - b.createdAt)
}

export async function saveClient(client) {
  const db = await getDB()
  const record = client.id
    ? client
    : { ...client, id: uid(), brand: client.brand ?? emptyBrand(), notes: client.notes ?? '', createdAt: Date.now() }
  await db.put('clients', record)
  return record
}

export async function deleteClient(clientId) {
  const db = await getDB()
  const tx = db.transaction(['clients', 'posts'], 'readwrite')
  await tx.objectStore('clients').delete(clientId)
  const postStore = tx.objectStore('posts')
  const posts = await postStore.index('clientId').getAllKeys(clientId)
  for (const key of posts) await postStore.delete(key)
  await tx.done
}

// ---- posts ----

export async function listAllPosts() {
  const db = await getDB()
  return db.getAll('posts')
}

export async function listPostsForClient(clientId) {
  const db = await getDB()
  return db.getAllFromIndex('posts', 'clientId', clientId)
}

export async function savePost(post) {
  const db = await getDB()
  const record = post.id
    ? { ...post, updatedAt: Date.now() }
    : { ...post, id: uid(), createdAt: Date.now(), updatedAt: Date.now() }
  await db.put('posts', record)
  return record
}

export async function deletePost(postId) {
  const db = await getDB()
  await db.delete('posts', postId)
}

export async function duplicatePost(post) {
  const copy = {
    ...post,
    id: undefined,
    title: `${post.title} (copy)`,
    status: 'Idea',
    image: null,
    createdAt: undefined,
    updatedAt: undefined,
  }
  return savePost(copy)
}
