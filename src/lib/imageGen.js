// Local brand-graphic composer. Renders a designed social post to canvas at the
// requested dimensions — layered gradients in the client's brand palette,
// Space Grotesk headline, mono kicker, logo slot — and returns a PNG data URL.
// The prompt + a regenerate counter seed the layout, so the same prompt is
// reproducible and "Regenerate" gives a fresh take.

const hashString = (str) => {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const mulberry32 = (seed) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex?.trim() || '')
  if (!m) return { r: 255, g: 107, b: 53 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

const rgba = (hex, a) => {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

const luminance = (hex) => {
  const { r, g, b } = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

async function ensureFonts() {
  await Promise.all([
    document.fonts.load('700 100px "Space Grotesk"'),
    document.fonts.load('500 100px "Space Grotesk"'),
    document.fonts.load('500 40px "JetBrains Mono"'),
  ])
}

function loadLogo(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const timer = setTimeout(() => resolve(null), 6000)
    img.onload = () => {
      clearTimeout(timer)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    img.src = url
  })
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word
    if (ctx.measureText(attempt).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = attempt
    }
  }
  if (line) lines.push(line)
  return lines
}

// Pick a font size where the headline fits the box in <= maxLines lines.
function fitHeadline(ctx, text, maxWidth, maxHeight, maxLines) {
  let size = Math.floor(maxHeight / 2.2)
  while (size > 18) {
    ctx.font = `700 ${size}px "Space Grotesk"`
    const lines = wrapText(ctx, text, maxWidth)
    const lineHeight = size * 1.12
    if (lines.length <= maxLines && lines.length * lineHeight <= maxHeight) {
      return { size, lines, lineHeight }
    }
    size = Math.floor(size * 0.92)
  }
  ctx.font = `700 18px "Space Grotesk"`
  return { size: 18, lines: wrapText(ctx, text, maxWidth), lineHeight: 22 }
}

function drawGrain(ctx, w, h, rand, alpha = 0.05) {
  const scale = 4
  const gw = Math.ceil(w / scale)
  const gh = Math.ceil(h / scale)
  const off = document.createElement('canvas')
  off.width = gw
  off.height = gh
  const octx = off.getContext('2d')
  const data = octx.createImageData(gw, gh)
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(rand() * 255)
    data.data[i] = v
    data.data[i + 1] = v
    data.data[i + 2] = v
    data.data[i + 3] = 255
  }
  octx.putImageData(data, 0, 0)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.globalCompositeOperation = 'overlay'
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(off, 0, 0, w, h)
  ctx.restore()
}

function drawDotGrid(ctx, w, h, color, rand) {
  const gap = Math.max(w, h) / 24
  const r = Math.max(1.5, w / 540)
  ctx.save()
  ctx.fillStyle = color
  const offsetX = rand() * gap
  const offsetY = rand() * gap
  for (let x = offsetX; x < w; x += gap) {
    for (let y = offsetY; y < h; y += gap) {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawGlow(ctx, x, y, radius, hex, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
  g.addColorStop(0, rgba(hex, alpha))
  g.addColorStop(1, rgba(hex, 0))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

function drawRings(ctx, cx, cy, baseR, hex, count) {
  ctx.save()
  ctx.strokeStyle = rgba(hex, 0.22)
  for (let i = 0; i < count; i++) {
    ctx.lineWidth = Math.max(1.5, baseR / 90)
    ctx.beginPath()
    ctx.arc(cx, cy, baseR * (1 + i * 0.32), 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawMonogram(ctx, x, y, size, initial, brandHex) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  ctx.fillStyle = rgba(brandHex, 0.16)
  ctx.fill()
  ctx.lineWidth = Math.max(2, size / 26)
  ctx.strokeStyle = rgba(brandHex, 0.9)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.font = `700 ${size * 0.46}px "Space Grotesk"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(initial, x + size / 2, y + size / 2 + size * 0.02)
  ctx.restore()
}

// Cover-fit a photo into the frame (fills, crops overflow).
function coverDrawImage(ctx, img, w, h) {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

// `photo` (optional): a loaded <img> with a real AI-generated photograph used
// as the background instead of the local gradient art. The brand overlay
// (kicker, logo, headline, footer) is identical in both modes.
export async function composeBrandImage({ prompt, width, height, client, post, attempt = 0, photo = null }) {
  await ensureFonts()

  const brand = client.brand || {}
  const palette = (brand.colors || []).filter(Boolean)
  const c1 = palette[0] || client.color || '#FF6B35'
  const c2 = palette[1] || '#2DD4BF'
  const c3 = palette[2] || c1

  const rand = mulberry32(hashString(`${prompt}::${attempt}`))
  const logo = await loadLogo(brand.logoUrl)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const pad = Math.round(Math.min(width, height) * 0.085)
  const isTall = height / width > 1.4
  const variant = Math.floor(rand() * 3) // 0 beam, 1 orbit, 2 arc

  const cx = width / 2
  const cy = height / 2
  const reach = Math.max(width, height)

  if (photo) {
    // -- real photo background + scrims that keep the overlay text readable
    coverDrawImage(ctx, photo, width, height)
    // top scrim under kicker + logo
    const top = ctx.createLinearGradient(0, 0, 0, height * 0.32)
    top.addColorStop(0, 'rgba(7,9,15,0.62)')
    top.addColorStop(1, 'rgba(7,9,15,0)')
    ctx.fillStyle = top
    ctx.fillRect(0, 0, width, height * 0.32)
    // bottom scrim under headline + footer
    const bottom = ctx.createLinearGradient(0, height * 0.4, 0, height)
    bottom.addColorStop(0, 'rgba(7,9,15,0)')
    bottom.addColorStop(0.55, 'rgba(7,9,15,0.45)')
    bottom.addColorStop(1, 'rgba(7,9,15,0.85)')
    ctx.fillStyle = bottom
    ctx.fillRect(0, 0, width, height)
    // whisper of brand color so the photo still feels on-brand
    drawGlow(ctx, width * 0.9, height * 0.06, reach * 0.5, c1, 0.1)
  } else {
    // -- base: deep navy with a directional brand-tinted gradient
    const angle = rand() * Math.PI * 2
    const gx = Math.cos(angle) * reach
    const gy = Math.sin(angle) * reach
    const base = ctx.createLinearGradient(cx - gx, cy - gy, cx + gx, cy + gy)
    base.addColorStop(0, '#0A0D16')
    base.addColorStop(0.55, '#0D1220')
    base.addColorStop(1, '#101a2e')
    ctx.fillStyle = base
    ctx.fillRect(0, 0, width, height)

    // -- layered brand glows
    drawGlow(ctx, width * (0.75 + rand() * 0.2), height * (0.05 + rand() * 0.2), reach * 0.75, c1, 0.32)
    drawGlow(ctx, width * (0.02 + rand() * 0.2), height * (0.8 + rand() * 0.15), reach * 0.7, c2, 0.26)
    if (palette.length > 2) drawGlow(ctx, width * 0.5, height * 0.5, reach * 0.5, c3, 0.1)

    // -- geometry per variant
    if (variant === 0) {
      // diagonal light beam
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(-Math.PI / 5 + rand() * 0.35)
      const beam = ctx.createLinearGradient(0, -reach, 0, reach)
      beam.addColorStop(0, rgba(c1, 0))
      beam.addColorStop(0.5, rgba(c1, 0.14))
      beam.addColorStop(1, rgba(c2, 0))
      ctx.fillStyle = beam
      ctx.fillRect(-reach, -reach * 0.18, reach * 2, reach * 0.36)
      ctx.restore()
    } else if (variant === 1) {
      // orbit rings top-right
      drawRings(ctx, width * (0.82 + rand() * 0.12), height * (0.12 + rand() * 0.1), Math.min(width, height) * 0.16, c2, 3)
      ctx.beginPath()
      ctx.arc(width * 0.85, height * 0.14, Math.min(width, height) * 0.035, 0, Math.PI * 2)
      ctx.fillStyle = rgba(c1, 0.85)
      ctx.fill()
    } else {
      // sweeping arc
      ctx.save()
      ctx.lineWidth = Math.max(3, width / 220)
      const arcGrad = ctx.createLinearGradient(0, 0, width, height)
      arcGrad.addColorStop(0, rgba(c1, 0.75))
      arcGrad.addColorStop(1, rgba(c2, 0.35))
      ctx.strokeStyle = arcGrad
      ctx.beginPath()
      ctx.arc(width * 1.05, height * (isTall ? 0.32 : 0.9), reach * 0.55, Math.PI * 0.6, Math.PI * 1.5)
      ctx.stroke()
      ctx.restore()
    }

    // -- texture
    drawDotGrid(ctx, width, height, 'rgba(255,255,255,0.05)', rand)
    drawGrain(ctx, width, height, rand, 0.05)

    // -- vignette so type always sits on dark
    const vig = ctx.createLinearGradient(0, height * 0.35, 0, height)
    vig.addColorStop(0, 'rgba(7,9,15,0)')
    vig.addColorStop(1, 'rgba(7,9,15,0.72)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, width, height)
  }

  // -- kicker (client + platform), top-left, mono small caps
  const kickerSize = Math.round(Math.min(width, height) * 0.026)
  ctx.font = `500 ${kickerSize}px "JetBrains Mono"`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  const kicker = `${client.name}  •  ${(post.platform || 'social').toUpperCase()}`
  ctx.save()
  ctx.letterSpacing = `${Math.round(kickerSize * 0.22)}px`
  ctx.fillText(kicker.toUpperCase(), pad, pad + kickerSize)
  ctx.restore()
  // accent tick before kicker
  ctx.fillStyle = rgba(c1, 0.95)
  ctx.fillRect(pad, pad + kickerSize * 1.7, kickerSize * 2.6, Math.max(3, kickerSize * 0.16))

  // -- logo slot, top-right
  const logoSize = Math.round(Math.min(width, height) * 0.11)
  if (logo) {
    const ratio = logo.width / logo.height
    const lw = ratio >= 1 ? logoSize * 1.4 : logoSize * ratio
    const lh = ratio >= 1 ? (logoSize * 1.4) / ratio : logoSize
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = logoSize * 0.2
    ctx.drawImage(logo, width - pad - lw, pad, lw, lh)
    ctx.restore()
  } else {
    drawMonogram(ctx, width - pad - logoSize, pad, logoSize, (client.name || 'A').charAt(0).toUpperCase(), c1)
  }

  // -- headline: the post title (or first line of caption / prompt)
  const headlineSource =
    (post.title || '').trim() ||
    (post.caption || '').split(/[.!?\n]/)[0].trim() ||
    prompt.split(/[.,\n]/)[0].trim() ||
    'New post'
  const headline = headlineSource.length > 90 ? headlineSource.slice(0, 87) + '…' : headlineSource
  const maxWidth = width - pad * 2
  const zoneH = height * (isTall ? 0.3 : 0.38)
  const { size, lines, lineHeight } = fitHeadline(ctx, headline, maxWidth, zoneH, isTall ? 5 : 3)

  const supportSize = Math.round(Math.min(width, height) * 0.024)
  const support = (post.caption || '').trim() && headlineSource !== (post.caption || '').trim()
    ? (post.caption || '').split('\n')[0].slice(0, 120)
    : ''

  const footerH = kickerSize * 3.4
  let ty = height - pad - footerH - (support ? supportSize * 2.4 : 0) - (lines.length - 1) * lineHeight
  ctx.font = `700 ${size}px "Space Grotesk"`
  ctx.fillStyle = 'rgba(255,255,255,0.97)'
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = size * 0.18
  ctx.shadowOffsetY = size * 0.03
  for (const line of lines) {
    ctx.fillText(line, pad, ty)
    ty += lineHeight
  }
  ctx.restore()

  // -- supporting caption line
  if (support && support.toLowerCase() !== headline.toLowerCase()) {
    ctx.font = `500 ${supportSize}px "Space Grotesk"`
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(
      support.length > 110 ? support.slice(0, 107) + '…' : support,
      pad,
      ty - lineHeight + supportSize * 1.9,
    )
  }

  // -- footer: divider + format tag left, brand chips right
  const footY = height - pad
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'
  ctx.lineWidth = Math.max(1, width / 1080)
  ctx.beginPath()
  ctx.moveTo(pad, footY - kickerSize * 1.9)
  ctx.lineTo(width - pad, footY - kickerSize * 1.9)
  ctx.stroke()

  ctx.font = `500 ${Math.round(kickerSize * 0.92)}px "JetBrains Mono"`
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.save()
  ctx.letterSpacing = `${Math.round(kickerSize * 0.16)}px`
  ctx.fillText((post.format || 'STATIC').toUpperCase(), pad, footY - kickerSize * 0.4)
  ctx.restore()

  const chipR = kickerSize * 0.5
  const chips = palette.length ? palette.slice(0, 4) : [c1, c2]
  chips.forEach((hex, i) => {
    const chipX = width - pad - chipR - i * chipR * 2.9
    ctx.beginPath()
    ctx.arc(chipX, footY - kickerSize * 0.75, chipR, 0, Math.PI * 2)
    ctx.fillStyle = hex
    ctx.fill()
    if (luminance(hex) < 0.12) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  })

  // Photo composites are stored as JPEG — a photographic PNG data URL would be
  // several times larger in IndexedDB for no visible gain.
  return photo ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png')
}

// ---------------------------------------------------------------------------
// Structured composer: a professional top-to-bottom content layout —
// logo → eyebrow → heading → paragraph → bullet title → bullets → CTA —
// rendered over a subtle brand-colored background. Used by the dashboard
// Quick Image Studio.
// ---------------------------------------------------------------------------

const mixWithWhite = (hex, amount) => {
  const { r, g, b } = hexToRgb(hex)
  const mix = (c) => Math.round(c + (255 - c) * amount)
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`
}

// Brand color made bright enough to read on the dark background.
const readableAccent = (hex) => {
  const lum = luminance(hex)
  if (lum >= 0.55) return rgba(hex, 1)
  return mixWithWhite(hex, Math.min(0.7, (0.55 - lum) * 1.6 + 0.15))
}

export const BACKGROUND_STYLES = [
  { id: 'photo', label: '📷 AI photo' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'mesh', label: 'Mesh' },
  { id: 'grid', label: 'Tech grid' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'solid', label: 'Solid' },
]

// Additive glow — composites with 'lighter' so brand color adds light to the
// dark base instead of muddying toward brown.
function addGlow(ctx, x, y, radius, hex, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
  g.addColorStop(0, rgba(hex, alpha))
  g.addColorStop(1, rgba(hex, 0))
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = g
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
}

function fillBase(ctx, w, h, top = '#0A0D16', bottom = '#0E1626') {
  const base = ctx.createLinearGradient(0, 0, w * 0.35, h)
  base.addColorStop(0, top)
  base.addColorStop(1, bottom)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
}

// Renders a premium background in one of several styles. Text is drawn left,
// so every style keeps the left ~60% calm and dark for legibility.
function drawBackground(ctx, { style, width: w, height: h, c1, c2, palette, rand }) {
  const reach = Math.max(w, h)

  if (style === 'solid') {
    fillBase(ctx, w, h, '#0B0F1A', '#0B0F1A')
    // faint accent hairline down the left edge
    ctx.fillStyle = rgba(c1, 0.9)
    ctx.fillRect(0, 0, Math.max(4, w / 220), h)
    return
  }

  if (style === 'minimal') {
    fillBase(ctx, w, h, '#0A0D16', '#0C111E')
    addGlow(ctx, w * 0.96, h * 0.06, reach * 0.5, c1, 0.28)
    drawGrain(ctx, w, h, rand, 0.03)
    return
  }

  if (style === 'grid') {
    fillBase(ctx, w, h, '#090C14', '#0C1220')
    // perspective-free tech grid, fading toward the bottom-left text zone
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = Math.max(1, w / 1400)
    const gap = reach / 16
    for (let x = gap; x < w; x += gap) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = gap; y < h; y += gap) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    ctx.restore()
    addGlow(ctx, w * 0.9, h * 0.12, reach * 0.55, c1, 0.3)
    addGlow(ctx, w * 0.15, h * 0.95, reach * 0.4, c2, 0.16)
    // fade the grid out on the left where text sits
    const fade = ctx.createLinearGradient(0, 0, w * 0.7, 0)
    fade.addColorStop(0, 'rgba(9,12,20,0.85)')
    fade.addColorStop(1, 'rgba(9,12,20,0)')
    ctx.fillStyle = fade
    ctx.fillRect(0, 0, w, h)
    return
  }

  if (style === 'spotlight') {
    fillBase(ctx, w, h, '#0A0E18', '#080B13')
    addGlow(ctx, w * 0.5, h * -0.12, reach * 0.9, c1, 0.26)
    addGlow(ctx, w * 0.5, h * -0.12, reach * 0.5, c2, 0.12)
    drawGrain(ctx, w, h, rand, 0.04)
    return
  }

  if (style === 'mesh') {
    fillBase(ctx, w, h, '#0A0D16', '#0D1424')
    const cols = palette.length >= 2 ? palette : [c1, c2, c1]
    const blobs = [
      { x: 0.9, y: 0.1, r: 0.6, a: 0.3 },
      { x: 0.1, y: 0.85, r: 0.55, a: 0.24 },
      { x: 0.75, y: 0.9, r: 0.4, a: 0.16 },
      { x: 0.35, y: 0.2, r: 0.35, a: 0.12 },
    ]
    blobs.forEach((b, i) => addGlow(ctx, w * b.x, h * b.y, reach * b.r, cols[i % cols.length], b.a))
    drawDotGrid(ctx, w, h, 'rgba(255,255,255,0.04)', rand)
    drawGrain(ctx, w, h, rand, 0.04)
    return
  }

  // default: 'aurora' — smooth diagonal brand bands + soft corner glows
  fillBase(ctx, w, h, '#0A0D16', '#0D1322')
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const band = ctx.createLinearGradient(0, 0, w, h)
  band.addColorStop(0, rgba(c1, 0.14))
  band.addColorStop(0.5, rgba(c2, 0.05))
  band.addColorStop(1, rgba(c1, 0.0))
  ctx.fillStyle = band
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
  addGlow(ctx, w * 0.88, h * 0.05, reach * 0.6, c1, 0.34)
  addGlow(ctx, w * 0.05, h * 0.92, reach * 0.5, c2, 0.2)
  // faint concentric arc, top-right
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.lineWidth = Math.max(2, w / 360)
  ctx.strokeStyle = rgba(c1, 0.18)
  ctx.beginPath()
  ctx.arc(w * 1.02, h * -0.02, reach * (0.3 + rand() * 0.08), Math.PI * 0.42, Math.PI * 1.05)
  ctx.stroke()
  ctx.restore()
  drawDotGrid(ctx, w, h, 'rgba(255,255,255,0.045)', rand)
  drawGrain(ctx, w, h, rand, 0.04)
}

export async function composeStructuredImage({ content, width, height, client, attempt = 0 }) {
  await ensureFonts()

  const brand = client.brand || {}
  const palette = (brand.colors || []).filter(Boolean)
  const c1 = palette[0] || client.color || '#FF6B35'
  const c2 = palette[1] || '#2DD4BF'

  const eyebrow = (content.eyebrow || '').trim()
  const heading = (content.heading || '').trim() || 'Your headline here'
  const paragraph = (content.paragraph || '').trim()
  const bulletsTitle = (content.bulletsTitle || '').trim()
  const bullets = (content.bullets || []).map((b) => b.trim()).filter(Boolean).slice(0, 6)
  const cta = (content.cta || '').trim()

  const rand = mulberry32(hashString(`${heading}::${attempt}`))
  const logo =
    (await loadLogo(content.logoData)) || (await loadLogo(brand.logoUrl)) || null

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const u = Math.min(width, height) / 1080
  const pad = Math.round(Math.min(width, height) * 0.085)
  const isWide = width / height > 1.5
  // On wide banners keep text to ~62% so the composition breathes.
  const contentW = isWide ? Math.round(width * 0.62) : width - pad * 2

  // ---- background ----
  const isPhoto = Boolean(content.photo)
  if (isPhoto) {
    // real AI photograph as the canvas — scrims below keep the copy readable
    coverDrawImage(ctx, content.photo, width, height)
  } else {
    drawBackground(ctx, {
      style: content.background || 'aurora',
      width,
      height,
      c1,
      c2,
      palette,
      rand,
    })
  }
  // legibility scrim: darken the left/bottom where text sits, so any background
  // style keeps strong contrast under the copy (stronger over a photo)
  const scrim = ctx.createLinearGradient(0, 0, width, 0)
  scrim.addColorStop(0, `rgba(7,9,15,${isPhoto ? 0.78 : 0.55})`)
  scrim.addColorStop(0.55, `rgba(7,9,15,${isPhoto ? 0.42 : 0.15})`)
  scrim.addColorStop(1, `rgba(7,9,15,${isPhoto ? 0.12 : 0})`)
  ctx.fillStyle = scrim
  ctx.fillRect(0, 0, width, height)
  const vig = ctx.createLinearGradient(0, height * 0.45, 0, height)
  vig.addColorStop(0, 'rgba(7,9,15,0)')
  vig.addColorStop(1, `rgba(7,9,15,${isPhoto ? 0.7 : 0.55})`)
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, width, height)

  const accent = readableAccent(c1)
  const accent2 = readableAccent(c2)

  // ---- fit pass: shrink type scale until the stack fits above the CTA row ----
  const ctaH = (s) => (cta ? Math.round(86 * u * s) : 0)
  const measure = (s) => {
    let total = 0
    // logo block, or the monogram fallback — both take vertical space
    total += logo ? Math.min(110 * u * s, height * 0.12) + 46 * u * s : 84 * u * s + 42 * u * s
    if (eyebrow) total += 30 * u * s + 30 * u * s
    ctx.font = `700 ${Math.round(82 * u * s)}px "Space Grotesk"`
    const headLines = wrapText(ctx, heading, contentW).slice(0, 4)
    total += headLines.length * 82 * u * s * 1.1 + 30 * u * s
    if (paragraph) {
      ctx.font = `500 ${Math.round(34 * u * s)}px "Space Grotesk"`
      const pLines = wrapText(ctx, paragraph, contentW).slice(0, 5)
      total += pLines.length * 34 * u * s * 1.5 + 36 * u * s
    }
    if (bulletsTitle) total += 36 * u * s + 24 * u * s
    if (bullets.length) {
      ctx.font = `500 ${Math.round(33 * u * s)}px "Space Grotesk"`
      for (const b of bullets) {
        const lines = wrapText(ctx, b, contentW - 52 * u * s).slice(0, 2)
        total += lines.length * 33 * u * s * 1.42 + 18 * u * s
      }
      total += 20 * u * s
    }
    return total
  }
  let scale = 1
  const available = () => height - pad * 2 - (cta ? ctaH(scale) + 40 * u * scale : 28 * u)
  while (measure(scale) > available() && scale > 0.55) scale *= 0.94
  const s = scale

  // ---- draw the stack, vertically centered in the space above the CTA ----
  const leftover = Math.max(0, available() - measure(s))
  let y = pad + leftover / 2

  if (logo) {
    const maxH = Math.min(110 * u * s, height * 0.12)
    const ratio = logo.width / logo.height || 1
    let lh = maxH
    let lw = lh * ratio
    if (lw > width * 0.34) {
      lw = width * 0.34
      lh = lw / ratio
    }
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 14 * u * s
    ctx.drawImage(logo, pad, y, lw, lh)
    ctx.restore()
    y += maxH + 46 * u * s
  } else {
    drawMonogram(ctx, pad, y, 84 * u * s, (client.name || 'A').charAt(0).toUpperCase(), c1)
    y += 84 * u * s + 42 * u * s
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  if (eyebrow) {
    const size = Math.round(28 * u * s)
    ctx.font = `600 ${size}px "JetBrains Mono"`
    ctx.fillStyle = accent
    ctx.save()
    ctx.letterSpacing = `${Math.round(size * 0.28)}px`
    ctx.fillText(eyebrow.toUpperCase(), pad, y + size)
    ctx.restore()
    y += size + 30 * u * s
  }

  {
    const size = Math.round(82 * u * s)
    ctx.font = `700 ${size}px "Space Grotesk"`
    const lines = wrapText(ctx, heading, contentW).slice(0, 4)
    ctx.fillStyle = 'rgba(255,255,255,0.97)'
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowBlur = size * 0.14
    for (const line of lines) {
      y += size * 1.1
      ctx.fillText(line, pad, y)
    }
    ctx.restore()
    y += 30 * u * s
  }

  if (paragraph) {
    const size = Math.round(34 * u * s)
    ctx.font = `500 ${size}px "Space Grotesk"`
    let lines = wrapText(ctx, paragraph, contentW)
    if (lines.length > 5) {
      lines = lines.slice(0, 5)
      lines[4] = lines[4].replace(/\s+\S*$/, '') + '…'
    }
    ctx.fillStyle = 'rgba(255,255,255,0.87)'
    for (const line of lines) {
      y += size * 1.5
      ctx.fillText(line, pad, y)
    }
    y += 36 * u * s
  }

  if (bulletsTitle) {
    const size = Math.round(36 * u * s)
    ctx.font = `600 ${size}px "Space Grotesk"`
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    y += size
    ctx.fillText(bulletsTitle, pad, y)
    // small accent rule under the title
    ctx.fillStyle = rgba(c1, 0.9)
    ctx.fillRect(pad, y + 12 * u * s, 64 * u * s, Math.max(3, 5 * u * s))
    y += 24 * u * s + 12 * u * s
  }

  if (bullets.length) {
    const size = Math.round(33 * u * s)
    const indent = 52 * u * s
    ctx.font = `500 ${size}px "Space Grotesk"`
    for (const b of bullets) {
      const lines = wrapText(ctx, b, contentW - indent).slice(0, 2)
      // marker vertically centered on the first line of text
      ctx.beginPath()
      ctx.arc(pad + 11 * u * s, y + size * 1.42 - size * 0.34, 9 * u * s, 0, Math.PI * 2)
      ctx.fillStyle = accent2
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      for (const line of lines) {
        y += size * 1.42
        ctx.fillText(line, pad + indent, y)
      }
      y += 18 * u * s
    }
    y += 20 * u * s
  }

  // ---- CTA pill + brand footer, anchored at the bottom ----
  if (cta) {
    const pillH = ctaH(s)
    const textSize = Math.round(32 * u * s)
    ctx.font = `600 ${textSize}px "Space Grotesk"`
    const textW = ctx.measureText(cta).width
    const pillW = Math.min(textW + 72 * u * s, width - pad * 2)
    const pillY = height - pad - pillH
    ctx.save()
    ctx.shadowColor = rgba(c1, 0.45)
    ctx.shadowBlur = 28 * u * s
    ctx.beginPath()
    ctx.roundRect(pad, pillY, pillW, pillH, pillH / 2)
    ctx.fillStyle = c1
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = luminance(c1) > 0.42 ? '#0A0D16' : 'rgba(255,255,255,0.97)'
    ctx.textBaseline = 'middle'
    ctx.fillText(cta, pad + 36 * u * s, pillY + pillH / 2 + textSize * 0.06)
    ctx.textBaseline = 'alphabetic'
  }

  // client name + palette chips bottom-right
  const footSize = Math.round(22 * u * s)
  ctx.font = `500 ${footSize}px "JetBrains Mono"`
  const nameText = client.name.toUpperCase()
  const chips = (palette.length ? palette.slice(0, 3) : [c1, c2])
  const chipR = footSize * 0.34
  const chipsW = chips.length * chipR * 2.6
  const nameW = ctx.measureText(nameText).width
  const footY = height - pad - footSize * 0.4
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.save()
  ctx.letterSpacing = `${Math.round(footSize * 0.18)}px`
  ctx.fillText(nameText, width - pad - nameW - chipsW - 18 * u * s, footY)
  ctx.restore()
  chips.forEach((hex, i) => {
    ctx.beginPath()
    ctx.arc(width - pad - chipsW + i * chipR * 2.6 + chipR, footY - footSize * 0.3, chipR, 0, Math.PI * 2)
    ctx.fillStyle = hex
    ctx.fill()
  })

  return isPhoto ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png')
}

// Builds a descriptive prompt from the caption + brand kit for the prompt box.
export function buildPromptFromBrand({ post, client, sizeLabel }) {
  const brand = client.brand || {}
  const colors = (brand.colors || []).filter(Boolean)
  const parts = []
  parts.push(`Social media graphic for ${client.name}: "${(post.title || 'untitled post').trim()}".`)
  const captionLine = (post.caption || '').split('\n')[0].trim()
  if (captionLine) parts.push(`Key message: ${captionLine}`)
  if (colors.length) parts.push(`Brand palette: ${colors.join(', ')} on a deep navy background.`)
  if (brand.tone) parts.push(`Tone of voice: ${brand.tone.split('\n')[0].trim()}.`)
  if (brand.fonts) parts.push(`Typography inspired by ${brand.fonts.split('\n')[0].trim()}.`)
  parts.push(`Layout: bold headline, generous whitespace, subtle gradients, ${sizeLabel} format.`)
  return parts.join(' ')
}
