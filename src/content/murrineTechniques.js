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
}

// Marvering a fixed number of flat sides by hand stays practical up to
// about a hexagon; more facets than that is realistically mold territory.
const MAX_HAND_MARVERED_SIDES = 6

export function resolveTechniqueKey(shape, params = {}) {
  if (shape === 'polygon') {
    return params.sides <= MAX_HAND_MARVERED_SIDES ? 'marver' : 'opticMold'
  }
  return shape
}
