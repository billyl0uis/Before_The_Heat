import { computeShapeReach } from '../engine/murrini/shapes'

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
  spiral: {
    title: 'Jellyroll (Rolled Spiral)',
    summary:
      "A genuinely different technique from twist/zanfirico (which spirals along a rod's length, visible from the side) — this spiral is built into the cross-section itself, visible when you slice straight across. A striped strip of alternating colors is wound into a coil from the center outward, like a jellyroll, so every slice shows the same nested spiral. Real jellyroll canes are typically cased in another color afterward, same as any other cane core.",
    steps: [
      'Lay out a thin strip of glass with alternating color bands (stringers, or a striped sheet).',
      "Starting from one end, wind the strip into a tight coil, building it out from the center — the app's two interleaved spirals (offset by half a turn) stand in for the alternating stripe.",
      'Heat the coiled strip until it fuses into a single solid disc with a spiral cross-section.',
      'Pick the fused coil up on a punty, case it in another color if wanted, and pull it into a rod — the spiral holds all the way down the length.',
    ],
  },
  jellyroll: {
    title: 'Jellyroll, Cased',
    summary:
      'A jellyroll coil built first (see Jellyroll (Rolled Spiral) for that step), then cased in another color afterward — real jellyroll canes are typically encased the same way any other cane core would be, which protects the coiled pattern through the rest of the working process.',
    steps: [
      "Lay out a thin strip of glass with alternating color bands and wind it into a tight coil from the center outward — the app's two interleaved spirals stand in for the alternating stripe.",
      'Heat the coiled strip until it fuses into a single solid disc with a spiral cross-section.',
      'Gather the casing color over the fused coil, coating it evenly.',
      'Reheat and pull the cased gather into a rod — the casing stays as an outer layer the whole length, with the spiral visible in the core.',
    ],
  },
  pinwheel: {
    title: 'Pinwheel Cane',
    summary:
      'Alternating colored wedges — like slices of a pie — bundled side by side around a center point, then twisted as the whole bundle is drawn out. The straight wedge seams curve into a swirling pinwheel pattern as the twist works its way through the pull; more twist (or a longer pull) curves the blades further.',
    steps: [
      'Pull each wedge-shaped color as its own simple cane, cut to matching lengths.',
      'Pack the wedges together around a center point, alternating colors, so the cross-section looks like a pie sliced into equal wedges.',
      "Fuse the bundle with a reheat, then twist it as it's drawn out from both ends — the twist is what curves the straight wedge seams into the pinwheel's characteristic swirl.",
      'Slice the cooled rod crosswise — every slice shows the same curved pinwheel pattern.',
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
  embeddedThread: {
    title: 'Embedded Thread',
    summary:
      "A thin thread trailed into a gather at one spot, then covered back over — an accent color sitting inside the glass at one point, not sheeting all the way around it the way a full casing does. On its own it's just an inclusion; twist the bundle while pulling (the Rod Extrusion twist) and that off-center thread spirals into a visible helix — the zanfirico/filigrana technique.",
    steps: [
      'Gather the base color first.',
      'Trail a thin thread of the accent color onto one spot on the gather and marver it in so it fuses with the surface.',
      'Reheat and gather a thin layer of the base color back over it, re-covering the thread.',
      'Pull into a rod — twisting as you pull spirals the embedded thread into a helix (zanfirico); pulling straight keeps it as one visible seam along the length instead.',
    ],
  },
  bundle: {
    title: 'Bundling Canes',
    summary:
      "When multiple shapes sit apart from each other — not nested inside one another — each one represents an already-pulled cane (simple, cased, faceted, or chevron) gathered alongside the others and fused into one new composite rod. This is how real complex murrini cross-sections — flower canes, mosaic canes — are actually built: separate canes packed side by side and redrawn as one, not a single pull. (A smaller shape nested inside a larger one is a different technique — see Casing or Embedded Thread.)",
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

function computeElementReach(element) {
  return computeShapeReach(element.shape, element.params)
}

// True when b's bounding circle fits entirely inside a's — the correct
// general test for "nested inside," which is broader than "centered on
// the same point." A cased color doesn't have to be dead-center: an
// off-center thread embedded in a gather (the setup a zanfirico twist
// needs) is still one color nested inside another, not two separate
// canes bundled side by side. Concentric placement is just the special
// case of this where the offset happens to be zero. Tolerance scales
// with the bigger shape's own size so it still reads as "nested" at any
// zoom/scale, not just a fixed pixel radius.
function isNested(a, reachA, b, reachB) {
  const bigger = Math.max(reachA, reachB)
  const smaller = Math.min(reachA, reachB)
  const tolerance = Math.max(4, bigger * 0.15)
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  return dist + smaller <= bigger + tolerance
}

// True when every shape in the set nests inside the single largest one —
// the whole group reads as one cased/layered cane, not separate canes
// bundled together.
function allElementsNested(elements) {
  const reach = elements.map(computeElementReach)
  let outerIndex = 0
  for (let i = 1; i < elements.length; i++) {
    if (reach[i] > reach[outerIndex]) outerIndex = i
  }
  return elements.every(
    (el, i) => i === outerIndex || isNested(elements[outerIndex], reach[outerIndex], el, reach[i]),
  )
}

// What a single shape, on its own, actually becomes — the base case both
// resolveTechniqueKey and the per-cluster build plan below reduce to.
function resolveSingleShapeTechniqueKey(shape, params = {}) {
  if (shape === 'square') return 'marver'
  if (shape === 'polygon') {
    return (params.sides ?? 4) <= MAX_HAND_MARVERED_SIDES ? 'marver' : 'opticMold'
  }
  // A lone leftover pinwheel blade (e.g. after undoing away its siblings)
  // still reads as the pinwheel technique, not a shape of its own.
  if (shape === 'pinwheelBlade') return 'pinwheel'
  return shape
}

// True when every element in a concentric group was placed together by
// the same compound tool (jellyroll, pinwheel) — read from the tag each
// element carries, not guessed from shape/color, so a coincidentally
// concentric mix of hand-placed shapes still reads as plain casing.
function resolveCompoundTechniqueKey(group) {
  const compoundType = group[0]?.compoundType
  if (compoundType && group.every((el) => el.compoundType === compoundType)) {
    return compoundType
  }
  return null
}

// For a group that's already confirmed nested (allElementsNested), tells
// a full casing apart from an off-center embedded thread: casing coats
// the whole core, so the inner shape sits dead-center on the outer one;
// anything meaningfully off that center is a localized inclusion instead
// — the setup a zanfirico twist needs, not a coating.
function classifyNestedGroup(elements) {
  const reach = elements.map(computeElementReach)
  let outerIndex = 0
  for (let i = 1; i < elements.length; i++) {
    if (reach[i] > reach[outerIndex]) outerIndex = i
  }
  const outer = elements[outerIndex]
  const concentricTolerance = Math.max(4, reach[outerIndex] * 0.15)
  const allConcentric = elements.every((el, i) => {
    if (i === outerIndex) return true
    const dx = el.x - outer.x
    const dy = el.y - outer.y
    return Math.sqrt(dx * dx + dy * dy) <= concentricTolerance
  })
  return allConcentric ? 'ring' : 'embeddedThread'
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
    if (!allElementsNested(elements)) return 'bundle'
    return resolveCompoundTechniqueKey(elements) ?? classifyNestedGroup(elements)
  }

  const shape = elements.length === 1 ? elements[0].shape : fallbackShape
  const params = elements.length === 1 ? elements[0].params : fallbackParams
  return resolveSingleShapeTechniqueKey(shape, params)
}

// Groups elements into the individual canes they'd actually be pulled as:
// shapes that nest inside each other (one color inside another, however
// it's offset) merge into one cluster (one cased/layered cane), everything
// else stays its own cluster (a separate cane, to be bundled with the rest
// later). Union-find over pairwise nesting checks, same rule as
// allElementsNested.
function clusterElements(elements) {
  const reach = elements.map(computeElementReach)
  const parent = elements.map((_, i) => i)
  const find = (i) => {
    while (parent[i] !== i) i = parent[i]
    return i
  }
  const union = (i, j) => {
    const ri = find(i)
    const rj = find(j)
    if (ri !== rj) parent[ri] = rj
  }

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      if (isNested(elements[i], reach[i], elements[j], reach[j])) union(i, j)
    }
  }

  const clusters = new Map()
  elements.forEach((element, i) => {
    const root = find(i)
    if (!clusters.has(root)) clusters.set(root, [])
    clusters.get(root).push(element)
  })
  return [...clusters.values()]
}

// The actual build order for what's currently on the canvas: one step per
// individual cane (a lone shape, or a casing/layered cluster of nested
// shapes), then — only if there's more than one cane — a final bundling
// step tying them together. This is the same geometry analysis
// resolveTechniqueKey uses, just carried through every cluster instead of
// collapsing straight to one overall label, so it stays exactly as
// accurate: it's reading the real layout back, not guessing at intent.
export function computeBuildPlan(elements) {
  if (elements.length === 0) return []

  const clusters = clusterElements(elements)
  const steps = clusters.map((cluster) => ({
    techniqueKey:
      cluster.length > 1
        ? (resolveCompoundTechniqueKey(cluster) ?? classifyNestedGroup(cluster))
        : resolveSingleShapeTechniqueKey(cluster[0].shape, cluster[0].params),
    caneCount: cluster.length,
  }))

  if (clusters.length > 1) {
    steps.push({ techniqueKey: 'bundle', caneCount: elements.length })
  }
  return steps
}
