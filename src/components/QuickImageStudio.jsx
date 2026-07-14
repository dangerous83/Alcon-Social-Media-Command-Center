import { useMemo, useRef, useState } from 'react'
import { IMAGE_SIZES } from '../lib/constants.js'
import { composeStructuredImage } from '../lib/imageGen.js'

// Professional graphic builder on the dashboard. Structured content, top to
// bottom: logo → eyebrow → heading → paragraph → bullet title → bullets → CTA.
// Rendered locally on canvas in the selected client's brand colors.

const EXAMPLES = {
  eyebrow: 'Cyber security tip',
  heading: 'Start your business now',
  paragraph: 'Launching is easier than you think. Here is what you need lined up before day one.',
  bulletsTitle: 'What you get',
  bullets: '24/7 monitoring\nFree security audit\nDedicated account manager',
  cta: 'Book a free call →',
}

function Field({ step, label, optional, children, action }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="label-caps">
          {step} · {label}
          {optional && <span className="ml-1.5 normal-case tracking-normal text-white/40">(optional)</span>}
        </label>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function QuickImageStudio({ clients }) {
  const [clientId, setClientId] = useState(clients[0]?.id || '')
  const [logoData, setLogoData] = useState(null)
  const [logoName, setLogoName] = useState('')
  const [eyebrow, setEyebrow] = useState('')
  const [heading, setHeading] = useState('')
  const [paragraph, setParagraph] = useState('')
  const [bulletsTitle, setBulletsTitle] = useState('')
  const [bulletsText, setBulletsText] = useState('')
  const [cta, setCta] = useState('')
  const [sizeId, setSizeId] = useState('ig-square')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [image, setImage] = useState(null)
  const attemptRef = useRef(0)
  const fileRef = useRef(null)

  const client = useMemo(() => clients.find((c) => c.id === clientId) || clients[0], [clients, clientId])
  const size = IMAGE_SIZES.find((si) => si.id === sizeId) || IMAGE_SIZES[0]

  const onLogoFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image — please pick a PNG, JPG, SVG or WebP.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setLogoData(reader.result)
      setLogoName(file.name)
      setError(null)
    }
    reader.onerror = () => setError('Could not read that file — try another one.')
    reader.readAsDataURL(file)
  }

  const fillExample = () => {
    setEyebrow(EXAMPLES.eyebrow)
    setHeading(EXAMPLES.heading)
    setParagraph(EXAMPLES.paragraph)
    setBulletsTitle(EXAMPLES.bulletsTitle)
    setBulletsText(EXAMPLES.bullets)
    setCta(EXAMPLES.cta)
    setError(null)
  }

  const generate = async (regenerate = false) => {
    if (!client) return
    if (regenerate) attemptRef.current += 1
    setBusy(true)
    setError(null)
    try {
      const img = await composeStructuredImage({
        content: {
          logoData,
          eyebrow,
          heading,
          paragraph,
          bulletsTitle,
          bullets: bulletsText.split('\n'),
          cta,
        },
        width: size.w,
        height: size.h,
        client,
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
    a.download = `${(heading || 'graphic').replace(/[^\w-]+/g, '_')}_${size.w}x${size.h}.png`
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
          <h3 className="text-xl font-bold tracking-tight text-white">Graphic studio</h3>
          <p className="text-sm text-white/70">
            Build a designed post: logo, headline, bullets, call-to-action — in your client's brand colors.
          </p>
        </div>
        <button type="button" onClick={fillExample} className="btn-ghost py-1.5 text-xs">
          Fill with example
        </button>
      </div>

      <div className="relative mt-5 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Field step="1" label="Client">
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
          </Field>

          <Field step="2" label="Logo" optional>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onLogoFile(e.target.files?.[0])}
              />
              <button type="button" className="btn-ghost py-2" onClick={() => fileRef.current?.click()}>
                ⬆ Upload logo
              </button>
              {logoData ? (
                <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800/70 py-1.5 pl-2 pr-3">
                  <img src={logoData} alt="Logo preview" className="h-8 w-auto max-w-[90px] object-contain" />
                  <span className="max-w-[140px] truncate text-xs text-white/70">{logoName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLogoData(null)
                      setLogoName('')
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                    className="text-white/45 hover:text-red-300"
                    title="Remove logo"
                  >
                    ✕
                  </button>
                </span>
              ) : (
                <span className="text-xs text-white/50">
                  No file? We'll use {client?.name}'s Brand Kit logo or a monogram.
                </span>
              )}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field step="3" label="Eyebrow" optional>
              <input
                className="field"
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                placeholder="Small line above the heading"
              />
            </Field>
            <Field step="4" label="Heading">
              <input
                className="field"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="The big message"
              />
            </Field>
          </div>

          <Field step="5" label="Paragraph" optional>
            <textarea
              className="field min-h-[64px] resize-y"
              value={paragraph}
              onChange={(e) => setParagraph(e.target.value)}
              placeholder="One or two supporting sentences."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field step="6" label="Bullet title" optional>
              <input
                className="field"
                value={bulletsTitle}
                onChange={(e) => setBulletsTitle(e.target.value)}
                placeholder="e.g. What you get"
              />
            </Field>
            <Field step="7" label="Bullets" optional>
              <textarea
                className="field min-h-[64px] resize-y"
                value={bulletsText}
                onChange={(e) => setBulletsText(e.target.value)}
                placeholder={'One per line\nUp to six'}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field step="8" label="Call to action" optional>
              <input
                className="field"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="e.g. Book a free call →"
              />
            </Field>
            <Field step="9" label="Size">
              <select className="field" value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
                {IMAGE_SIZES.map((si) => (
                  <option key={si.id} value={si.id}>
                    {si.label} ({si.w}×{si.h})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex items-center gap-3 pt-1">
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
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/45">
              Runs on your device — nothing is uploaded
            </span>
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
        <div className="flex w-full flex-col items-center justify-center self-start rounded-2xl border border-white/10 bg-ink-950/50 p-4">
          {image ? (
            <>
              <div className="overflow-hidden rounded-xl border border-white/10 shadow-card">
                <img src={image} alt="Generated graphic" className="max-h-[380px] w-auto max-w-full" />
              </div>
              <div className="mt-3 flex w-full gap-2">
                <button type="button" className="btn-teal flex-1" onClick={download}>
                  Download
                </button>
                <button type="button" className="btn-ghost flex-1" disabled={busy} onClick={() => generate(true)}>
                  Regenerate
                </button>
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <p className="text-3xl">🖼️</p>
              <p className="mt-2 text-sm text-white/60">
                Your design appears here.
                <br />
                Fill in the fields and hit generate.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
