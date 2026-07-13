import { useEffect, useRef, useState } from 'react'
import { IMAGE_SIZES, defaultSizeForPlatform } from '../lib/constants.js'
import { buildPromptFromBrand, composeBrandImage } from '../lib/imageGen.js'

export default function ImageGenerator({ post, client, onImage }) {
  const [prompt, setPrompt] = useState(post.imagePrompt || '')
  const [sizeId, setSizeId] = useState(post.imageSize || defaultSizeForPlatform(post.platform))
  const sizePicked = useRef(Boolean(post.imageSize))

  // follow the post's platform until the user picks a size themselves
  useEffect(() => {
    if (!sizePicked.current) setSizeId(defaultSizeForPlatform(post.platform))
  }, [post.platform])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const attemptRef = useRef(0)

  const size = IMAGE_SIZES.find((s) => s.id === sizeId) || IMAGE_SIZES[0]

  const autofill = () => {
    setPrompt(buildPromptFromBrand({ post, client, sizeLabel: size.label }))
    setError(null)
  }

  const generate = async (regenerate = false) => {
    const effectivePrompt = prompt.trim() || buildPromptFromBrand({ post, client, sizeLabel: size.label })
    if (!prompt.trim()) setPrompt(effectivePrompt)
    if (regenerate) attemptRef.current += 1
    setBusy(true)
    setError(null)
    try {
      const image = await composeBrandImage({
        prompt: effectivePrompt,
        width: size.w,
        height: size.h,
        client,
        post,
        attempt: attemptRef.current,
      })
      onImage({ image, imagePrompt: effectivePrompt, imageSize: size.id })
    } catch (err) {
      console.error('Image generation failed', err)
      setError('Image generation failed. This can happen if fonts are still loading — try again.')
    } finally {
      setBusy(false)
    }
  }

  const download = () => {
    const a = document.createElement('a')
    a.href = post.image
    a.download = `${(post.title || 'post').replace(/[^\w-]+/g, '_')}_${size.w}x${size.h}.png`
    a.click()
  }

  return (
    <section className="rounded-2xl border border-teal/20 bg-teal/[0.04] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="label-caps">Generate image</h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/45">
          On-brand · rendered locally
        </span>
      </div>

      <label className="label-caps mb-2 block">Image prompt</label>
      <textarea
        className="field min-h-[76px] resize-y"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the visual you want…"
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
          ) : (
            'Generate'
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3">
          <p className="text-sm text-red-200">{error}</p>
          <button type="button" className="btn-ghost py-1.5" onClick={() => generate(false)}>
            Retry
          </button>
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
              Download PNG
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
