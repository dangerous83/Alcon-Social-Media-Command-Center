import { useMemo, useRef, useState } from 'react'
import { IMAGE_SIZES } from '../lib/constants.js'
import { buildPromptFromBrand, composeBrandImage } from '../lib/imageGen.js'

// A friendly, standalone image generator that lives on the dashboard so you can
// make an on-brand graphic in seconds — no need to create a post first. It uses
// the same local canvas composer as the post editor.
export default function QuickImageStudio({ clients }) {
  const [clientId, setClientId] = useState(clients[0]?.id || '')
  const [headline, setHeadline] = useState('')
  const [prompt, setPrompt] = useState('')
  const [sizeId, setSizeId] = useState('ig-square')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [image, setImage] = useState(null)
  const attemptRef = useRef(0)

  const client = useMemo(() => clients.find((c) => c.id === clientId) || clients[0], [clients, clientId])
  const size = IMAGE_SIZES.find((s) => s.id === sizeId) || IMAGE_SIZES[0]

  // synthetic "post" the composer understands
  const buildPost = () => ({
    title: headline.trim() || 'Your headline here',
    caption: '',
    platform: size.platform,
    format: 'Static',
  })

  const writePrompt = () => {
    if (!client) return
    setPrompt(buildPromptFromBrand({ post: buildPost(), client, sizeLabel: size.label }))
    setError(null)
  }

  const generate = async (regenerate = false) => {
    if (!client) return
    const post = buildPost()
    const effectivePrompt =
      prompt.trim() || buildPromptFromBrand({ post, client, sizeLabel: size.label })
    if (!prompt.trim()) setPrompt(effectivePrompt)
    if (regenerate) attemptRef.current += 1
    setBusy(true)
    setError(null)
    try {
      const img = await composeBrandImage({
        prompt: effectivePrompt,
        width: size.w,
        height: size.h,
        client,
        post,
        attempt: attemptRef.current,
      })
      setImage(img)
    } catch (err) {
      console.error('Image generation failed', err)
      setError('Hmm, that didn’t work — the fonts may still be loading. Give it another tap.')
    } finally {
      setBusy(false)
    }
  }

  const download = () => {
    if (!image) return
    const a = document.createElement('a')
    a.href = image
    a.download = `${(headline || 'graphic').replace(/[^\w-]+/g, '_')}_${size.w}x${size.h}.png`
    a.click()
  }

  if (clients.length === 0) return null

  return (
    <section className="panel relative overflow-hidden p-6">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle, ${client?.color || '#FF6B35'}, transparent 70%)` }}
      />

      <div className="relative flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-soft text-xl shadow-glow">
          🎨
        </span>
        <div className="mr-auto">
          <h3 className="text-xl font-bold tracking-tight text-white">Make a graphic in seconds</h3>
          <p className="text-sm text-white/70">
            Pick a client, type a headline, hit generate. It uses their brand colors automatically.
          </p>
        </div>
        <span className="rounded-full border border-teal/30 bg-teal/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-teal-soft">
          No account · runs on your device
        </span>
      </div>

      <div className="relative mt-5 grid gap-5 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div>
            <label className="label-caps mb-2 block">1 · Which client?</label>
            <div className="flex flex-wrap gap-2">
              {clients.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setClientId(c.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all ${
                    c.id === clientId
                      ? 'border-white/25 bg-white/[0.08] font-semibold text-white'
                      : 'border-white/10 text-white/75 hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-caps mb-2 block">2 · What should it say?</label>
            <input
              className="field"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. 5 signs your password was leaked"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label-caps">3 · Style prompt (optional)</label>
              <button
                type="button"
                onClick={writePrompt}
                className="font-mono text-[10px] uppercase tracking-wider text-teal transition-colors hover:text-teal-soft"
              >
                ✨ Write it for me
              </button>
            </div>
            <textarea
              className="field min-h-[64px] resize-y"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Leave blank and we'll build one from the brand kit."
            />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label-caps mb-2 block">Size</label>
              <select className="field py-2" value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
                {IMAGE_SIZES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.w}×{s.h})
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => generate(false)}>
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
                  Creating…
                </>
              ) : (
                '✨ Generate graphic'
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3">
              <p className="text-sm text-red-200">{error}</p>
              <button type="button" className="btn-ghost py-1.5" onClick={() => generate(false)}>
                Try again
              </button>
            </div>
          )}
        </div>

        {/* preview panel */}
        <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-ink-950/50 p-4 lg:w-[300px]">
          {image ? (
            <>
              <div className="overflow-hidden rounded-xl border border-white/10 shadow-card">
                <img src={image} alt="Generated graphic" className="max-h-[300px] w-auto max-w-full" />
              </div>
              <div className="mt-3 flex w-full gap-2">
                <button type="button" className="btn-teal flex-1" onClick={download}>
                  Download
                </button>
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  disabled={busy}
                  onClick={() => generate(true)}
                >
                  Regenerate
                </button>
              </div>
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-3xl">🖼️</p>
              <p className="mt-2 text-sm text-white/60">
                Your graphic shows up here.
                <br />
                Fill in a headline and hit generate.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
