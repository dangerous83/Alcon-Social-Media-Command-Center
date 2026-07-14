import { useMemo, useRef, useState } from 'react'
import { IMAGE_SIZES, defaultSizeForPlatform, platformById } from '../lib/constants.js'
import { composeBrandImage } from '../lib/imageGen.js'
import { buildPhotoPrompt, generateAIPhoto, getAISettings, loadImageElement, seedFor } from '../lib/aiImage.js'

// Visual autopilot: finds every post without an image and generates a real,
// on-brand AI photo visual for each one — sequentially, saving as it goes, so
// a whole content calendar can be illustrated with one click.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default function VisualAutopilot({ clients, posts, onPatchPost }) {
  const [scope, setScope] = useState('all')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(null) // {done, total, current}
  const [summary, setSummary] = useState(null) // {ok, failed: [{title, message}]}
  const cancelRef = useRef(false)

  const missing = useMemo(
    () =>
      posts.filter(
        (p) => !p.image && (scope === 'all' || p.clientId === scope) && clients.some((c) => c.id === p.clientId),
      ),
    [posts, scope, clients],
  )

  const run = async () => {
    const queue = [...missing]
    if (!queue.length) return
    cancelRef.current = false
    setRunning(true)
    setSummary(null)
    const failed = []
    let ok = 0
    // free keyless tier is rate-limited — space requests out
    const gapMs = getAISettings().provider === 'pollinations' ? 5000 : 1200

    for (let i = 0; i < queue.length; i++) {
      if (cancelRef.current) break
      const post = queue[i]
      const client = clients.find((c) => c.id === post.clientId)
      setProgress({ done: i, total: queue.length, current: post.title || 'Untitled post' })
      try {
        const sizeId = post.imageSize || defaultSizeForPlatform(post.platform)
        const size = IMAGE_SIZES.find((s) => s.id === sizeId) || IMAGE_SIZES[0]
        const prompt = (post.imagePrompt || '').trim() || buildPhotoPrompt({ post, client })
        const { dataUrl } = await generateAIPhoto({
          prompt,
          width: size.w,
          height: size.h,
          seed: seedFor(prompt, 0),
        })
        const photo = await loadImageElement(dataUrl)
        const image = await composeBrandImage({
          prompt,
          width: size.w,
          height: size.h,
          client,
          post,
          photo,
        })
        await onPatchPost(post, {
          image,
          imagePrompt: prompt,
          imageSize: size.id,
          imageMode: 'photo',
          imageOverlay: true,
        })
        ok++
      } catch (err) {
        console.error(`Autopilot failed for "${post.title}"`, err)
        failed.push({ title: post.title || 'Untitled post', message: err.message })
      }
      if (i < queue.length - 1 && !cancelRef.current) await sleep(gapMs)
    }

    setProgress(null)
    setRunning(false)
    setSummary({ ok, failed, cancelled: cancelRef.current })
  }

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal/60 to-teal/20 text-xl">
          🤖
        </span>
        <div className="mr-auto">
          <h3 className="text-lg font-bold tracking-tight text-white">Visual autopilot</h3>
          <p className="text-sm text-white/70">
            Generate a real, on-brand AI photo for every post that has no image yet.
          </p>
        </div>
        <select
          className="field w-auto py-2"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          disabled={running}
        >
          <option value="all">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {running ? (
          <button type="button" className="btn-danger" onClick={() => (cancelRef.current = true)}>
            Stop
          </button>
        ) : (
          <button type="button" className="btn-primary" disabled={missing.length === 0} onClick={run}>
            {missing.length === 0
              ? 'All posts have visuals ✓'
              : `📷 Generate ${missing.length} missing visual${missing.length === 1 ? '' : 's'}`}
          </button>
        )}
      </div>

      {running && progress && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="truncate text-white/85">
              Creating: <span className="font-semibold text-white">{progress.current}</span>
            </span>
            <span className="ml-3 shrink-0 font-mono text-xs text-teal">
              {progress.done + 1} / {progress.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-teal transition-all duration-500"
              style={{ width: `${Math.max(4, (progress.done / progress.total) * 100)}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-white/45">
            Each photo takes ~10–30 s · finished posts are saved immediately
          </p>
        </div>
      )}

      {summary && !running && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
          <p className="text-white/85">
            {summary.cancelled && 'Stopped. '}
            <span className="font-semibold text-teal-soft">{summary.ok} visual{summary.ok === 1 ? '' : 's'} generated</span>
            {summary.failed.length > 0 && (
              <span className="text-red-300"> · {summary.failed.length} failed</span>
            )}
            {summary.ok > 0 && ' — open any post to review, regenerate or download.'}
          </p>
          {summary.failed.map((f, i) => (
            <p key={i} className="mt-1 text-xs text-red-200/85">
              “{f.title}”: {f.message}
            </p>
          ))}
        </div>
      )}

      {!running && !summary && missing.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {missing.slice(0, 6).map((p) => (
            <span
              key={p.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/65"
            >
              <span style={{ color: platformById(p.platform).color }}>●</span> {p.title || 'Untitled'}
            </span>
          ))}
          {missing.length > 6 && (
            <span className="self-center text-xs text-white/45">+{missing.length - 6} more</span>
          )}
        </div>
      )}
    </section>
  )
}
