import { radiusAtLength } from './pickup'

// Murrini slices painted onto the vessel's outside-wall texture at their
// real size. The texture runs u round the wall and v up its length, so a
// round slice is drawn as an ellipse in texture space that comes out round
// again on the surface, at any height and on any curve.
export function paintMurriniSkin(ctx, size, wall, slices, sliceImage, sliceDiameterMm) {
  ctx.clearRect(0, 0, size, size)
  if (!sliceImage) return
  for (const { u, v } of slices) {
    const circumference = 2 * Math.PI * radiusAtLength(wall, v * wall.length)
    const rx = (sliceDiameterMm / 2 / circumference) * size
    const ry = (sliceDiameterMm / 2 / wall.length) * size
    const x = u * size
    const y = (1 - v) * size
    // The wall wraps at u = 0 / 1, so a slice on the seam is drawn on both
    // sides of it instead of being cut in half.
    for (const dx of [-size, 0, size]) {
      if (x + dx + rx < 0 || x + dx - rx > size) continue
      ctx.drawImage(sliceImage, x + dx - rx, y - ry, rx * 2, ry * 2)
    }
  }
}

// The base is flat, so its slices are plain circles: mm from the centre.
export function paintBaseSkin(ctx, size, wall, slices, sliceImage, sliceDiameterMm) {
  ctx.clearRect(0, 0, size, size)
  if (!sliceImage) return
  const scale = size / 2 / wall.baseRadius
  const d = sliceDiameterMm * scale
  for (const { x, y } of slices) {
    ctx.drawImage(sliceImage, size / 2 + x * scale - d / 2, size / 2 - y * scale - d / 2, d, d)
  }
}
