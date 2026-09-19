// Reference notes on the real glassblowing techniques each digital shape
// stands in for. Keyed by the same shape id used in engine/murrini/shapes.js.
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
  polygon: {
    title: 'Optic / Facet Mold',
    summary:
      "Instead of pulling a round gather, it's pressed into a ribbed or faceted metal mold first. The mold's flat panels imprint straight facets onto the glass, so the pulled cane has a polygonal cross-section instead of a circle.",
    steps: [
      'Gather the glass and reheat it to working temperature.',
      'Lower the gather into an optic mold with flat internal panels and press it against the mold walls.',
      'Remove the faceted gather and pull it into a rod — the facets hold along the whole length.',
    ],
  },
  star: {
    title: 'Star / Chevron Mold',
    summary:
      'The classic chevron-bead technique: a gather is pressed into a star-shaped (rosetta) mold, then cased with a contrasting color and pressed into the star mold again — repeated for each layer. Slicing the finished cane shows nested star layers radiating outward.',
    steps: [
      'Press a gather into a star-shaped mold so its cross-section becomes star-shaped.',
      'Case that star with a contrasting color, then press into the star mold again so the new layer keeps the star outline.',
      'Repeat casing for as many nested colors as wanted, then pull the finished bundle into a rod.',
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
