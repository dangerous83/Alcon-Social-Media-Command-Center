import { useEffect, useRef, useState } from 'react'
import { emptyBrand } from '../lib/db.js'

export default function BrandKit({ client, onSave }) {
  const [brand, setBrand] = useState({ ...emptyBrand(), ...(client.brand || {}) })
  const [savedAt, setSavedAt] = useState(null)
  const saveTimer = useRef(null)

  // debounced autosave
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await onSave({ ...client, brand })
      setSavedAt(new Date())
    }, 600)
    return () => clearTimeout(saveTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand])

  const set = (key, value) => setBrand((b) => ({ ...b, [key]: value }))

  const setColor = (i, value) =>
    set(
      'colors',
      brand.colors.map((c, idx) => (idx === i ? value : c)),
    )

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="panel p-6">
        <h3 className="label-caps mb-4">Brand colors</h3>
        <div className="flex flex-wrap items-center gap-3">
          {brand.colors.map((color, i) => (
            <div
              key={i}
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800/70 p-2 pr-3"
            >
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(i, e.target.value)}
                className="h-9 w-11 cursor-pointer rounded-lg border-none bg-transparent"
              />
              <span className="font-mono text-xs text-white/70">{color.toUpperCase()}</span>
              <button
                onClick={() => set('colors', brand.colors.filter((_, idx) => idx !== i))}
                className="text-white/40 transition-colors hover:text-red-300"
                title="Remove color"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => set('colors', [...brand.colors, '#2DD4BF'])}
            className="btn-ghost py-2"
          >
            + Add color
          </button>
        </div>

        <h3 className="label-caps mb-2 mt-7">Fonts</h3>
        <input
          className="field"
          value={brand.fonts}
          onChange={(e) => set('fonts', e.target.value)}
          placeholder="e.g. Space Grotesk (headings), Inter (body)"
        />

        <h3 className="label-caps mb-2 mt-6">Logo URL</h3>
        <input
          className="field"
          value={brand.logoUrl}
          onChange={(e) => set('logoUrl', e.target.value)}
          placeholder="https://…/logo.png"
        />
        {brand.logoUrl && (
          <div className="mt-3 inline-flex rounded-xl border border-white/10 bg-ink-800/60 p-3">
            <img
              src={brand.logoUrl}
              alt={`${client.name} logo`}
              className="max-h-16 max-w-[200px] object-contain"
              onError={(e) => (e.target.style.opacity = 0.25)}
            />
          </div>
        )}
      </section>

      <section className="panel p-6">
        <h3 className="label-caps mb-2">Tone of voice</h3>
        <textarea
          className="field min-h-[120px] resize-y"
          value={brand.tone}
          onChange={(e) => set('tone', e.target.value)}
          placeholder="e.g. Confident and technical, but never jargon-heavy. Short sentences. No exclamation marks."
        />

        <h3 className="label-caps mb-2 mt-6">AI photo direction</h3>
        <textarea
          className="field min-h-[80px] resize-y"
          value={brand.photoStyle || ''}
          onChange={(e) => set('photoStyle', e.target.value)}
          placeholder="e.g. dark moody tech scenes, people in modern offices, blue neon accents — guides every AI-generated photo for this client"
        />

        <h3 className="label-caps mb-2 mt-6">Pronunciation & style rules</h3>
        <textarea
          className="field min-h-[160px] resize-y font-mono text-[13px]"
          value={brand.rules}
          onChange={(e) => set('rules', e.target.value)}
          placeholder={'VARA = VAH-rah\nAlways "cyber security" (two words)\nHashtags: max 5 per post'}
        />

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
          {savedAt ? `Autosaved ${savedAt.toLocaleTimeString()}` : 'Changes save automatically'}
        </p>
      </section>
    </div>
  )
}
