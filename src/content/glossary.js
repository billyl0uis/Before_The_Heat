// Shop words the app uses, in plain language. Shown inline where a word
// first appears (see components/Term.jsx) and as the Glossary in Learn.
// Keep each one short and true: what it is, then why it matters here.
export const GLOSSARY = {
  annealer: {
    term: 'Annealer',
    definition: 'An oven that cools finished glass slowly, so stress doesn’t build up and crack it.',
  },
  bundle: {
    term: 'Bundle',
    definition:
      'Several canes packed side by side, fused into one rod and pulled again. Flower and mosaic patterns are built this way. Round canes leave air between them, which has to be worked out before the outside seals.',
  },
  cane: {
    term: 'Cane',
    definition:
      'A rod of glass, often with a pattern running all the way through it, made by stretching a hot gather until it’s long and thin.',
  },
  casing: {
    term: 'Casing',
    definition:
      'A layer of glass, usually clear, gathered over a cane or bundle. It protects the pattern and sets the rod’s size before it’s pulled.',
  },
  coe: {
    term: 'COE',
    definition:
      'Coefficient of expansion: how much a glass grows and shrinks with heat. Glasses that don’t match can crack as they cool, so use colors from one compatible system.',
  },
  collar: {
    term: 'Collar',
    definition:
      'A short ring of glass on the end of a blowpipe. Rolled across a pick-up, it gathers the canes or slices up into a tube.',
  },
  devitrification: {
    term: 'Devitrification',
    definition:
      'A cloudy, crystal-like skin some glasses grow after too much time in the heat. Opal whites are prone to it; casing them in clear helps.',
  },
  filigree: {
    term: 'Filigree (filigrana)',
    definition:
      'Cane with fine threads of color, usually white, running through clear glass. Zanfirico, latticino and vetro a fili are all kinds of filigree.',
  },
  gather: {
    term: 'Gather',
    definition:
      'Glass collected from the furnace on the end of a pipe or rod. For cane, it’s the hot mass you build the pattern in before you pull it.',
  },
  gloryHole: {
    term: 'Glory hole',
    definition: 'The reheating furnace you put the work back into between steps, to keep it hot enough to shape.',
  },
  jacks: {
    term: 'Jacks',
    definition: 'A tweezer-like steel tool for shaping and necking hot glass.',
  },
  kilnShelf: {
    term: 'Kiln shelf',
    definition:
      'A flat plate that canes or murrini are laid out on and heated before a pick-up, so they’re hot enough to stick to the gather.',
  },
  latticino: {
    term: 'Latticino',
    definition:
      'Filigree whose threads are milk-white (latte is Italian for milk). Often used for the twisted lattice threads in zanfirico.',
  },
  marver: {
    term: 'Marver',
    definition:
      'The flat steel table you roll hot glass on to shape it, chill its skin and push air out. Also the word for doing that.',
  },
  moil: {
    term: 'Moil',
    definition:
      'The glass where the work joins the pipe or rod. It’s distorted, so it’s cut away rather than used.',
  },
  murrine: {
    term: 'Murrine (plural murrini)',
    definition:
      'A thin slice cut across a patterned cane, showing the pattern end-on. Laid out and picked up, slices pattern a whole vessel.',
  },
  punty: {
    term: 'Punty',
    definition:
      'A solid steel rod used to hold hot glass: to gather on when building a cane, or to hold a piece while its other end is worked.',
  },
  pickup: {
    term: 'Pick-up',
    definition:
      'Laying canes or murrini on a hot kiln shelf, then rolling a gather or collar across them so they stick, to pattern a vessel.',
  },
  pull: {
    term: 'Pull',
    definition:
      'Stretching the hot gather into a long, thin cane, usually by two people walking apart. Twisting as you pull spirals the pattern.',
  },
  pullRatio: {
    term: 'Pull ratio',
    definition:
      'How many times thinner the pull makes the gather. At 4 : 1, a 32 mm gather becomes 8 mm cane, about 16 times longer.',
  },
  reticello: {
    term: 'Reticello',
    definition:
      'A net pattern: one cup of twisted rib canes is blown inside another twisted the opposite way, so the threads cross and trap a small bubble in each diamond.',
  },
  strike: {
    term: 'Strike',
    definition:
      'Some colors, like gold ruby and cadmium reds, come out pale and only develop their color when reheated. That reheat is striking.',
  },
  vetroAFili: {
    term: 'Vetro a fili',
    definition:
      'Filigree with single straight threads, one thread per cane. Reticello is made from two sets of these canes twisted opposite ways.',
  },
  zanfirico: {
    term: 'Zanfirico',
    definition:
      'A filigree cane: threads round a core, twisted as it’s pulled so they spiral. Used in lengths in a pick-up rather than sliced.',
  },
}

export const GLOSSARY_ORDER = Object.keys(GLOSSARY).sort((a, b) =>
  GLOSSARY[a].term.localeCompare(GLOSSARY[b].term),
)
