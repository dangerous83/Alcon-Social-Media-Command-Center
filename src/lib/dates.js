export const toKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const todayKey = () => toKey(new Date())

export const monthLabel = (year, month) =>
  new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

export const prettyDate = (key) => {
  if (!key) return '—'
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// 6x7 grid of Date objects for a month view (weeks start Monday)
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(year, month, 1 - startOffset + i))
  }
  return cells
}

export function isThisWeek(key) {
  if (!key) return false
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const now = new Date()
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const nextMonday = new Date(monday)
  nextMonday.setDate(monday.getDate() + 7)
  return date >= monday && date < nextMonday
}

export function isThisMonth(key) {
  if (!key) return false
  const [y, m] = key.split('-').map(Number)
  const now = new Date()
  return y === now.getFullYear() && m === now.getMonth() + 1
}
