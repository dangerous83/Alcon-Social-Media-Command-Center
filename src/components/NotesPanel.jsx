import { useEffect, useRef, useState } from 'react'

export default function NotesPanel({ client, onSave }) {
  const [notes, setNotes] = useState(client.notes || '')
  const [savedAt, setSavedAt] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      await onSave({ ...client, notes })
      setSavedAt(new Date())
    }, 600)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes])

  return (
    <section className="panel p-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="label-caps">Notes for {client.name}</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
          {savedAt ? `Autosaved ${savedAt.toLocaleTimeString()}` : 'Autosaves as you type'}
        </span>
      </div>
      <textarea
        className="field min-h-[420px] resize-y text-[15px] leading-relaxed"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={
          'Anything goes here — meeting notes, content ideas, login hints, campaign plans…'
        }
      />
    </section>
  )
}
