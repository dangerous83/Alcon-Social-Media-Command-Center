// Real AI photo generation for post visuals.
//
// The default engine is Pollinations (FLUX model) — free, no API key, called
// straight from the browser — so hyper-realistic photo backgrounds work out of
// the box on the deployed site. Owners can switch to their own OpenAI,
// Stability AI or Together AI key in AI settings for higher quality; keys are
// stored only in this browser (localStorage) and sent only to that provider.

const SETTINGS_KEY = 'alcon-ai-settings'

export function getAISettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return {
      provider: parsed.provider || 'pollinations',
      keys: { openai: '', stability: '', together: '', ...(parsed.keys || {}) },
    }
  } catch {
    return { provider: 'pollinations', keys: { openai: '', stability: '', together: '' } }
  }
}

export function saveAISettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // storage blocked (private window) — settings just won't persist
  }
}

// ---------------------------------------------------------------------------
// Prompt building: turn the post's actual content into a photography brief.
// ---------------------------------------------------------------------------

// Keyword → photographic scene. Scanned against title + caption so the photo
// reflects what the post is actually about.
const SCENE_HINTS = [
  [/phish|cyber|hack|malware|ransom|firewall|breach|password|encrypt|vulnerab|security/i,
    'a dark modern security operations center, analysts at desks lit by large glowing monitors full of network dashboards, cool blue tones'],
  [/cloud|server|data ?center|hosting|backup|infrastructure/i,
    'a modern data center corridor with rows of server racks and cool blue LED lighting'],
  [/\bai\b|artificial intelligence|machine learning|automation|robot/i,
    'a futuristic technology workspace, engineers collaborating in front of large screens with abstract data visualizations'],
  [/visa|passport|immigra|travel|abroad|flight|airport/i,
    'an airport terminal at golden hour, a traveler with a passport and boarding pass, airplane visible through tall windows'],
  [/law|legal|court|contract|complian|regulation|gdpr/i,
    'a prestigious law office with dark wood shelves of legal books, a desk with documents and a fountain pen, warm light'],
  [/logistic|shipping|freight|warehouse|supply chain|delivery/i,
    'a large modern logistics warehouse, stacked shipping containers and a forklift, workers in safety vests, dramatic daylight'],
  [/finance|invest|bank|money|budget|tax|account|payment/i,
    'a sleek financial district office at dusk, a professional reviewing market charts on a tablet, city skyline through the window'],
  [/health|clinic|doctor|medical|dental|pharma|wellness/i,
    'a bright modern medical clinic, a friendly professional in a white coat, clean white and soft green tones'],
  [/food|restaurant|coffee|menu|chef|recipe/i,
    'an artisan restaurant kitchen, a chef plating a beautiful dish, steam rising, shallow depth of field'],
  [/real estate|property|apartment|house|home|mortgage/i,
    'a stunning modern home exterior at dusk with warm interior lighting and landscaped garden'],
  [/fitness|gym|workout|training|sport|marathon/i,
    'a premium gym with dramatic side lighting, an athlete mid-workout, dust particles in the light beams'],
  [/education|course|learn|workshop|webinar|academy|school/i,
    'a modern seminar room, a presenter at a large screen, engaged audience taking notes, soft daylight'],
  [/hiring|career|job|recruit|team|onboard|culture/i,
    'a diverse professional team collaborating around a table in a bright modern office, candid natural moment'],
  [/event|conference|summit|launch|keynote|expo/i,
    'a large technology conference stage with dramatic purple-blue lighting and a silhouetted audience'],
  [/network|wifi|5g|telecom|internet|broadband/i,
    'telecommunication towers at sunset with a glowing city skyline in the distance'],
  [/eco|green|sustain|solar|energy|climate/i,
    'solar panels and wind turbines on rolling green hills under a clear sky, golden hour'],
]

const DEFAULT_SCENE =
  'a modern professional office environment with soft natural window light, subtle technology details and clean architecture'

// A brand hex like #FF6B35 means nothing to an image model — name the hue.
const colorName = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex?.trim() || '')
  if (!m) return null
  const r = parseInt(m[1], 16) / 255
  const g = parseInt(m[2], 16) / 255
  const b = parseInt(m[3], 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max - min < 0.08) return max > 0.85 ? 'white' : max < 0.2 ? 'black' : 'grey'
  let h = 0
  if (max === r) h = ((g - b) / (max - min)) % 6
  else if (max === g) h = (b - r) / (max - min) + 2
  else h = (r - g) / (max - min) + 4
  h = (h * 60 + 360) % 360
  if (h < 15 || h >= 345) return 'red'
  if (h < 40) return 'orange'
  if (h < 65) return 'golden yellow'
  if (h < 150) return 'green'
  if (h < 195) return 'teal'
  if (h < 255) return 'blue'
  if (h < 290) return 'purple'
  return 'pink'
}

export function inferScene(text) {
  for (const [pattern, scene] of SCENE_HINTS) {
    if (pattern.test(text)) return scene
  }
  return DEFAULT_SCENE
}

// Build a hyper-realistic photography prompt that reflects the post content.
// `scene` overrides the inferred scene (used by the studio's scene box).
export function buildPhotoPrompt({ post = {}, client = {}, scene = '' } = {}) {
  const brand = client.brand || {}
  const title = (post.title || '').trim()
  const caption = (post.caption || '').split('\n')[0].trim()
  const subject = scene.trim() || inferScene(`${title} ${post.caption || ''}`)

  const parts = [`Professional commercial photograph of ${subject}.`]
  const theme = title || caption
  if (theme) parts.push(`The photo visually represents the theme: ${theme} — depicted through the scene only.`)
  if ((brand.photoStyle || '').trim()) parts.push(`Visual direction: ${brand.photoStyle.trim()}.`)
  const hue = colorName((brand.colors || [])[0] || client.color)
  if (hue && hue !== 'grey' && hue !== 'black' && hue !== 'white') {
    parts.push(`Subtle ${hue} accent tones in the lighting and details.`)
  }
  parts.push(
    'Hyper-realistic, photorealistic, cinematic lighting, ultra detailed, sharp focus, 8k, ' +
      'shot on a full-frame camera with an 85mm lens, shallow depth of field, professional color grading, ' +
      'editorial magazine quality. Clean composition with negative space for text overlay. ' +
      'Absolutely no text, no words, no letters, no captions, no watermarks, no logos in the image.',
  )
  return parts.join(' ')
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

const fetchWithTimeout = async (url, options = {}, ms = 120000) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(new DOMException('Timed out', 'TimeoutError')), ms)
  const outer = options.signal
  const onOuterAbort = () => ctrl.abort(outer.reason)
  if (outer) {
    if (outer.aborted) onOuterAbort()
    else outer.addEventListener('abort', onOuterAbort, { once: true })
  }
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
    if (outer) outer.removeEventListener('abort', onOuterAbort)
  }
}

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the generated image'))
    reader.readAsDataURL(blob)
  })

// Base64 payloads don't say what format they are — sniff the magic bytes.
const b64ToDataUrl = (b64) => {
  const mime = b64.startsWith('iVBOR') ? 'image/png' : b64.startsWith('R0lGO') ? 'image/gif' : 'image/jpeg'
  return `data:${mime};base64,${b64}`
}

async function pollinationsGenerate({ prompt, width, height, seed, signal }) {
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    model: 'flux',
    nologo: 'true',
    private: 'true',
    referrer: 'alcon-command-center',
  })
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`
  const res = await fetchWithTimeout(url, { signal }, 150000)
  if (!res.ok) throw new Error(`Pollinations returned ${res.status} — the free service may be busy, try again in a moment`)
  const blob = await res.blob()
  if (!blob.type.startsWith('image/')) throw new Error('Pollinations did not return an image — try again')
  return blobToDataUrl(blob)
}

async function openaiGenerate({ prompt, width, height, apiKey, signal }) {
  const size = width > height * 1.2 ? '1536x1024' : height > width * 1.2 ? '1024x1536' : '1024x1024'
  const res = await fetchWithTimeout(
    'https://api.openai.com/v1/images/generations',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, size, quality: 'high', n: 1 }),
      signal,
    },
    150000,
  )
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    if (res.status === 401) throw new Error('OpenAI rejected the API key — check it in AI settings')
    throw new Error(detail?.error?.message || `OpenAI returned ${res.status}`)
  }
  const json = await res.json()
  const b64 = json.data?.[0]?.b64_json
  if (!b64) throw new Error('OpenAI returned no image data')
  return b64ToDataUrl(b64)
}

async function togetherGenerate({ prompt, width, height, seed, apiKey, signal }) {
  // FLUX wants multiples of 32, capped — we cover-crop to the exact size after.
  const cap = 1440
  const scale = Math.min(1, cap / Math.max(width, height))
  const snap = (v) => Math.max(256, Math.round((v * scale) / 32) * 32)
  const res = await fetchWithTimeout(
    'https://api.together.xyz/v1/images/generations',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        prompt,
        width: snap(width),
        height: snap(height),
        steps: 4,
        n: 1,
        seed,
        response_format: 'b64_json',
      }),
      signal,
    },
    150000,
  )
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    if (res.status === 401) throw new Error('Together AI rejected the API key — check it in AI settings')
    throw new Error(detail?.error?.message || `Together AI returned ${res.status}`)
  }
  const json = await res.json()
  const b64 = json.data?.[0]?.b64_json
  if (!b64) throw new Error('Together AI returned no image data')
  return b64ToDataUrl(b64)
}

async function stabilityGenerate({ prompt, width, height, seed, apiKey, signal }) {
  const ratios = ['21:9', '16:9', '3:2', '5:4', '1:1', '4:5', '2:3', '9:16', '9:21']
  const target = width / height
  const aspect = ratios.reduce((best, r) => {
    const [a, b] = r.split(':').map(Number)
    const [ba, bb] = best.split(':').map(Number)
    return Math.abs(a / b - target) < Math.abs(ba / bb - target) ? r : best
  })
  const form = new FormData()
  form.append('prompt', prompt)
  form.append('aspect_ratio', aspect)
  form.append('output_format', 'jpeg')
  form.append('seed', String(seed % 4294967294))
  const res = await fetchWithTimeout(
    'https://api.stability.ai/v2beta/stable-image/generate/core',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'image/*' },
      body: form,
      signal,
    },
    150000,
  )
  if (!res.ok) {
    if (res.status === 401) throw new Error('Stability AI rejected the API key — check it in AI settings')
    const detail = await res.json().catch(() => null)
    throw new Error(detail?.errors?.[0] || `Stability AI returned ${res.status}`)
  }
  return blobToDataUrl(await res.blob())
}

export const AI_PROVIDERS = [
  {
    id: 'pollinations',
    label: 'Pollinations · FLUX',
    tagline: 'Free · no API key · works out of the box',
    needsKey: false,
    generate: pollinationsGenerate,
  },
  {
    id: 'openai',
    label: 'OpenAI · GPT Image',
    tagline: 'Highest quality · needs your OpenAI API key',
    needsKey: true,
    keyPlaceholder: 'sk-…',
    generate: openaiGenerate,
  },
  {
    id: 'stability',
    label: 'Stability AI · Stable Image Core',
    tagline: 'Fast photographic model · needs your Stability key',
    needsKey: true,
    keyPlaceholder: 'sk-…',
    generate: stabilityGenerate,
  },
  {
    id: 'together',
    label: 'Together AI · FLUX.1 schnell',
    tagline: 'Fast FLUX · needs your Together API key',
    needsKey: true,
    keyPlaceholder: 'together_…',
    generate: togetherGenerate,
  },
]

export const providerById = (id) => AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[0]

// Generate a real photo. Tries the configured provider, then falls back to the
// free keyless one so generation still works if a key is missing or a paid API
// is down. Returns { dataUrl, provider }.
export async function generateAIPhoto({ prompt, width, height, seed, settings, signal, onStatus }) {
  const s = settings || getAISettings()
  const chain = [s.provider]
  if (s.provider !== 'pollinations') chain.push('pollinations')

  let lastError = null
  for (const id of chain) {
    const provider = providerById(id)
    const apiKey = (s.keys?.[id] || '').trim()
    if (provider.needsKey && !apiKey) {
      lastError = new Error(`${provider.label} needs an API key — add one in AI settings`)
      continue
    }
    try {
      onStatus?.(`Creating photo with ${provider.label}…`)
      const dataUrl = await provider.generate({ prompt, width, height, seed, apiKey, signal })
      return { dataUrl, provider: id }
    } catch (err) {
      if (err?.name === 'AbortError' || signal?.aborted) throw err
      console.error(`AI photo via ${id} failed`, err)
      lastError = err
      onStatus?.(`${provider.label} failed — trying fallback…`)
    }
  }
  throw new Error(
    lastError?.message ||
      'Could not reach any image service. Check your internet connection and try again.',
  )
}

// Deterministic-ish seed per prompt; bump `attempt` on Regenerate for a new take.
export function seedFor(prompt, attempt = 0) {
  let h = 2166136261
  for (let i = 0; i < prompt.length; i++) {
    h ^= prompt.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) + attempt * 9973) % 1000000007
}

// Load a data URL into an <img> ready for canvas drawing (data URLs never taint).
export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode the generated image'))
    img.src = src
  })
}

// Draw `img` into a w×h canvas, cover-fit (fills the frame, crops overflow),
// and return it as a JPEG data URL — used for "photo only, no overlay".
export function coverCropDataUrl(img, w, h, quality = 0.92) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  coverDraw(ctx, img, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

export function coverDraw(ctx, img, w, h) {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
}
