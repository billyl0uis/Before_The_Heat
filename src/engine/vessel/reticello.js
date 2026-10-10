// Real reticello: two separately-pulled "rib" canes, each twisted in
// opposite directions, are each blown into a cup-shaped bubble; one is
// nested inside the other and the assembly is inflated until the bubbles
// meet. Where the two thread grids cross, the high points of the ribs
// touch first and fuse solid; the diamond-shaped gap *between* those
// crossings is where air gets trapped as the bubbles seal together, so
// each bubble sits centred in a gap between threads, not on a crossing.
// (Construction verified against conciatore.org's reticello account,
// corroborated by Corning Museum of Glass and Caneworking references.)
//
// Painted onto the vessel's outside-wall texture, where u runs round the
// wall and v up its length (see engine/vessel/pickup.js measureWall), and
// drawn in millimetres so threads and bubbles come out their real size.

const THREAD_MM = 1.1
const STRIPE_STEP_MM = 1.5
const ANGLE_DEG = 42

function luminance(hex) {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

// `ribsAround` counts both rib canes together: half spiral each way.
export function paintReticelloSkin(ctx, size, wall, { ribsAround, colorA, colorB }) {
  ctx.clearRect(0, 0, size, size)
  const perSide = Math.max(4, Math.round(ribsAround / 2))
  const circumference = 2 * Math.PI * wall.meanRadius
  const length = wall.length
  // How far round the wall one thread drifts from base to rim, in turns.
  const drift = (length * Math.tan((ANGLE_DEG * Math.PI) / 180)) / circumference
  const pxU = size / circumference
  const pxV = size / length
  const toPx = (xMm, yMm) => [xMm * pxU, size - yMm * pxV]
  const reach = Math.ceil(drift) + 1

  const drawThreads = (sign, color) => {
    // Along the thread and across it, in mm.
    const along = [sign * drift * circumference, length]
    const alongLength = Math.hypot(...along)
    const dir = [along[0] / alongLength, along[1] / alongLength]
    const across = [-dir[1], dir[0]]
    const half = THREAD_MM / 2
    // Twisted filigree shows as a fine diagonal stripe along the thread:
    // light on a dark thread, dark on a light one.
    const stripe = luminance(color) > 0.55 ? 'rgba(20,30,50,0.32)' : 'rgba(255,255,255,0.42)'

    for (let i = 0; i < perSide; i++) {
      for (let wrap = -reach; wrap <= reach; wrap++) {
        const x0 = (i / perSide + wrap) * circumference
        const xEnd = x0 + along[0]
        if (Math.max(x0, xEnd) + 2 < 0 || Math.min(x0, xEnd) - 2 > circumference) continue

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(...toPx(x0 + across[0] * half, across[1] * half))
        ctx.lineTo(...toPx(xEnd + across[0] * half, length + across[1] * half))
        ctx.lineTo(...toPx(xEnd - across[0] * half, length - across[1] * half))
        ctx.lineTo(...toPx(x0 - across[0] * half, -across[1] * half))
        ctx.closePath()
        ctx.fill()

        ctx.strokeStyle = stripe
        ctx.lineWidth = Math.max(1, 0.28 * pxU)
        ctx.beginPath()
        for (let t = 0; t < alongLength; t += STRIPE_STEP_MM) {
          const cx = x0 + dir[0] * t
          const cy = dir[1] * t
          ctx.moveTo(...toPx(cx - across[0] * half * 0.8 - dir[0] * 0.4, cy - across[1] * half * 0.8 - dir[1] * 0.4))
          ctx.lineTo(...toPx(cx + across[0] * half * 0.8 + dir[0] * 0.4, cy + across[1] * half * 0.8 + dir[1] * 0.4))
        }
        ctx.stroke()
      }
    }
  }

  drawThreads(1, colorA)
  drawThreads(-1, colorB)

  // Threads one way sit at u = i/n + drift·v, the other way at
  // u = j/n − drift·v, so they cross on rows v = k / (2·drift·n). Each
  // diamond's centre is on a crossing row, halfway between two crossings.
  const spacingMm = circumference / perSide
  const bubbleMm = Math.min(2.4, Math.max(0.5, spacingMm * Math.cos((ANGLE_DEG * Math.PI) / 180) * 0.17))
  for (let k = 0; ; k++) {
    const v = k / (2 * drift * perSide)
    if (v > 1) break
    for (let i = 0; i < perSide; i++) {
      const u = ((((i + 0.5) / perSide + drift * v) % 1) + 1) % 1
      for (const shift of [-1, 0, 1]) {
        const [x, y] = toPx((u + shift) * circumference, v * length)
        const rx = bubbleMm * pxU
        const ry = bubbleMm * pxV
        if (x + rx < 0 || x - rx > size) continue
        // A trapped bubble always shows a thin edge and a bright glint,
        // whatever colour the glass around it is.
        ctx.fillStyle = 'rgba(225,238,248,0.22)'
        ctx.strokeStyle = 'rgba(10,20,40,0.45)'
        ctx.lineWidth = Math.max(1, 0.12 * pxU)
        ctx.beginPath()
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.beginPath()
        ctx.ellipse(x - rx * 0.3, y - ry * 0.3, rx * 0.28, ry * 0.28, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}
