import { openDB } from 'idb'

const DB = 'fct-vistorias'
const STORE = 'vistorias'

async function db() {
  return openDB(DB, 1, {
    upgrade(d) {
      d.createObjectStore(STORE, { keyPath: 'id' })
    },
  })
}

export async function saveVistoria(id, data) {
  const conn = await db()
  await conn.put(STORE, { ...data, id, _savedAt: new Date().toISOString() })
}

export async function loadVistoria(id) {
  const conn = await db()
  return conn.get(STORE, id)
}

export async function listVistorias() {
  const conn = await db()
  const all = await conn.getAll(STORE)
  return all.sort((a, b) => (b._savedAt || '').localeCompare(a._savedAt || ''))
}

export async function deleteVistoria(id) {
  const conn = await db()
  return conn.delete(STORE, id)
}

export function generateId() {
  return `vistoria-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
