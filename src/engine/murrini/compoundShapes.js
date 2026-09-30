import { SPIRAL_PITCH_FACTOR } from './shapes'

// A "compound" tool places several real shape elements at once, tagged
// with a shared compoundId/compoundType, in a single undoable step —
// unlike SHAPE_TYPES, one of these doesn't correspond to a single
// THREE.Shape (a jellyroll needs a casing color and two interleaved
// spiral colors; a pinwheel needs several alternating wedges), so it
// can't be a normal placeable shape. Click-to-place works exactly like
// any other tool otherwise: pick a color first, click the canvas, click
// again elsewhere (or after picking a different color) to place another.
export const COMPOUND_SHAPE_TYPES = {
  jellyroll: {
    label: 'Jellyroll',
    defaultParams: { size: 22 },
    controls: [{ key: 'size', label: 'Overall size', min: 10, max: 60, step: 1 }],
  },
  pinwheel: {
    label: 'Pinwheel',
    defaultParams: { size: 30, blades: 6 },
    controls: [
      { key: 'size', label: 'Overall size', min: 14, max: 70, step: 2 },
      { key: 'blades', label: 'Blades', min: 4, max: 10, step: 2 },
    ],
  },
  zanfirico: {
    label: 'Zanfirico',
    defaultParams: { coreRadius: 16, threadCount: 3 },
    controls: [
      { key: 'coreRadius', label: 'Core radius', min: 8, max: 30, step: 1 },
      { key: 'threadCount', label: 'Threads', min: 2, max: 6, step: 1 },
    ],
  },
  tripod: {
    label: 'Tripod',
    defaultParams: { caneRadius: 14, rings: 1 },
    controls: [
      { key: 'caneRadius', label: 'Cane radius', min: 8, max: 24, step: 1 },
      { key: 'rings', label: 'Rings', min: 1, max: 3, step: 1 },
    ],
  },
  cross: {
    label: 'Cross',
    defaultParams: { caneRadius: 14, rings: 1 },
    controls: [
      { key: 'caneRadius', label: 'Cane radius', min: 8, max: 24, step: 1 },
      { key: 'rings', label: 'Rings', min: 1, max: 3, step: 1 },
    ],
  },
  row: {
    label: 'Row',
    defaultParams: { extent: 40, count: 4 },
    controls: [
      { key: 'extent', label: 'Row length', min: 20, max: 70, step: 2 },
      { key: 'count', label: 'Canes', min: 3, max: 8, step: 1 },
    ],
  },
  grid: {
    label: 'Cane Grid',
    defaultParams: { extent: 40, sideCount: 3 },
    controls: [
      { key: 'extent', label: 'Grid size', min: 20, max: 70, step: 2 },
      { key: 'sideCount', label: 'Canes per side', min: 2, max: 4, step: 1 },
    ],
  },
}

export const COMPOUND_SHAPE_ORDER = [
  'jellyroll',
  'pinwheel',
  'zanfirico',
  'tripod',
  'cross',
  'row',
  'grid',
]

// The jellyroll: a casing color gathered over a coiled strip (the real
// build order — coil first, case afterward — see the 'jellyroll'
// technique entry). `colors.primary` is whatever's selected in the color
// picker, so the same click with a different color picked beforehand
// produces a genuinely different jellyroll each time.
function buildJellyrollSpecs(x, y, { size }, colors) {
  const compoundId = crypto.randomUUID()
  const spiralParams = {
    innerRadius: Math.max(1, size * 0.09),
    turns: 2.5,
    thickness: Math.max(2, size * 0.18),
  }
  return [
    {
      shape: 'circle',
      x,
      y,
      params: { radius: size },
      color: colors.casing.swatch,
      colorantId: colors.casing.id,
      compoundId,
      compoundType: 'jellyroll',
    },
    {
      shape: 'spiral',
      x,
      y,
      params: { ...spiralParams, radialOffset: 0 },
      color: colors.primary.swatch,
      colorantId: colors.primary.id,
      compoundId,
      compoundType: 'jellyroll',
    },
    {
      shape: 'spiral',
      x,
      y,
      params: {
        ...spiralParams,
        radialOffset: (spiralParams.thickness * SPIRAL_PITCH_FACTOR) / 2,
      },
      color: colors.accent.swatch,
      colorantId: colors.accent.id,
      compoundId,
      compoundType: 'jellyroll',
    },
  ]
}

// Alternating wedges around a center point, colors A/B/A/B..., each
// pre-curved (see pinwheelBladeShape) to stand in for the swirl a real
// twisted pinwheel bundle develops as it's pulled.
function buildPinwheelSpecs(x, y, { size, blades }, colors) {
  const compoundId = crypto.randomUUID()
  const angleWidth = 360 / blades
  const curveDegrees = angleWidth * 0.7
  const specs = []
  for (let i = 0; i < blades; i++) {
    const colorEntry = i % 2 === 0 ? colors.primary : colors.accent
    specs.push({
      shape: 'pinwheelBlade',
      x,
      y,
      rotation: i * angleWidth,
      params: {
        innerRadius: size * 0.08,
        outerRadius: size,
        angleWidth,
        curveDegrees,
      },
      color: colorEntry.swatch,
      colorantId: colorEntry.id,
      compoundId,
      compoundType: 'pinwheel',
    })
  }
  return specs
}

// A real zanfirico/filigrana cane: several thin parallel threads laid
// evenly around a core cylinder's circumference, then the whole thing is
// gathered over with a layer of clear glass to lock the threads in place
// — only THEN is it twisted while pulled. Not a single off-center thread
// (that undersells it — real canes read as a full lattice/cage, not one
// stripe) and not skipping the outer casing (without it, there's nothing
// holding the threads in place once twisted, and nothing for them to be
// visible "inside" of). `colors.casing` renders translucent so the
// threads stay visible through it once placed.
//
// Thread size/spacing isn't guessed -- it's VirtualGlass's own
// "Surrounding Circle" cane-template formula (github.com/edemaine/
// virtualglass, cane.cpp), an exact tangent-circle-packing solution:
// `littleCount` threads, each simultaneously tangent to its two
// neighbors, to the center circle, AND to the outer boundary circle
// (coreRadius). Solving those three tangency constraints together gives
// k = sin(theta/2) / (1 + sin(theta/2)); every radius/distance below
// falls out of that one k. Real zanfirico threads are packed edge-to-edge
// around the core before casing, not loosely scattered, so this is the
// same shape a real cane cross-section actually has, not just a visual
// approximation of one.
function buildZanfiricoSpecs(x, y, { coreRadius, threadCount }, colors) {
  const compoundId = crypto.randomUUID()
  const littleCount = Math.max(threadCount, 3)
  const theta = (Math.PI * 2) / littleCount
  const halfSin = Math.sin(theta / 2)
  const k = halfSin / (1 + halfSin)
  const centerRadius = (1 - 2 * k) * coreRadius
  const threadRadius = k * coreRadius
  const threadDistance = (1 - k) * coreRadius
  const casingRadius = coreRadius * 1.15

  const specs = [
    {
      shape: 'circle',
      x,
      y,
      params: { radius: centerRadius },
      color: colors.primary.swatch,
      colorantId: colors.primary.id,
      compoundId,
      compoundType: 'zanfirico',
    },
  ]

  for (let i = 0; i < littleCount; i++) {
    const angle = (i / littleCount) * Math.PI * 2
    specs.push({
      shape: 'circle',
      x: x + Math.cos(angle) * threadDistance,
      y: y + Math.sin(angle) * threadDistance,
      params: { radius: threadRadius },
      color: colors.accent.swatch,
      colorantId: colors.accent.id,
      compoundId,
      compoundType: 'zanfirico',
    })
  }

  specs.push({
    shape: 'circle',
    x,
    y,
    params: { radius: casingRadius },
    color: colors.casing.swatch,
    colorantId: colors.casing.id,
    opacity: 0.4,
    compoundId,
    compoundType: 'zanfirico',
  })

  return specs
}

// Tripod and Cross share one real layout: a center cane, plus one or more
// concentric rings of `wings` canes around it (3 for Tripod, 4 for Cross),
// every cane the SAME size -- straight from VirtualGlass's cane.cpp,
// which handles both templates in a single switch case for exactly this
// reason (`wings = 3 + (type == CROSS)`). Ring i sits at distance
// `caneRadius * 2 * (i+1)` from center, which is exactly the spacing that
// keeps same-size touching canes tangent to the ring inside it. A plain
// "3 (or 4) canes touching in a circle, no center" undersells the real
// template -- every VirtualGlass Tripod/Cross has that center cane.
function buildRingedBundleSpecs(x, y, { caneRadius, rings }, colors, wings, compoundType) {
  const compoundId = crypto.randomUUID()
  const specs = [
    {
      shape: 'circle',
      x,
      y,
      params: { radius: caneRadius },
      color: colors.primary.swatch,
      colorantId: colors.primary.id,
      compoundId,
      compoundType,
    },
  ]

  for (let ring = 0; ring < rings; ring++) {
    const distance = caneRadius * 2 * (ring + 1)
    const colorEntry = ring % 2 === 0 ? colors.accent : colors.primary
    for (let i = 0; i < wings; i++) {
      const angle = (i / wings) * Math.PI * 2
      specs.push({
        shape: 'circle',
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        params: { radius: caneRadius },
        color: colorEntry.swatch,
        colorantId: colorEntry.id,
        compoundId,
        compoundType,
      })
    }
  }

  return specs
}

// A row of already-pulled canes packed edge-to-edge in a straight line
// (VirtualGlass's "Horizontal Line Circle" cane template) -- a genuinely
// different real arrangement from Tripod/Cross's radial rings, not just a
// cosmetic variant: `count` canes, each sized to exactly span
// `2*extent/count` so neighbors touch with no gaps or overlaps.
function buildRowSpecs(x, y, { extent, count }, colors) {
  const compoundId = crypto.randomUUID()
  const caneRadius = extent / count
  const specs = []
  for (let i = 0; i < count; i++) {
    const colorEntry = i % 2 === 0 ? colors.primary : colors.accent
    specs.push({
      shape: 'circle',
      x: x + (-extent + caneRadius + i * 2 * caneRadius),
      y,
      params: { radius: caneRadius },
      color: colorEntry.swatch,
      colorantId: colorEntry.id,
      compoundId,
      compoundType: 'row',
    })
  }
  return specs
}

// A square grid of already-pulled canes (VirtualGlass's "Square of
// Circles" cane template) -- sideCount x sideCount canes, each sized to
// exactly tile the grid with neighbors touching, checkerboard-colored so
// the grid arrangement itself stays visible.
function buildGridSpecs(x, y, { extent, sideCount }, colors) {
  const compoundId = crypto.randomUUID()
  const caneRadius = extent / sideCount
  const specs = []
  for (let i = 0; i < sideCount; i++) {
    for (let j = 0; j < sideCount; j++) {
      const colorEntry = (i + j) % 2 === 0 ? colors.primary : colors.accent
      specs.push({
        shape: 'circle',
        x: x + (-extent + caneRadius + 2 * caneRadius * i),
        y: y + (-extent + caneRadius + 2 * caneRadius * j),
        params: { radius: caneRadius },
        color: colorEntry.swatch,
        colorantId: colorEntry.id,
        compoundId,
        compoundType: 'grid',
      })
    }
  }
  return specs
}

// colors: { primary, accent, casing }, each { swatch, id }.
export function buildCompoundElements(type, x, y, params, colors) {
  if (type === 'jellyroll') return buildJellyrollSpecs(x, y, params, colors)
  if (type === 'pinwheel') return buildPinwheelSpecs(x, y, params, colors)
  if (type === 'zanfirico') return buildZanfiricoSpecs(x, y, params, colors)
  if (type === 'tripod') return buildRingedBundleSpecs(x, y, params, colors, 3, 'tripod')
  if (type === 'cross') return buildRingedBundleSpecs(x, y, params, colors, 4, 'cross')
  if (type === 'row') return buildRowSpecs(x, y, params, colors)
  if (type === 'grid') return buildGridSpecs(x, y, params, colors)
  return []
}
