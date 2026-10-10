import { computeBuildPlan, MURRINI_TECHNIQUES } from '../../content/murrineTechniques'
import { COMPOUND_SHAPE_TYPES } from './compoundShapes'
import { checkColorCompatibility } from './colorCompatibility'
import { findColorant, pulledDiameterMm, pulledLengthMm } from './rod'
import { computeShapeReach, SHAPE_TYPES } from './shapes'

// How many copies of the drawn base cell the repeat produces.
export function repeatCount(pattern) {
  if (pattern.repeatType === 'radial') return Math.max(1, pattern.radialCount)
  if (pattern.repeatType === 'grid') return Math.max(1, pattern.rows * pattern.columns)
  return 1
}

const fmt = (value) => value.toLocaleString('en', { maximumFractionDigits: 1 })
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function colourName(element) {
  const name = findColorant(element.colorantId)?.name ?? 'custom colour'
  return name.split(' / ')[0].replace(/ \(.*\)$/, '')
}

function centreOf(cluster) {
  const x = cluster.reduce((sum, e) => sum + e.x, 0) / cluster.length
  const y = cluster.reduce((sum, e) => sum + e.y, 0) / cluster.length
  return { x, y }
}

// How many of this cane the finished cross-section really contains. A
// radial repeat rotates each piece around the centre, so a cane sitting on
// the centre lands on itself: it's one cane, not six. A grid repeat
// translates, so every cane really is repeated.
function copiesOf(cluster, pattern) {
  const copies = repeatCount(pattern)
  if (pattern.repeatType !== 'radial') return copies
  const { x, y } = centreOf(cluster)
  return Math.hypot(x, y) < 1 ? 1 : copies
}

// Title and description written from the cane itself: which colours, in
// what order, how many. Never a generic technique paragraph.
function describeCane(cluster, techniqueKey, count) {
  const compoundType = cluster[0].compoundType
  if (compoundType && COMPOUND_SHAPE_TYPES[compoundType]) {
    const colours = [...new Set(cluster.map(colourName))]
    const label = MURRINI_TECHNIQUES[techniqueKey]?.title ?? COMPOUND_SHAPE_TYPES[compoundType].label
    return {
      title: `${label} in ${colours.join(' and ')}\u00a0×${count}`,
      detail: `${plural(count, COMPOUND_SHAPE_TYPES[compoundType].label.toLowerCase() + ' cane')} built from ${colours.join(', ')}.`,
    }
  }
  if (cluster.length === 1) {
    const element = cluster[0]
    const shape = SHAPE_TYPES[element.shape]?.label.toLowerCase() ?? 'cane'
    return {
      title: `Pull ${count} ${colourName(element)} ${shape} cane${count === 1 ? '' : 's'}`,
      detail: `${shape[0].toUpperCase()}${shape.slice(1)} cross-section in ${colourName(element)}, pulled as a simple cane.`,
    }
  }
  // Nested: biggest piece outside, the rest inside it, smallest at the core.
  const layers = [...cluster].sort(
    (a, b) => computeShapeReach(b.shape, b.params) - computeShapeReach(a.shape, a.params),
  )
  const outer = colourName(layers[0])
  const inner = layers.slice(1).reverse().map(colourName)
  return {
    title: `Case ${inner.join(' and ')} in ${outer}\u00a0×${count}`,
    detail: `${inner[0]} at the centre${inner.length > 1 ? `, then ${inner.slice(1).join(', ')}` : ''}, with ${outer} gathered over it, pulled as one cane.`,
  }
}

// The whole design as the ordered steps you'd actually work through at the
// furnace: pull each cane, bundle them, case inside → out, then pull down.
// Everything is read back from the design; there are no timings, because
// nothing in the app's sources gives real working times.
//
// Each step carries a `plate` saying what its thumbnail shows: a single
// cane, or the rod up to a given casing layer.
export function buildShopPlan({ elements, pattern, rod, casing }) {
  const steps = []
  let caneTotal = 0

  for (const step of computeBuildPlan(elements)) {
    if (step.techniqueKey === 'bundle' || !step.elements) continue
    const count = copiesOf(step.elements, pattern)
    caneTotal += count
    const { title, detail } = describeCane(step.elements, step.techniqueKey, count)
    steps.push({
      key: `cane-${steps.length}`,
      title,
      detail,
      colorantIds: step.colorantIds,
      plate: { kind: 'cane', elements: step.elements },
    })
  }

  if (caneTotal > 1) {
    steps.push({
      key: 'bundle',
      title: `Bundle all ${caneTotal} canes`,
      detail: 'Lay them out as the slice shows, then pick them up together and fuse them into one rod.',
      colorantIds: [],
      plate: { kind: 'slice', casingUpTo: -1 },
    })
  }

  casing.forEach((layer, index) => {
    const colorant = findColorant(layer.colorantId)
    steps.push({
      key: `case-${index}`,
      title: `Case in\u00a0${colorant?.name.split(' / ')[0] ?? 'glass'}, ${fmt(layer.thicknessMm)}\u00a0mm`,
      detail: index === 0 ? 'The first layer, straight over the bundle.' : `Over layer ${index}.`,
      colorantIds: colorant && colorant.id !== 'clear' ? [colorant.id] : [],
      plate: { kind: 'slice', casingUpTo: index },
    })
  })

  if (steps.length) {
    steps.push({
      key: 'pull',
      title: `Pull to Ø ${fmt(pulledDiameterMm(rod))} mm`,
      detail: `${rod.pullRatio} : 1 from a ${rod.gatherDiameterMm} mm × ${rod.gatherLengthMm} mm gather gives about ${fmt(pulledLengthMm(rod) / 1000)} m of cane to slice.`,
      colorantIds: [],
      plate: { kind: 'slice', casingUpTo: casing.length - 1 },
    })
  }

  return steps
}

// Every real colorant in the design, canes and casing alike.
export function usedColorants({ elements, casing }) {
  const ids = new Set([
    ...elements.map((element) => element.colorantId).filter(Boolean),
    ...casing.map((layer) => layer.colorantId),
  ])
  return [...ids].map(findColorant).filter(Boolean)
}

export function shopPlanWarnings({ elements, casing }) {
  return checkColorCompatibility([...elements, ...casing.map((layer) => ({ colorantId: layer.colorantId }))])
}
