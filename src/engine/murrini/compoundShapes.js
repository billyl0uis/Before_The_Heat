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
}

export const COMPOUND_SHAPE_ORDER = ['jellyroll', 'pinwheel', 'zanfirico']

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
function buildZanfiricoSpecs(x, y, { coreRadius, threadCount }, colors) {
  const compoundId = crypto.randomUUID()
  const threadRadius = Math.max(1.5, coreRadius * 0.16)
  const casingRadius = coreRadius + threadRadius * 2.2

  const specs = [
    {
      shape: 'circle',
      x,
      y,
      params: { radius: coreRadius },
      color: colors.primary.swatch,
      colorantId: colors.primary.id,
      compoundId,
      compoundType: 'zanfirico',
    },
  ]

  for (let i = 0; i < threadCount; i++) {
    const angle = (i / threadCount) * Math.PI * 2
    specs.push({
      shape: 'circle',
      x: x + Math.cos(angle) * coreRadius,
      y: y + Math.sin(angle) * coreRadius,
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

// colors: { primary, accent, casing }, each { swatch, id }.
export function buildCompoundElements(type, x, y, params, colors) {
  if (type === 'jellyroll') return buildJellyrollSpecs(x, y, params, colors)
  if (type === 'pinwheel') return buildPinwheelSpecs(x, y, params, colors)
  if (type === 'zanfirico') return buildZanfiricoSpecs(x, y, params, colors)
  return []
}
