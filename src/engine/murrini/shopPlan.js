import { computeBuildPlan, MURRINI_TECHNIQUES } from '../../content/murrineTechniques'
import { COMPOUND_SHAPE_TYPES } from './compoundShapes'
import { checkColorCompatibility } from './colorCompatibility'
import { findColorant, mmPerWorldUnit, pulledDiameterMm, pulledLengthMm, totalCasingMm, twistPitchMm } from './rod'
import { computeShapeReach, SHAPE_TYPES } from './shapes'

// The design's real size across: the furthest any cane reaches from the
// centre, in mm. A recipe needn't fill the space inside the casing, and
// the plan has to say what goes in that gap rather than leave it out.
export function contentDiameterMm(repeatedElements, rod) {
  const reach = repeatedElements.reduce(
    (most, e) => Math.max(most, Math.hypot(e.x, e.y) + computeShapeReach(e.shape, e.params)),
    0,
  )
  return reach * 2 * mmPerWorldUnit(rod)
}

// Below this the gap is within what marvering takes up anyway.
const FILL_THRESHOLD_MM = 0.5

// What the layers actually come to, and whether there's a gap between the
// design and the gather size that was set. A gap is filled with clear, so
// the cane always pulls to the size that was set; the other way to close
// it is to grow the design (see fit.js), which removes the gap itself.
export function gatherBalance({ repeatedElements, rod, casing }) {
  const contentMm = contentDiameterMm(repeatedElements, rod)
  const naturalMm = contentMm + 2 * totalCasingMm(casing)
  const fillToMm = rod.gatherDiameterMm - 2 * totalCasingMm(casing)
  const gapMm = rod.gatherDiameterMm - naturalMm
  const hasGap = repeatedElements.length > 0 && gapMm > FILL_THRESHOLD_MM
  const filled = hasGap
  return {
    contentMm,
    naturalMm,
    fillToMm,
    gapMm,
    hasGap,
    filled,
    // The rod as it's pulled: always the size that was set.
    pullRod: rod,
  }
}

// The rod as it will really be pulled, for anything that shows the pulled
// cane's size: the editors, the Vessel pick-up and the plan all agree.
export function pullRodOf(design) {
  return gatherBalance({ repeatedElements: design.repeatedElements ?? [], rod: design.rod, casing: design.casing }).pullRod
}

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
// The cane's twist as a rate you can measure on the cane itself.
export function twistLabel(rod, twistDegrees) {
  if (!twistDegrees) return ''
  return `a turn every ${fmt(twistPitchMm(rod, twistDegrees))}\u00a0mm`
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
  const mmPerUnit = mmPerWorldUnit(rod)
  const sized = [...layers].reverse().map((e) => `${colourName(e)} to ${sizePhrase(e, mmPerUnit)}`)
  return {
    title: `Case ${inner.join(' and ')} in ${outer}${count > 1 ? `\u00a0×${count}` : ''}`,
    detail: `Inside to out: ${sized.join(', then ')}. Pulled as one cane.`,
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

// A zanfirico is a filigree cane for pick-ups, not a murrine: it's used as
// lengths of cane, never sliced.
export function isFiligreeCane(elements) {
  return elements.length > 0 && elements.every((element) => element.compoundType === 'zanfirico')
}

// The casing a zanfirico gets while it's built, round its threads, before
// any of the rod's own casing layers go on. Null when there isn't one.
export function innerCasingOf(elements, rod) {
  const casing = elements.find((e) => e.compoundType === 'zanfirico' && (e.opacity ?? 1) < 1)
  if (!casing) return null
  return {
    colorantId: casing.colorantId,
    name: colourName(casing),
    diameterMm: casing.params.radius * 2 * mmPerWorldUnit(rod),
  }
}

// Single compound canes (Zanfirico, Jellyroll, Pinwheel) are built from
// parts before they're pulled. The plan lists the parts and how they go
// together, read from the same geometry the editor drew.
function compoundCaneSteps(cluster, copies, rod) {
  const type = cluster[0].compoundType
  const mmPerUnit = mmPerWorldUnit(rod)
  const times = copies > 1 ? ` (make ${copies})` : ''
  const ids = (elements) => [...new Set(elements.map((e) => e.colorantId).filter(Boolean))]

  if (type === 'zanfirico') {
    const casing = cluster.find((e) => (e.opacity ?? 1) < 1)
    const rest = cluster.filter((e) => e !== casing)
    const cx = rest.reduce((sum, e) => sum + e.x, 0) / rest.length
    const cy = rest.reduce((sum, e) => sum + e.y, 0) / rest.length
    const core = rest.reduce((best, e) => (Math.hypot(e.x - cx, e.y - cy) < Math.hypot(best.x - cx, best.y - cy) ? e : best))
    const threads = rest.filter((e) => e !== core)
    const n = threads.length
    const steps = [
      {
        count: copies,
        title: `Pull ${copies} ${colourName(core)} core cane${copies === 1 ? '' : 's'}, ${sizePhrase(core, mmPerUnit)}`,
        detail: 'The core the threads sit round.',
        colorantIds: ids([core]),
        elements: [core],
      },
      {
        count: n * copies,
        title: `Pull ${n * copies} ${colourName(threads[0])} thread canes, ${sizePhrase(threads[0], mmPerUnit)}`,
        detail: `All the same size: ${n} for each zanfirico, touching each other and the core.`,
        colorantIds: ids(threads),
        elements: [threads[0]],
      },
    ]
    steps.push({
      title: `Lay the ${n} threads round the core and case in ${casing ? colourName(casing) : 'clear'}${
        casing ? `, ${sizePhrase(casing, mmPerUnit)}` : ''
      }${times}`,
      detail:
        'Threads touching all the way round. Round threads leave air between them, so marver from the tip back toward the pipe to push it out before the casing seals it in. The casing locks them in place before the twist.',
      colorantIds: ids(casing ? [casing] : []),
      elements: cluster,
    })
    return steps
  }

  if (type === 'jellyroll') {
    const casing = cluster.find((e) => e.shape === 'circle')
    const [a, b] = cluster.filter((e) => e.shape === 'spiral')
    return [
      {
        title: `Roll a ${colourName(a)} and ${colourName(b)} jellyroll${casing ? `, cased in ${colourName(casing)}` : ''}${times}`,
        detail: `Lay a flat strip of ${colourName(a)} on one of ${colourName(b)}, roll them up tightly from one end into a coil${
          casing ? `, then case the coil in ${colourName(casing)}, ${sizePhrase(casing, mmPerUnit)}` : ''
        }.`,
        colorantIds: ids(cluster),
        elements: cluster,
      },
    ]
  }

  if (type === 'pinwheel') {
    const colours = [...new Set(cluster.map(colourName))]
    return [
      {
        title: `Bundle ${cluster.length} ${colours.join(' and ')} wedges into a pinwheel${times}`,
        detail: `Alternate the ${colours.join(' and ')} wedges round a center and fuse them. Twist as you pull, so the straight wedges curve.`,
        colorantIds: ids(cluster),
        elements: cluster,
      },
    ]
  }
  return null
}

// The whole design as the ordered steps you'd actually work through at the
// furnace: pull each cane, bundle them, case inside → out, then pull down.
// Everything is read back from the design; there are no timings, because
// nothing in the app's sources gives real working times.
//
// Each step carries a `plate` saying what its thumbnail shows: a single
// cane, or the rod up to a given casing layer.
export function buildShopPlan({ elements, pattern, rod, casing, extrusion, repeatedElements, balance: given = null }) {
  const balance = given ?? (repeatedElements ? gatherBalance({ repeatedElements, rod, casing }) : null)
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
          count: part.count,
          colorantIds: part.colorantIds,
          plate: { kind: 'cane', elements: part.elements },
        })
      }
      continue
    }
    const count = copiesOf(step.elements, pattern)
    caneTotal += count
    looseCanes += count
    const parts = step.elements[0].compoundType ? compoundCaneSteps(step.elements, count, rod) : null
    if (parts) {
      for (const part of parts) {
        steps.push({
          key: `cane-${steps.length}`,
          title: part.title,
          detail: part.detail,
          count: part.count,
          colorantIds: part.colorantIds,
          plate: { kind: 'cane', elements: part.elements },
        })
      }
      continue
    }
    const { title, detail } = describeCane(step.elements, step.techniqueKey, count, rod)
    steps.push({
      key: `cane-${steps.length}`,
      title,
      detail,
      count,
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
      detail: 'Lay them out as the slice shows, then pick them up together and fuse them into one rod. Fill any big gaps between round canes with thinner rod (2–3 mm) first.',
      colorantIds: [],
      plate: { kind: 'slice', casingUpTo: -1 },
    })
    // Round canes leave air between them; if the outside seals first it
    // stays in the rod. The same advice is in Learn → Bundling.
    steps.push({
      key: 'air',
      title: 'Work the air out before it seals',
      detail:
        'Pick the bundle up on a blowpipe with a collar, or on a post with grooves scored across its face, so the air has a way out. Marver from the tip back toward the pipe, keeping the back cooler until the front is sealed. The end by the pipe usually traps some air: plan to set it aside.',
      colorantIds: [],
      plate: { kind: 'slice', casingUpTo: -1 },
    })
  }

  // The gap between the design and the gather, filled with clear when the
  // user chose to: its own step, before the rod's casing.
  if (balance?.filled) {
    steps.push({
      key: 'fill',
      title: `Fill out with\u00a0Clear to Ø\u00a0${fmt(balance.fillToMm)}\u00a0mm`,
      detail: `The design is Ø ${fmt(balance.contentMm)} mm across. Gathering clear over it to Ø ${fmt(balance.fillToMm)} mm brings the rod up to the ${fmt(rod.gatherDiameterMm)} mm gather this plan pulls from.`,
      colorantIds: [],
      plate: { kind: 'slice', casingUpTo: -1 },
    })
  }

  // A zanfirico was already cased once round its threads, so the rod's
  // casing goes over that, not straight onto the threads.
  const inner = innerCasingOf(elements, rod)
  const firstOver = balance?.filled
    ? 'Over the clear fill.'
    : inner
    ? `Over the ${inner.name} casing that locks in the threads, so this is a second layer.`
    : `The first layer, straight over the ${caneTotal > 1 ? 'bundle' : 'cane'}.`
  casing.forEach((layer, index) => {
    const colorant = findColorant(layer.colorantId)
    steps.push({
      key: `case-${index}`,
      title: `Case in\u00a0${colorant?.name.split(' / ')[0] ?? 'glass'}, ${fmt(layer.thicknessMm)}\u00a0mm`,
      detail: index === 0 ? firstOver : `Over layer ${index}.`,
      colorantIds: colorant && colorant.id !== 'clear' ? [colorant.id] : [],
      plate: { kind: 'slice', casingUpTo: index },
    })
  })

  if (steps.length) {
    const pull = balance?.pullRod ?? rod
    // The twist is the whole technique for a zanfirico or any spiral cane:
    // it has to be in the instruction, not only in the preview.
    const twistDegrees = extrusion?.twistDegrees ?? 0
    const twist = twistLabel(pull, twistDegrees)
    const totalTurns = twistDegrees ? Math.round(pulledLengthMm(pull) / twistPitchMm(pull, twistDegrees)) : 0
    steps.push({
      key: 'pull',
      title: twist
        ? `Pull to Ø ${fmt(pulledDiameterMm(pull))} mm, twisting ${twist}`
        : `Pull to Ø ${fmt(pulledDiameterMm(pull))} mm`,
      detail: `${pull.pullRatio} : 1 from a ${fmt(pull.gatherDiameterMm)} mm × ${pull.gatherLengthMm} mm gather gives about ${fmt(pulledLengthMm(pull) / 1000)} m of cane${isFiligreeCane(elements) ? ' for a pick-up' : ' to slice'}.${
        twist
          ? ` That's about ${totalTurns} turns over the whole pull: keep turning the same way as you walk it out, so the twist stays even.`
          : ''
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

// The slice in words, for anyone who can't see it: what's there, how
// many, what color, and the casing round it.
export function describeSlice({ repeatedElements, casing }) {
  if (!repeatedElements.length) return 'An empty slice: no canes placed yet.'
  const groups = new Map()
  // A radial repeat lays copies of a center cane on top of each other:
  // one cane in the glass, so it's counted once.
  const seen = new Set()
  for (const e of repeatedElements) {
    if ((e.opacity ?? 1) < 1) continue
    const spot = `${Math.round(e.x)}|${Math.round(e.y)}|${e.shape}|${e.colorantId}|${JSON.stringify(e.params)}`
    if (seen.has(spot)) continue
    seen.add(spot)
    const shape = e.shape === 'circle' ? 'round' : (SHAPE_TYPES[e.shape]?.label.toLowerCase() ?? 'shape')
    const key = `${colourName(e)} ${shape}`
    groups.set(key, (groups.get(key) ?? 0) + 1)
  }
  const parts = [...groups.entries()].map(([name, n]) => `${n} ${name}${n === 1 ? '' : 's'}`)
  const layers = casing.map((layer) => `${findColorant(layer.colorantId)?.name.split(' / ')[0] ?? 'glass'} ${fmt(layer.thicknessMm)} mm`)
  return `Slice: ${parts.join(', ')}${layers.length ? `, cased in ${layers.join(', then ')}` : ''}.`
}
