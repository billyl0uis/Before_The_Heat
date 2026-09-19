import { SHAPE_TYPES } from './shapes'

function tracePolygon(ctx, points) {
  if (!points.length) return
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.closePath()
}

// Reuses the exact THREE.Shape each shape type already defines for the
// interactive canvas — extractPoints() turns it (arcs included) into plain
// line-segment polygons, so there's one definition of "what a circle looks
// like", not a second copy redrawn in Canvas 2D. evenodd fill handles the
// ring's hole correctly regardless of winding order.
function fillShapePath(ctx, shape, divisions = 24) {
  const { shape: outerPoints, holes } = shape.extractPoints(divisions)
  ctx.beginPath()
  tracePolygon(ctx, outerPoints)
  for (const hole of holes) {
    tracePolygon(ctx, hole)
  }
  ctx.fill('evenodd')
}

// Draws the pattern-repeated elements onto a 2D canvas for use as a
// texture (or later, a saved thumbnail). Reuses an existing canvas element
// when given one, so callers can avoid reallocating on every update.
export function renderElementsToCanvas(elements, canvasConfig, targetCanvas) {
  const canvas = targetCanvas ?? document.createElement('canvas')
  canvas.width = canvasConfig.width
  canvas.height = canvasConfig.height

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = canvasConfig.backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Engine coordinates are centered on (0,0) with +y up, matching the
  // orthographic editor view; canvas 2D has (0,0) top-left with +y down.
  ctx.save()
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.scale(1, -1)

  for (const element of elements) {
    const definition = SHAPE_TYPES[element.shape]
    if (!definition) continue

    const shape = definition.createShape(element.params)
    ctx.save()
    ctx.translate(element.x, element.y)
    ctx.rotate((element.rotation * Math.PI) / 180)
    ctx.globalAlpha = element.opacity
    ctx.fillStyle = element.color
    fillShapePath(ctx, shape)
    ctx.restore()
  }

  ctx.restore()
  return canvas
}

// Union bounding box of every element's actual geometry (rotation applied),
// in engine coordinates. Returns null for an empty pattern.
function computePatternBounds(elements) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const element of elements) {
    const definition = SHAPE_TYPES[element.shape]
    if (!definition) continue

    const shape = definition.createShape(element.params)
    const { shape: points } = shape.extractPoints(16)
    const angle = (element.rotation * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    for (const point of points) {
      const worldX = element.x + point.x * cos - point.y * sin
      const worldY = element.y + point.x * sin + point.y * cos
      if (worldX < minX) minX = worldX
      if (worldX > maxX) maxX = worldX
      if (worldY < minY) minY = worldY
      if (worldY > maxY) maxY = worldY
    }
  }

  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null
}

// Renders a tight crop around the pattern (not the whole spacious editing
// canvas) into a square tile, meant to be used with RepeatWrapping so it
// tiles across a vessel's surface instead of stretching one mostly-empty
// canvas over the whole thing.
export function renderPatternTile(elements, backgroundColor, tileSize = 256, targetCanvas) {
  const canvas = targetCanvas ?? document.createElement('canvas')
  canvas.width = tileSize
  canvas.height = tileSize

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, tileSize, tileSize)

  const bounds = computePatternBounds(elements)
  if (!bounds) return canvas

  const padding = 8
  const boundsWidth = Math.max(1, bounds.maxX - bounds.minX)
  const boundsHeight = Math.max(1, bounds.maxY - bounds.minY)
  const scale = (tileSize - padding * 2) / Math.max(boundsWidth, boundsHeight)
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2

  ctx.save()
  ctx.translate(tileSize / 2, tileSize / 2)
  ctx.scale(scale, -scale)
  ctx.translate(-centerX, -centerY)

  for (const element of elements) {
    const definition = SHAPE_TYPES[element.shape]
    if (!definition) continue

    const shape = definition.createShape(element.params)
    ctx.save()
    ctx.translate(element.x, element.y)
    ctx.rotate((element.rotation * Math.PI) / 180)
    ctx.globalAlpha = element.opacity
    ctx.fillStyle = element.color
    fillShapePath(ctx, shape)
    ctx.restore()
  }

  ctx.restore()
  return canvas
}
