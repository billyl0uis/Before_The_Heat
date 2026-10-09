import { drawElements } from './rasterize'
import { casingRings, CLEAR_GLASS, findColorant, ROD_WORLD_RADIUS } from './rod'
import { computeShapeReach } from './shapes'

// The finished cross-section as a 2D image: clear core, canes clipped to
// the rod, casing rings over them, transparent outside. One renderer for
// the plan sheet, the checklist thumbnails and every cell of the cane
// field, so they can never disagree with the editor.
// `backdrop` sets a neutral behind the clear core for light grounds (a
// printed sheet), where opal-white canes would otherwise vanish into paper.
// `casingUpTo` draws only layers 0..n (inside → out), so a step-by-step
// plan can show the rod as it is after each casing pass; -1 shows the bare
// bundle. Layers keep their final positions, so the slice never rescales.
export function renderSlicePlate({
  elements,
  rod,
  casing,
  size,
  target,
  backdrop = null,
  casingUpTo = Infinity,
}) {
  const canvas = target ?? document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, size, size)

  const scale = size / 2 / ROD_WORLD_RADIUS
  const { rings, contentRadius } = casingRings(rod, casing)
  ctx.save()
  ctx.translate(size / 2, size / 2)
  ctx.scale(scale, -scale)

  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, contentRadius, 0, Math.PI * 2)
  ctx.clip()
  if (backdrop) {
    ctx.fillStyle = backdrop
    ctx.fill()
  }
  ctx.fillStyle = CLEAR_GLASS.swatch
  ctx.globalAlpha = 0.28
  ctx.fill()
  ctx.globalAlpha = 1
  drawElements(ctx, elements)
  ctx.restore()

  rings.forEach((ring, index) => {
    if (index > casingUpTo) return
    const colorant = findColorant(ring.colorantId)
    ctx.beginPath()
    ctx.arc(0, 0, ring.outer, 0, Math.PI * 2)
    ctx.arc(0, 0, ring.inner, 0, Math.PI * 2, true)
    // On a backdrop plate, clear casing is shaded exactly like the clear
    // core, so the same glass never reads as two different colours.
    if (backdrop && colorant?.id === CLEAR_GLASS.id) {
      ctx.globalAlpha = 1
      ctx.fillStyle = backdrop
      ctx.fill('evenodd')
      ctx.globalAlpha = 0.28
      ctx.fillStyle = CLEAR_GLASS.swatch
      ctx.fill('evenodd')
      return
    }
    ctx.fillStyle = colorant?.swatch ?? '#888888'
    ctx.globalAlpha = colorant?.family === 'transparent' ? 0.82 : 1
    ctx.fill('evenodd')
  })
  ctx.globalAlpha = 1
  ctx.restore()
  return canvas
}

// One cane on its own, centred and scaled to fit: the thumbnail for a
// "pull this cane" step.
export function renderCanePlate({ elements, size, backdrop = null }) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = elements.reduce((sum, e) => sum + e.x, 0) / elements.length
  const cy = elements.reduce((sum, e) => sum + e.y, 0) / elements.length
  const reach = Math.max(
    1,
    ...elements.map((e) => Math.hypot(e.x - cx, e.y - cy) + computeShapeReach(e.shape, e.params)),
  )
  const scale = (size / 2 - 2) / reach
  ctx.translate(size / 2, size / 2)
  if (backdrop) {
    ctx.fillStyle = backdrop
    ctx.beginPath()
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.scale(scale, -scale)
  ctx.translate(-cx, -cy)
  drawElements(ctx, elements)
  return canvas
}
