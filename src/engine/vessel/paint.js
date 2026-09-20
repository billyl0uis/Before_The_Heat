// Redraws the vessel's texture canvas from scratch: a base glass color,
// then every placed murrini stamp at its UV position. Called on every
// placement/undo/redo instead of incrementally painting, so undo can just
// drop the last placement and replay the rest — no separate pixel-level
// undo buffer needed.
export function repaintVesselTexture(ctx, textureSize, glassColor, placements, stampFraction) {
  ctx.clearRect(0, 0, textureSize, textureSize)
  ctx.fillStyle = glassColor
  ctx.fillRect(0, 0, textureSize, textureSize)

  const stampSize = textureSize * stampFraction
  for (const placement of placements) {
    const x = placement.u * textureSize
    const y = (1 - placement.v) * textureSize
    // The vessel wraps around at u=0/u=1 (LatheGeometry's seam) — drawing
    // wrapped copies on both sides means a stamp placed near that seam
    // doesn't get clipped in half.
    for (const dx of [-textureSize, 0, textureSize]) {
      ctx.drawImage(
        placement.stampCanvas,
        x + dx - stampSize / 2,
        y - stampSize / 2,
        stampSize,
        stampSize,
      )
    }
  }
}
