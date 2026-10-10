import { GLASS_COLOR_INDEX } from '../../content/glassColorIndex'

// The rod's outer edge in editor world units. Placement math, pattern
// repeat, the rasterizer and the Vessel stamp all work in world units, so
// they stay exactly as they were; millimetres are derived from this one
// constant plus the gather diameter rather than baked into every element.
export const ROD_WORLD_RADIUS = 230

// Example values for a first design, not sourced shop standards: a
// 32 mm gather pulled 4:1 to an 8 mm cane is a plausible studio cane, but
// the UI labels these as editable starting points, never as "the" size.
export const DEFAULT_ROD = {
  gatherDiameterMm: 32,
  gatherLengthMm: 100,
  pullRatio: 4,
}

export const DEFAULT_CASING = [{ colorantId: 'clear', thicknessMm: 1.5 }]

// Clear glass isn't a colorant (it's the base glass every colorant goes
// into), so it isn't in GLASS_COLOR_INDEX. Casing still needs to name it:
// clear is the most common real casing, e.g. around a zanfirico.
export const CLEAR_GLASS = {
  id: 'clear',
  name: 'Clear',
  swatch: '#cfdcd8',
  family: 'transparent',
  colorant: 'Base glass, no colorant',
  strikes: false,
  devitrifies: false,
  hazard: null,
  caution: null,
}

const COLORANT_BY_ID = new Map(
  [CLEAR_GLASS, ...GLASS_COLOR_INDEX].map((colorant) => [colorant.id, colorant]),
)

export function findColorant(id) {
  return COLORANT_BY_ID.get(id) ?? null
}

export function mmPerWorldUnit(rod) {
  return rod.gatherDiameterMm / 2 / ROD_WORLD_RADIUS
}

export function totalCasingMm(casing) {
  return casing.reduce((sum, layer) => sum + layer.thicknessMm, 0)
}

// Casing is stored inside → out (the order you'd apply it). Returns each
// layer's ring in world units, plus the radius left for the canes inside.
export function casingRings(rod, casing) {
  const perUnit = mmPerWorldUnit(rod)
  let outer = ROD_WORLD_RADIUS
  const rings = []
  for (let i = casing.length - 1; i >= 0; i--) {
    const width = casing[i].thicknessMm / perUnit
    const inner = Math.max(0, outer - width)
    rings.unshift({ ...casing[i], inner, outer })
    outer = inner
  }
  return { rings, contentRadius: outer }
}

// Pulling conserves volume: the cross-section shrinks by ratio², so the
// length grows by ratio². A 100 mm gather pulled 4:1 gives 1.6 m of cane.
export function pulledDiameterMm(rod) {
  return rod.gatherDiameterMm / rod.pullRatio
}

export function pulledLengthMm(rod) {
  return rod.gatherLengthMm * rod.pullRatio * rod.pullRatio
}
