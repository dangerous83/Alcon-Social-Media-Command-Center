const escapeCell = (value) => {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportCalendarCsv(client, posts, platformById) {
  const header = ['Date', 'Title', 'Platform', 'Format', 'Status', 'Caption']
  const rows = [...posts]
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map((p) => [p.date || '', p.title, platformById(p.platform).label, p.format, p.status, p.caption || ''])
  const csv = [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${client.name.replace(/[^\w-]+/g, '_')}_content_plan.csv`
  a.click()
  URL.revokeObjectURL(url)
}
