import { COMPOUND_SHAPE_TYPES } from './compoundShapes'
import { findColorant } from './rod'
import { computeShapeReach, SHAPE_TYPES } from './shapes'

function caneName(element) {
  if (element.compoundType && COMPOUND_SHAPE_TYPES[element.compoundType]) {
    return `the ${COMPOUND_SHAPE_TYPES[element.compoundType].label}`
  }
  const colour = findColorant(element.colorantId)?.name.split(' / ')[0] ?? 'custom-color'
  return `the ${colour} ${SHAPE_TYPES[element.shape]?.label.toLowerCase() ?? 'cane'}`
}

// What a newly placed cane does to the canes already there, so the editor
// can say so instead of letting the plan quietly change underneath:
//  - 'inside': it sits wholly within another cane, so the two are pulled
//    as one cane (the new one becomes an embedded thread or core).
//  - 'overlap': it cuts into another cane. Real canes in a bundle can only
//    touch, so the slice no longer matches anything that can be built.
// Canes from the same compound tool are one cane already and don't count.
export function describePlacement(existing, placed) {
  for (const next of placed) {
    const nextReach = computeShapeReach(next.shape, next.params)
    for (const other of existing) {
      if (next.compoundId && next.compoundId === other.compoundId) continue
      const otherReach = computeShapeReach(other.shape, other.params)
      const distance = Math.hypot(next.x - other.x, next.y - other.y)
      if (distance >= nextReach + otherReach - 0.5) continue
      if (distance + nextReach <= otherReach + 0.5) return { kind: 'inside', other: caneName(other) }
      if (distance + otherReach <= nextReach + 0.5) continue // it encloses the other: casing
      return { kind: 'overlap', other: caneName(other) }
    }
  }
  return null
}
