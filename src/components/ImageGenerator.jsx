import { useEffect, useRef, useState } from 'react'
import { IMAGE_SIZES, defaultSizeForPlatform } from '../lib/constants.js'
import { buildPromptFromBrand, composeBrandImage } from '../lib/imageGen.js'
import {
  buildPhotoPrompt,
  coverCropDataUrl,
  generateAIPhoto,
  getAISettings,
  loadImageElement,
  providerById,
  seedFor,
} from '../lib/aiImage.js'

const MODES = [
  { id: 'photo', label: '📷 AI photo', hint: 'Real hyper-realistic photo that matches the post' },
  { id: 'graphic', label: '🎨 Brand graphic', hint: 'Designed gradient graphic, rendered locally' },
]

export default function ImageGenerator({ post, client, onImage, onOpenAISettings }) {
  const [mode, setMode] = useState(post.imageMode || 'photo')
  const [overlay, setOverlay] = useState(post.imageOverlay ?? true)
  const [prompt, setPrompt] = useState(post.imagePrompt || '')
  const [sizeId, setSizeId] = useState(post.imageSize || defaultSizeForPlatform(post.platform))
  const sizePicked = useRef(Boolean(post.imageSize))

  // follow the post's platform until the user picks a size themselves
  useEffect(() => {
    if (!sizePicked.current) setSizeId(defaultSizeForPlatform(post.platform))
  }, [post.platform])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)
  const attemptRef = useRef(0)

  const size = IMAGE_SIZES.find((s) => s.id === sizeId) || IMAGE_SIZES[0]
  const provider = providerById(getAISettings().provider)

  const buildAuto = (forMode = mode) =>
    forMode === 'photo'
      ? buildPhotoPrompt({ post, client })
      : buildPromptFromBrand({ post, client, sizeLabel: size.label })

  const autofill = () => {
    setPrompt(buildAuto())
    setError(null)
  }

  const generate = async (regenerate = false, forceMode = null) => {
    const activeMode = forceMode || mode
    if (forceMode) setMode(forceMode)
    const effectivePrompt = prompt.trim() || buildAuto(activeMode)
    if (!prompt.trim()) setPrompt(effectivePrompt)
    if (regenerate) attemptRef.current += 1
    setBusy(true)
    setError(null)
    try {
      let image
      if (activeMode === 'photo') {
        setStatus('Creating your photo — usually 10–30 seconds…')
        const { dataUrl } = await generateAIPhoto({
          prompt: effectivePrompt,
          width: size.w,
          height: size.h,
          seed: seedFor(effectivePrompt, attemptRef.current),
          onStatus: setStatus,
        })
        setStatus('Composing your post…')
        const photo = await loadImageElement(dataUrl)
        image = overlay
          ? await composeBrandImage({
              prompt: effectivePrompt,
              width: size.w,
              height: size.h,
              client,
              post,
              attempt: attemptRef.current,
              photo,
            })
          : coverCropDataUrl(photo, size.w, size.h)
      } else {
        image = await composeBrandImage({
          prompt: effectivePrompt,
          width: size.w,
          height: size.h,
          client,
          post,
          attempt: attemptRef.current,
        })
      }
      onImage({
        image,
        imagePrompt: effectivePrompt,
        imageSize: size.id,
        imageMode: activeMode,
        imageOverlay: overlay,
      })
    } catch (err) {
      console.error('Image generation failed', err)
      setError(
        activeMode === 'photo'
          ? err.message || 'Photo generation failed — check your connection and try again.'
          : 'Image generation failed. This can happen if fonts are still loading — try again.',
      )
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  const download = () => {
    const a = document.createElement('a')
    a.href = post.image
    const ext = post.image.startsWith('data:image/jpeg') ? 'jpg' : 'png'
    a.download = `${(post.title || 'post').replace(/[^\w-]+/g, '_')}_${size.w}x${size.h}.${ext}`
    a.click()
  }

  return (
    <section className="rounded-2xl border border-teal/20 bg-teal/[0.04] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="label-caps">Generate image</h3>
        <button
          type="button"
          className="font-mono text-[10px] uppercase tracking-wider text-white/45 transition-colors hover:text-teal"
          onClick={onOpenAISettings}
          title="Change the AI image engine"
        >
          Engine: {provider.label} ⚙
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id)
              setError(null)
            }}
            title={m.hint}
            className={`rounded-xl border px-3 py-2 text-sm transition-all ${
              mode === m.id
                ? 'border-teal/50 bg-teal/[0.08] font-semibold text-white'
                : 'border-white/10 text-white/75 hover:border-white/20 hover:bg-white/[0.04]'
            }`}
          >
            {m.label}
          </button>
        ))}
        {mode === 'photo' && (
          <label className="ml-auto flex cursor-pointer items-center gap-2 self-center text-sm text-white/80">
            <input
              type="checkbox"
              checked={overlay}
              onChange={(e) => setOverlay(e.target.checked)}
              className="h-4 w-4 accent-teal"
            />
            Brand text overlay
          </label>
        )}
      </div>

      <label className="label-caps mb-2 block">
        {mode === 'photo' ? 'Describe the photo' : 'Image prompt'}
      </label>
      <textarea
        className="field min-h-[76px] resize-y"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={
          mode === 'photo'
            ? 'Leave empty to auto-build from the caption — or describe the scene you want…'
            : 'Describe the visual you want…'
        }
      />

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <button type="button" className="btn-ghost" onClick={autofill}>
          ✨ Auto-fill from caption + brand
        </button>
        <div className="ml-auto">
          <label className="label-caps mb-2 block">Size</label>
          <select
            className="field py-2"
            value={sizeId}
            onChange={(e) => {
              sizePicked.current = true
              setSizeId(e.target.value)
            }}
          >
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
              Generating…
            </>
          ) : mode === 'photo' ? (
            '📷 Generate photo'
          ) : (
            'Generate'
          )}
        </button>
      </div>

      {busy && status && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-teal/80">{status}</p>
      )}

      {error && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3">
          <p className="min-w-[200px] flex-1 text-sm text-red-200">{error}</p>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost py-1.5" onClick={() => generate(false)}>
              Retry
            </button>
            {mode === 'photo' && (
              <button
                type="button"
                className="btn-ghost py-1.5"
                title="Renders locally — works offline"
                onClick={() => generate(false, 'graphic')}
              >
                Use brand graphic
              </button>
            )}
          </div>
        </div>
      )}

      {post.image && !busy && (
        <div className="mt-5">
          <div className="overflow-hidden rounded-xl border border-white/10 shadow-card">
            <img
              src={post.image}
              alt="Generated post graphic"
              className="mx-auto max-h-[420px] w-auto max-w-full"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-teal" onClick={download}>
              Download
            </button>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => generate(true)}>
              Regenerate
            </button>
            <span className="ml-auto self-center font-mono text-[10px] uppercase tracking-wider text-white/45">
              Saved with the post
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
