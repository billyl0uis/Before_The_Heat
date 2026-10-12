import { computeRepeatedElements } from './pattern'
import { gatherBalance } from './shopPlan'

// Shape and compound settings that are sizes. Everything else (counts,
// turns, angles) stays as it is when a design is scaled.
const LENGTH_PARAMS = new Set([
  'radius',
  'innerRadius',
  'outerRadius',
  'width',
  'height',
  'size',
  'length',
  'thickness',
  'radialOffset',
  'extent',
  'caneRadius',
  'coreRadius',
])

export function scaleElements(elements, factor) {
  return elements.map((element) => ({
    ...element,
    x: element.x * factor,
    y: element.y * factor,
    params: Object.fromEntries(
      Object.entries(element.params ?? {}).map(([key, value]) => [
        key,
        LENGTH_PARAMS.has(key) && typeof value === 'number' ? value * factor : value,
      ]),
    ),
  }))
}

export function scalePattern(pattern, factor) {
  return { ...pattern, spacingX: pattern.spacingX * factor, spacingY: pattern.spacingY * factor }
}

// Grow a design until it fills the space inside the casing, so the gather
// is all pattern and pulls to the size that was set, with no clear fill.
// Returns null when it already fills it.
export function growToFill({ elements, pattern, rod, casing }) {
  const balance = gatherBalance({ repeatedElements: computeRepeatedElements(elements, pattern), rod, casing })
  if (!balance.hasGap || balance.contentMm <= 0) return null
  const factor = balance.fillToMm / balance.contentMm
  return { elements: scaleElements(elements, factor), pattern: scalePattern(pattern, factor), factor }
}
