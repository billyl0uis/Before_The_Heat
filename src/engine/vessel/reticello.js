// Real reticello: two separately-pulled "rib" canes, each twisted in
// opposite directions, are each blown into a cup-shaped bubble; one is
// nested inside the other and the assembly is inflated until the bubbles
// meet. Where the two thread grids cross, the high points of the ribs
// touch first and fuse solid; the diamond-shaped gap *between* those
// crossings is where air gets trapped as the bubbles seal together — so
// each bubble sits centered in a gap between threads, not on a crossing.
// (Construction verified against conciatore.org's reticello account,
// corroborated by Corning Museum of Glass and Caneworking references —
// see murrineTechniques.js for the cane-level techniques this session
// sourced the same way.)
//
// This is necessarily a whole-surface technique, unlike the app's
// hand-placed murrini stamps (see engine/vessel/paint.js): real reticello
// covers the entire blown piece as two fused surface layers, not discrete
// pressed slices, so it's painted as one continuous texture instead.
//
// `cellSize` must evenly divide `textureSize` for the diagonal grid to
// tile seamlessly across the vessel's UV wrap seam (u=0/u=1) — callers
// should derive it as textureSize / someIntegerDensity, not pick an
// arbitrary value.
export function paintReticelloTexture(
  ctx,
  textureSize,
  { baseColor, threadColorA, threadColorB, cellSize, threadWidth },
) {
  ctx.clearRect(0, 0, textureSize, textureSize)
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, textureSize, textureSize)

  ctx.lineWidth = threadWidth
  ctx.lineCap = 'round'

  const steps = Math.ceil((2 * textureSize) / cellSize) + 2

  // The first rib cane's threads (slope +1 diagonals).
  ctx.strokeStyle = threadColorA
  for (let i = -steps; i <= steps; i++) {
    const offset = i * cellSize
    ctx.beginPath()
    ctx.moveTo(offset, 0)
    ctx.lineTo(offset + textureSize, textureSize)
    ctx.stroke()
  }

  // The second rib cane, twisted the opposite direction (slope -1
  // diagonals) — nested inside the first and inflated until they fuse.
  ctx.strokeStyle = threadColorB
  for (let i = -steps; i <= steps; i++) {
    const offset = i * cellSize
    ctx.beginPath()
    ctx.moveTo(offset, 0)
    ctx.lineTo(offset - textureSize, textureSize)
    ctx.stroke()
  }

  // Trapped air, one bubble per diamond gap between crossings. A plain
  // white glow reads fine against a colored base, but disappears entirely
  // when the base or a thread color is itself pale or white (opal white is
  // this tool's own default thread color) -- a thin dark ring first
  // guarantees the bubble stays visible against any color combination,
  // the same way a real trapped bubble always shows a visible edge
  // regardless of the surrounding glass color.
  const bubbleRadius = Math.max(1.5, cellSize * 0.1)
  const cellCount = Math.ceil(textureSize / cellSize) + 2
  for (let row = -1; row < cellCount; row++) {
    for (let col = -1; col < cellCount; col++) {
      const cx = col * cellSize + cellSize / 2
      const cy = row * cellSize + cellSize / 2

      ctx.strokeStyle = 'rgba(0,0,0,0.25)'
      ctx.lineWidth = Math.max(1, bubbleRadius * 0.15)
      ctx.beginPath()
      ctx.arc(cx, cy, bubbleRadius, 0, Math.PI * 2)
      ctx.stroke()

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, bubbleRadius)
      gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
      gradient.addColorStop(0.7, 'rgba(255,255,255,0.5)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(cx, cy, bubbleRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
