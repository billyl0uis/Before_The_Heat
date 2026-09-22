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
}

export const COMPOUND_SHAPE_ORDER = ['jellyroll', 'pinwheel']

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

// colors: { primary, accent, casing }, each { swatch, id }.
export function buildCompoundElements(type, x, y, params, colors) {
  if (type === 'jellyroll') return buildJellyrollSpecs(x, y, params, colors)
  if (type === 'pinwheel') return buildPinwheelSpecs(x, y, params, colors)
  return []
}
