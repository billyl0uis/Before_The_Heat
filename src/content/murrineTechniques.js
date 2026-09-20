import { SHAPE_TYPES } from '../engine/murrini/shapes'

// Reference notes on the real glassblowing techniques each digital shape
// stands in for. Most shape ids map straight to one technique key; polygon
// is the exception — resolveTechniqueKey() below picks between marvering
// and an optic mold depending on how many sides are dialed in.
export const MURRINI_TECHNIQUES = {
  circle: {
    title: 'Simple Cane',
    summary:
      'A single gather of colored glass, pulled straight into a round rod. No mold or second color involved — the plainest cane to make and the easiest to bundle with others.',
    steps: [
      'Gather molten glass of one color onto the pipe or punty.',
      'Reheat and pull the gather lengthwise into a long, even rod.',
      'Let it cool, then cut it into working lengths.',
    ],
  },
  ring: {
    title: 'Casing (Overlay)',
    summary:
      "A contrasting color is gathered over a base color before pulling, so the cane shows a colored ring around a solid core when sliced. The app draws this ring hollow for clarity — in real glass the center stays filled with the core color, it's not an empty hole.",
    steps: [
      'Gather the base/core color first.',
      'Dip that gather into a pot of the casing color, coating it evenly.',
      'Reheat and pull the cased gather into a rod — the casing stays as an outer layer the whole length.',
    ],
  },
  marver: {
    title: 'Marvering (Flat Panels)',
    summary:
      "For a small number of flat sides — a square or hexagonal cane — no mold is needed. The gather is shaped by hand against the marver, a flat steel (historically marble) table, pressing one facet at a time.",
    steps: [
      'Gather the glass and reheat it to working temperature.',
      'Press and roll the gather against the flat marver table to flatten one side.',
      'Rotate the piece by the target angle (90° for a square, 60° for a hexagon) and repeat for each side.',
      'Pull the faceted gather into a rod once every side is flattened.',
    ],
  },
  opticMold: {
    title: 'Optic / Facet Mold',
    summary:
      'For more facets than can be pressed by hand, the gather goes into a ribbed metal mold instead — a cavity lined with flat panels. Pressing the gather into it imprints every facet in one motion, evenly, which would be impractical to marver one side at a time.',
    steps: [
      'Gather the glass and reheat it to working temperature.',
      'Lower the gather into an optic mold with flat internal panels and press it against the mold walls.',
      'Remove the faceted gather and pull it into a rod — the facets hold along the whole length.',
    ],
  },
  star: {
    title: 'Star / Chevron Mold',
    summary:
      "The chevron (or rosetta/star) bead technique, documented back to 15th-century Murano: 4-7 layers of alternating color are built up in a star-shaped mold, each new casing pressed into the mold again so it keeps the star outline. The whole layered bundle is then drawn out from both ends at once (a rod on each side, pulled apart), not stretched from a single point like the other canes here — that two-sided pull is what keeps the nested star pattern centered and even along the whole length.",
    steps: [
      'Press a gather into a star-shaped mold so its cross-section becomes star-shaped.',
      'Case that star with a contrasting color, then press into the star mold again so the new layer keeps the star outline.',
      'Repeat casing for as many nested colors as wanted (historically 4-7 layers).',
      'Attach a punty to each end and draw the layered bundle out from both sides at once.',
    ],
  },
  line: {
    title: 'Stringer',
    summary:
      "A thin, separately pulled thread of glass. Unlike the shapes above, a stringer usually isn't sliced into murrini cross-sections — it's trailed or wound directly onto a piece for fine linework, though it can also ride along inside a bundled cane as a thin accent.",
    steps: [
      'Gather a small amount of glass on a punty.',
      'Reheat and pull it into a long, thin, even thread while still soft.',
      'Use it by trailing it onto hot glass, or bundle it with other canes before pulling further.',
    ],
  },
  bundle: {
    title: 'Bundling Canes',
    summary:
      "When multiple shapes sit apart from each other — not nested inside one another — each one represents an already-pulled cane (simple, cased, faceted, or chevron) gathered alongside the others and fused into one new composite rod. This is how real complex murrini cross-sections — flower canes, mosaic canes — are actually built: separate canes packed side by side and redrawn as one, not a single pull. (A smaller shape placed inside a larger one is a different technique — see Casing.)",
    steps: [
      'Pull each individual cane first, as its own technique — simple, cased, faceted, or chevron.',
      'Cut the finished canes to matching lengths and pack them together in a bundle, often around a central cane or side by side.',
      'Fuse the bundle by reheating it as a unit, then draw the whole bundle out from both ends into one new, smaller-diameter composite rod.',
      'Slice the cooled composite rod crosswise to reveal the full pattern in every slice — this final cut is the murrini technique proper.',
    ],
  },
}

// Marvering a fixed number of flat sides by hand stays practical up to
// about a hexagon; more facets than that is realistically mold territory.
const MAX_HAND_MARVERED_SIDES = 6

// How far a shape's outline reaches from its own local (0,0) — used to
// tell "nested inside another shape" from "sitting apart from it" without
// hardcoding each shape type's own radius/width/height param names.
function computeElementReach(element) {
  const definition = SHAPE_TYPES[element.shape]
  if (!definition) return 0
  const { shape: points } = definition.createShape(element.params).extractPoints(16)
  let maxDist = 0
  for (const point of points) {
    const dist = Math.sqrt(point.x * point.x + point.y * point.y)
    if (dist > maxDist) maxDist = dist
  }
  return maxDist
}

// True when every shape is centered on (roughly) the same point — a
// smaller color nested inside a larger one, i.e. casing — as opposed to
// shapes placed apart from each other, i.e. separate canes bundled
// together. Tolerance scales with the largest shape's own size so it
// still reads as "centered" at any zoom/scale, not just a fixed pixel
// radius.
function areElementsConcentric(elements) {
  const avgX = elements.reduce((sum, el) => sum + el.x, 0) / elements.length
  const avgY = elements.reduce((sum, el) => sum + el.y, 0) / elements.length
  const maxReach = Math.max(...elements.map(computeElementReach))
  const tolerance = Math.max(4, maxReach * 0.2)

  return elements.every((el) => {
    const dx = el.x - avgX
    const dy = el.y - avgY
    return Math.sqrt(dx * dx + dy * dy) <= tolerance
  })
}

// Reflects what's actually been built so far, not just whichever tool is
// selected in the toolbar. Two or more placed shapes could be either of
// two different real techniques depending on their actual geometry: all
// centered on the same point (one color inside another) is casing — the
// same technique as the ring shape — not bundling; only shapes genuinely
// placed apart from each other are canes bundled side by side. Only when
// there's at most one shape on the canvas does the currently-selected
// tool (which previews what would be made if it were placed) still apply.
export function resolveTechniqueKey(elements, fallbackShape, fallbackParams = {}) {
  if (elements.length > 1) {
    return areElementsConcentric(elements) ? 'ring' : 'bundle'
  }

  const shape = elements.length === 1 ? elements[0].shape : fallbackShape
  const params = elements.length === 1 ? elements[0].params : fallbackParams

  if (shape === 'square') return 'marver'
  if (shape === 'polygon') {
    return (params.sides ?? 4) <= MAX_HAND_MARVERED_SIDES ? 'marver' : 'opticMold'
  }
  return shape
}
