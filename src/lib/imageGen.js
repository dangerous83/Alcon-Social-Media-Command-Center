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

export async function composeBrandImage({ prompt, width, height, client, post, attempt = 0 }) {
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

  // -- base: deep navy with a directional brand-tinted gradient
  const angle = rand() * Math.PI * 2
  const cx = width / 2
  const cy = height / 2
  const reach = Math.max(width, height)
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

  return canvas.toDataURL('image/png')
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
