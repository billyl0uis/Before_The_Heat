// The cane field: a hex-packed field where every cell is the user's own
// murrine, banded in spirals around a vortex — ported from the VORTEX
// GARDEN sketch. Framework-free: it draws onto a canvas it's handed and
// knows nothing about React.

// VORTEX GARDEN palettes, one band sequence per section.
export const SECTION_BANDS = {
  murrini: ['#e3501c', '#f7c21a', '#f2762e', '#2c3fb0', '#fbe016', '#a2321f', '#f6f2e6', '#5ec1e8'],
  plan: ['#1430d8', '#fefe59', '#c83329', '#ffffff', '#4f7cff', '#eceab7', '#e8892b'],
  vessel: ['#2f6fd1', '#f2f0ea', '#e6c23a', '#c8462a', '#8fd14f', '#b8702c', '#3fb0d0', '#e86aa8'],
  learn: ['#f7c21a', '#e3501c', '#2c3fb0', '#3b7be0', '#fbe016', '#a2321f', '#f6f2e6', '#5ec1e8'],
}
SECTION_BANDS.vault = SECTION_BANDS.learn
SECTION_BANDS.about = SECTION_BANDS.learn

const GLYPHS = ['murrine', 'rings', 'pixel', 'spark']
const rnd = (a, b) => a + Math.random() * (b - a)
const pick = (list) => list[Math.floor(Math.random() * list.length)]

// A fresh hand for each loading moment, the way the sketch's
// applyPalette() reshuffles: band order, twist, density, glyph, wander.
export function rollField(bands) {
  const sequence = []
  let previous = null
  for (let i = 0, n = Math.floor(rnd(10, 18)); i < n; i++) {
    let colour = Math.random() < 0.35 ? bands[0] : pick(bands)
    if (colour === previous) colour = bands[(bands.indexOf(colour) + 1) % bands.length]
    sequence.push(colour)
    previous = colour
  }
  return {
    sequence,
    twist: rnd(1.5, 5) * pick([-1, 1]),
    band: rnd(0.012, 0.03),
    glyph: Math.random() < 0.4 ? 'murrine' : pick(GLYPHS.slice(1)),
    spacing: rnd(28, 38),
    wander: [rnd(0, 6.28), rnd(0, 6.28), rnd(0.1, 0.2)],
  }
}

// The Plan header's still frame: the real design, its real twist, the
// section's own palette in order. Nothing random.
export function stillField(bands, twistDegrees, width, height) {
  return {
    sequence: bands,
    twist: twistDegrees / 90 || 1.2,
    band: 0.018,
    glyph: 'murrine',
    spacing: Math.max(18, Math.min(30, Math.sqrt((width * height) / 1500))),
    wander: [0, 0, 0.2],
  }
}

const MAX_SCALE = 1 // a cell never grows past its pre-drawn size, so it's never upscaled

function buildAtlas(config, sprite, colours, dpr) {
  const glyphSize = config.spacing * MAX_SCALE * dpr
  const size = Math.ceil(glyphSize * 1.3)
  const half = size / 2
  const atlas = config.sequence.map((colour, i) => {
    const colour2 = config.sequence[(i + 1) % config.sequence.length]
    const cell = document.createElement('canvas')
    cell.width = cell.height = size
    const g = cell.getContext('2d')
    g.translate(half, half)
    if (config.glyph === 'murrine') {
      g.fillStyle = colour
      g.globalAlpha = 0.9
      g.beginPath()
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 6 + (k * Math.PI) / 3
        g.lineTo(Math.cos(a) * glyphSize * 0.56, Math.sin(a) * glyphSize * 0.56)
      }
      g.fill()
      g.globalAlpha = 1
      if (sprite) g.drawImage(sprite, -glyphSize * 0.4, -glyphSize * 0.4, glyphSize * 0.8, glyphSize * 0.8)
    } else if (config.glyph === 'rings') {
      for (const [fill, r] of [
        [colours.outer, 0.48],
        [colour, 0.36],
        [colours.middle, 0.24],
        [colours.core, 0.12],
      ]) {
        g.fillStyle = fill
        g.beginPath()
        g.arc(0, 0, glyphSize * r, 0, Math.PI * 2)
        g.fill()
      }
    } else if (config.glyph === 'pixel') {
      g.fillStyle = colour
      g.beginPath()
      g.arc(0, 0, glyphSize * 0.46, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = colours.core
      g.beginPath()
      g.arc(0, 0, glyphSize * 0.14, 0, Math.PI * 2)
      g.fill()
    } else {
      g.strokeStyle = colour
      g.lineWidth = Math.max(1, glyphSize * 0.09)
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(-glyphSize * 0.55, 0)
      g.lineTo(glyphSize * 0.42, 0)
      g.stroke()
      g.fillStyle = colour2
      g.beginPath()
      g.arc(glyphSize * 0.48, 0, glyphSize * 0.14, 0, Math.PI * 2)
      g.fill()
    }
    return cell
  })
  return { atlas, half }
}

// Starts the field on `canvas`. With `animate`, it runs for `durationMs`,
// follows `pointer` (client coords, updated by the caller) and drops a
// vortex + ripple on click; without, it draws one still frame.
// Returns a stop() function.
export function runCaneField(
  canvas,
  { config, sprite, colours, ground, animate = false, durationMs = 1100, pointer = null, dprCap = 1.5 },
) {
  const dpr = Math.min(dprCap, window.devicePixelRatio || 1)
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  const g = canvas.getContext('2d')
  const { atlas, half } = buildAtlas(config, sprite, colours, dpr)
  const sp = config.spacing
  const seq = config.sequence

  const cells = []
  for (let r = 0, y = 0; y < height + sp; r++, y += sp * 0.866) {
    for (let x = (r % 2) * (sp / 2); x < width + sp; x += sp) cells.push({ x, y, a: 0, s: 0.62 })
  }

  const box = canvas.getBoundingClientRect()
  const local = () => (pointer && pointer.x != null ? { x: pointer.x - box.left, y: pointer.y - box.top } : null)
  const start = animate ? local() : null
  const main = start ? { ...start, tx: start.x, ty: start.y } : { x: width * 0.62, y: height * 0.55, tx: width * 0.62, ty: height * 0.55 }
  const vortices = []
  const ripples = start ? [{ x: start.x, y: start.y, t0: 0 }] : []
  const t0 = performance.now()
  let frameId = 0

  const onDown = (event) => {
    const x = event.clientX - box.left
    const y = event.clientY - box.top
    vortices.push({ x, y, s: rnd(0.7, 1.2), spin: pick([-1, 1]), life: 1 })
    if (vortices.length > 2) vortices.shift()
    ripples.push({ x, y, t0: (performance.now() - t0) / 1000 })
  }
  if (animate) canvas.addEventListener('pointerdown', onDown)

  const frame = (now) => {
    const t = animate ? (now - t0) / 1000 : 2.2
    const [p1, p2, wf] = config.wander
    const here = local()
    if (animate && here && now - pointer.t < 1500) {
      main.tx = here.x
      main.ty = here.y
    } else if (animate) {
      main.tx = width * (0.5 + 0.3 * Math.sin(t * wf * 4 + p1))
      main.ty = height * (0.5 + 0.28 * Math.sin(t * wf * 3 + p2))
    }
    const ease = animate ? 0.12 : 1
    main.x += (main.tx - main.x) * ease
    main.y += (main.ty - main.y) * ease

    const all = [{ x: main.x, y: main.y, s: 1.4, spin: Math.sign(config.twist) || 1, life: 1 }, ...vortices]
    const R = Math.min(width, height) * 0.6
    const live = ripples.filter((r) => t - r.t0 < 3.5)

    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.fillStyle = ground
    g.fillRect(0, 0, width, height)

    for (const c of cells) {
      let vx = 0
      let vy = 0
      let nd = Infinity
      let na = 0
      for (const v of all) {
        const dx = c.x - v.x
        const dy = c.y - v.y
        const d = Math.hypot(dx, dy) + 1
        const w = (v.s * v.life) / (1 + (d * d) / (R * R))
        vx += (-dy / d) * w * v.spin - (dx / d) * w * 0.25
        vy += (dx / d) * w * v.spin - (dy / d) * w * 0.25
        if (d / (v.s * v.life) < nd) {
          nd = d / (v.s * v.life)
          na = Math.atan2(dy, dx)
        }
      }
      let da = Math.atan2(vy, vx) - c.a
      da = Math.atan2(Math.sin(da), Math.cos(da))
      c.a += animate ? da * 0.2 : da

      let boost = 0
      for (const r of live) {
        const age = t - r.t0
        const d = Math.hypot(c.x - r.x, c.y - r.y) - age * 420
        if (d * d < 16000) boost += Math.exp(-(d * d) / 1800) * (1 - age / 3.5) * 1.1
      }
      const near = 1 - Math.min(1, nd / R)
      c.s += (Math.min(MAX_SCALE, 0.62 + near * 0.32 + Math.min(boost, 0.2)) - c.s) * (animate ? 0.25 : 1)

      // Spiral bands: distance plus angle, the way a twisted cane reads end-on.
      const phase = (nd * config.band * 10) / (sp / 2) + (na / (Math.PI * 2)) * config.twist * (seq.length / 4) - t * 0.35
      const bi = ((Math.floor(phase) % seq.length) + seq.length) % seq.length

      // One stamp per cell: rotate and scale evenly, never stretch.
      const k = c.s / MAX_SCALE
      const co = Math.cos(c.a) * k
      const si = Math.sin(c.a) * k
      g.setTransform(co, si, -si, co, c.x * dpr, c.y * dpr)
      g.drawImage(atlas[bi], -half, -half)
    }
    for (const v of vortices) v.life -= 1 / 60 / 6

    if (animate && now - t0 < durationMs) frameId = requestAnimationFrame(frame)
  }
  // A still frame is drawn immediately: it has nothing to wait a frame for,
  // and a background or throttled tab may not deliver one at all.
  if (animate) frameId = requestAnimationFrame(frame)
  else frame(performance.now())

  return () => {
    cancelAnimationFrame(frameId)
    canvas.removeEventListener('pointerdown', onDown)
  }
}
