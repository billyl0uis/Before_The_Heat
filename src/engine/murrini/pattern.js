export const DEFAULT_PATTERN = {
  repeatType: 'none',
  rows: 1,
  columns: 1,
  spacingX: 60,
  spacingY: 60,
  radialCount: 1,
}

// Takes the elements the user actually drew (the "base cell") and expands
// them into every repeat instance for rendering. The base cell itself is
// never mutated or saved differently — this is a pure, read-only view.
export function computeRepeatedElements(elements, pattern) {
  if (!elements.length) return elements

  switch (pattern.repeatType) {
    case 'grid':
      return repeatGrid(elements, pattern)
    case 'radial':
      return repeatRadial(elements, pattern)
    default:
      return elements
  }
}

function repeatGrid(elements, { rows, columns, spacingX, spacingY }) {
  const repeated = []
  for (let row = 0; row < rows; row++) {
    const offsetY = (row - (rows - 1) / 2) * spacingY
    for (let col = 0; col < columns; col++) {
      const offsetX = (col - (columns - 1) / 2) * spacingX
      for (const element of elements) {
        repeated.push({
          ...element,
          id: `${element.id}-r${row}c${col}`,
          x: element.x + offsetX,
          y: element.y + offsetY,
        })
      }
    }
  }
  return repeated
}

function repeatRadial(elements, { radialCount }) {
  const repeated = []
  for (let i = 0; i < radialCount; i++) {
    const angleDeg = (360 / radialCount) * i
    const angleRad = (angleDeg * Math.PI) / 180
    const cos = Math.cos(angleRad)
    const sin = Math.sin(angleRad)
    for (const element of elements) {
      repeated.push({
        ...element,
        id: `${element.id}-a${i}`,
        x: element.x * cos - element.y * sin,
        y: element.x * sin + element.y * cos,
        rotation: element.rotation + angleDeg,
      })
    }
  }
  return repeated
}
