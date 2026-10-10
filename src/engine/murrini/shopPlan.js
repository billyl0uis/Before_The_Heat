import { computeBuildPlan, MURRINI_TECHNIQUES } from '../../content/murrineTechniques'
import { COMPOUND_SHAPE_TYPES } from './compoundShapes'
import { checkColorCompatibility } from './colorCompatibility'
import { findColorant, mmPerWorldUnit, pulledDiameterMm, pulledLengthMm } from './rod'
import { computeShapeReach, SHAPE_TYPES } from './shapes'

// How many copies of the drawn base cell the repeat produces.
export function repeatCount(pattern) {
  if (pattern.repeatType === 'radial') return Math.max(1, pattern.radialCount)
  if (pattern.repeatType === 'grid') return Math.max(1, pattern.rows * pattern.columns)
  return 1
}

const fmt = (value) => value.toLocaleString('en', { maximumFractionDigits: 1 })

// Twist as a glassblower says it: "half a turn", "2 full turns".
export function turnsLabel(twistDegrees) {
  const turns = Math.abs(twistDegrees) / 360
  if (!turns) return ''
  if (turns === 0.25) return 'a quarter turn'
  if (turns === 0.5) return 'half a turn'
  if (turns === 0.75) return 'three quarters of a turn'
  if (turns === 1) return '1 full turn'
  if (Number.isInteger(turns)) return `${turns} full turns`
  const whole = Math.floor(turns)
  const part = { 0.25: '¼', 0.5: '½', 0.75: '¾' }[turns - whole]
  return part && whole ? `${whole}${part} turns` : `${fmt(turns)} turns`
}
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function colourName(element) {
  const name = findColorant(element.colorantId)?.name ?? 'custom color'
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
function describeCane(cluster, techniqueKey, count, rod) {
  const compoundType = cluster[0].compoundType
  if (compoundType && COMPOUND_SHAPE_TYPES[compoundType]) {
    const colours = [...new Set(cluster.map(colourName))]
    const label = MURRINI_TECHNIQUES[techniqueKey]?.title ?? COMPOUND_SHAPE_TYPES[compoundType].label
    return {
      title: `${label} in ${colours.join(' and ')}${count > 1 ? `\u00a0×${count}` : ''}`,
      detail: `${plural(count, COMPOUND_SHAPE_TYPES[compoundType].label.toLowerCase() + ' cane')} built from ${colours.join(', ')}.`,
    }
  }
  if (cluster.length === 1) {
    const element = cluster[0]
    const shape = element.shape === 'circle' ? 'round' : (SHAPE_TYPES[element.shape]?.label.toLowerCase() ?? 'cane')
    return {
      title: `Pull ${count} ${colourName(element)} ${shape} cane${count === 1 ? '' : 's'}, ${sizePhrase(element, mmPerWorldUnit(rod))}`,
      detail: `${shape[0].toUpperCase()}${shape.slice(1)} cross-section in ${colourName(element)}, pulled as a simple cane to this size.`,
    }
  }
  // Nested: biggest piece outside, the rest inside it, smallest at the core.
  const layers = [...cluster].sort(
    (a, b) => computeShapeReach(b.shape, b.params) - computeShapeReach(a.shape, a.params),
  )
  const outer = colourName(layers[0])
  const inner = layers.slice(1).reverse().map(colourName)
  return {
    title: `Case ${inner.join(' and ')} in ${outer}${count > 1 ? `\u00a0×${count}` : ''}`,
    detail: `${inner[0]} at the centre${inner.length > 1 ? `, then ${inner.slice(1).join(', ')}` : ''}, with ${outer} gathered over it, pulled as one cane.`,
  }
}

// Bundle tools (Tripod, Cross, Row, Grid, Frame) place several separate
// canes at once. Each one is pulled on its own before they're bundled, so
// the plan lists them by kind (shape, colour, size), not as one "cane".
const BUNDLE_COMPOUNDS = new Set(['tripod', 'cross', 'row', 'grid', 'frame'])

function isBundleCluster(cluster) {
  const type = cluster[0]?.compoundType
  return BUNDLE_COMPOUNDS.has(type) && cluster.every((element) => element.compoundType === type)
}

// A cane's size as it sits in the gather, which is the size to pull it to
// before bundling.
function sizePhrase(element, mmPerUnit) {
  const params = element.params ?? {}
  const mm = (value) => fmt(value * mmPerUnit)
  if (element.shape === 'circle') return `Ø\u00a0${mm(params.radius * 2)}\u00a0mm`
  if (element.shape === 'square') {
    return params.width === params.height
      ? `${mm(params.width)}\u00a0mm square`
      : `${mm(params.width)} × ${mm(params.height)}\u00a0mm`
  }
  return `${mm(computeShapeReach(element.shape, params) * 2)}\u00a0mm across`
}

function bundleComponents(cluster, pattern, rod) {
  const label = COMPOUND_SHAPE_TYPES[cluster[0].compoundType].label
  const mmPerUnit = mmPerWorldUnit(rod)
  const kinds = new Map()
  for (const element of cluster) {
    const size = sizePhrase(element, mmPerUnit)
    const key = `${element.shape}|${element.colorantId ?? element.color}|${size}`
    const kind = kinds.get(key) ?? { element, size, count: 0 }
    kind.count += copiesOf([element], pattern)
    kinds.set(key, kind)
  }
  return [...kinds.values()].map(({ element, size, count }) => {
    const shape = element.shape === 'circle' ? 'round' : (SHAPE_TYPES[element.shape]?.label.toLowerCase() ?? '')
    return {
      count,
      title: `Pull ${count} ${colourName(element)} ${shape} cane${count === 1 ? '' : 's'}, ${size}`,
      detail: `For the ${label}: pull ${count === 1 ? 'it' : 'each one'} to this size on its own before bundling.`,
      colorantIds: element.colorantId ? [element.colorantId] : [],
      elements: [element],
    }
  })
}

// The whole design as the ordered steps you'd actually work through at the
// furnace: pull each cane, bundle them, case inside → out, then pull down.
// Everything is read back from the design; there are no timings, because
// nothing in the app's sources gives real working times.
//
// Each step carries a `plate` saying what its thumbnail shows: a single
// cane, or the rod up to a given casing layer.
export function buildShopPlan({ elements, pattern, rod, casing, extrusion }) {
  const steps = []
  let caneTotal = 0
  const bundleLabels = new Set()
  let looseCanes = 0

  for (const step of computeBuildPlan(elements)) {
    if (step.techniqueKey === 'bundle' || !step.elements) continue
    if (isBundleCluster(step.elements)) {
      bundleLabels.add(COMPOUND_SHAPE_TYPES[step.elements[0].compoundType].label)
      for (const part of bundleComponents(step.elements, pattern, rod)) {
        caneTotal += part.count
        steps.push({
          key: `cane-${steps.length}`,
          title: part.title,
          detail: part.detail,
          colorantIds: part.colorantIds,
          plate: { kind: 'cane', elements: part.elements },
        })
      }
      continue
    }
    const count = copiesOf(step.elements, pattern)
    caneTotal += count
    looseCanes += count
    const { title, detail } = describeCane(step.elements, step.techniqueKey, count, rod)
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
      title:
        bundleLabels.size === 1 && !looseCanes
          ? `Bundle the ${caneTotal} canes into the ${[...bundleLabels][0]}`
          : `Bundle all ${caneTotal} canes`,
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
    // The twist is the whole technique for a zanfirico or any spiral cane:
    // it has to be in the instruction, not only in the preview.
    const twist = turnsLabel(extrusion?.twistDegrees ?? 0)
    steps.push({
      key: 'pull',
      title: twist
        ? `Pull to Ø ${fmt(pulledDiameterMm(rod))} mm, twisting ${twist}`
        : `Pull to Ø ${fmt(pulledDiameterMm(rod))} mm`,
      detail: `${rod.pullRatio} : 1 from a ${rod.gatherDiameterMm} mm × ${rod.gatherLengthMm} mm gather gives about ${fmt(pulledLengthMm(rod) / 1000)} m of cane to slice.${
        twist ? ' Keep turning the same way as you pull, so the twist spreads evenly along the cane.' : ''
      }`,
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
