// Reference entries for real glass colorant chemistry — not a live analysis
// of whatever hex value someone picks. Swatch hex values are illustrative
// approximations for the UI, not spectrophotometric measurements; the
// colorant, family, strikes, devitrifies, and caution fields are the parts
// checked against sources (Corning Museum of Glass, Wikipedia, patent
// literature, and other glass-chemistry references) before being written.
//
// family: 'transparent' | 'opaque' — opaque entries are opacifiers, not
//   tints (they scatter light rather than color it).
// strikes: true means the color needs a controlled reheat near the
//   softening point to develop — it can look pale or colorless straight
//   out of the furnace.
// devitrifies: whether this colorant/family is documented as prone to
//   devitrification (a rough, whitish, crazed surface from too much
//   flame exposure). 'some' means it varies by specific manufacturer SKU,
//   not the whole family.
export const GLASS_COLOR_INDEX = [
  {
    id: 'cobalt-blue',
    name: 'Cobalt Blue',
    swatch: '#1e3a8a',
    colorant: 'Cobalt oxide (CoO)',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      'One of the strongest colorants in glass — tiny amounts produce deep blue. Cobalt glasses need more energy to melt and cool noticeably faster than most colors; at high saturation they work stiff, which is why some suppliers blend in extra flux specifically to soften cobalt\'s working range.',
  },
  {
    id: 'copper-turquoise',
    name: 'Copper Turquoise / Green',
    swatch: '#0d9488',
    colorant: 'Copper oxide (oxidizing atmosphere)',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      'Copper gives a blue-green/turquoise color under normal oxidizing furnace conditions — the everyday result of working with copper.',
  },
  {
    id: 'copper-red',
    name: 'Copper Red (Reduction)',
    swatch: '#7f1d1d',
    colorant: 'Copper (reducing atmosphere)',
    family: 'transparent',
    strikes: true,
    devitrifies: false,
    caution: null,
    notes:
      'The same copper that gives turquoise under normal conditions instead gives a deep red — "copper ruby," historically used as a cheaper substitute for gold ruby — under a reducing furnace atmosphere with careful heat treatment. Same colorant, opposite result, purely from atmosphere control, which makes it a genuine strike/redox-sensitive color rather than a fixed tint.',
  },
  {
    id: 'gold-ruby',
    name: 'Gold Ruby / Cranberry',
    swatch: '#be123c',
    colorant: 'Colloidal gold (Purple of Cassius)',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      "Color comes from gold metal nanoparticles suspended in the glass, not a simple dissolved tint — particle size sets the hue, with smaller particles (~60nm) reading red and larger ones shifting toward purple, then blue. Historically one of the most expensive colorants used in glass, which is part of why cranberry glass reads as a luxury color.",
  },
  {
    id: 'cadmium-selenium-red',
    name: 'Cadmium/Selenium Red & Orange',
    swatch: '#dc2626',
    colorant: 'Cadmium sulfoselenide (CdS/CdSe)',
    family: 'transparent',
    strikes: true,
    devitrifies: false,
    caution:
      'Cadmium is toxic in powder or vapor form. The risk is mainly dust from grinding, cutting, or cold-working this color, not the solid glass itself — use ventilation and avoid dry-grinding without dust control.',
    notes:
      "A genuine striking color: it can come straight out of the furnace looking pale or nearly colorless, and only develops its full red/orange when reheated near the softening point and held there — cool it too fast and the color never shows. Widely reported by glassworkers as one of the touchier color families to work.",
  },
  {
    id: 'cadmium-yellow',
    name: 'Cadmium Yellow',
    swatch: '#eab308',
    colorant: 'Cadmium sulfide (CdS, no selenium)',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution:
      'Cadmium sulfide is toxic by inhalation, particularly as dust or vapor. Same handling precautions as the cadmium/selenium reds — ventilation, no dry-grinding.',
    notes:
      "The plain-sulfide sibling of the cadmium/selenium reds — cadmium sulfide alone gives a straightforward yellow without needing selenium in the mix, and without the same strike-to-develop behavior the red/orange blends have.",
  },
  {
    id: 'manganese-purple',
    name: 'Manganese Purple / Violet',
    swatch: '#7e22ce',
    colorant: 'Manganese dioxide (MnO2)',
    family: 'transparent',
    strikes: false,
    devitrifies: 'some',
    caution: null,
    notes:
      'Same element does double duty: enough manganese gives a purple/violet glass, but small amounts are also used as a decolorizer to cancel out the green tint that iron impurities cause in "clear" glass. Some specific commercial purples are documented as notably prone to devitrification with repeated flame exposure — this varies by manufacturer, not by manganese content alone.',
  },
  {
    id: 'chromium-green',
    name: 'Chromium Green',
    swatch: '#15803d',
    colorant: 'Chromium oxide (Cr2O3)',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      'A very strong colorant — small amounts give a clear, dark green; push the concentration higher and it goes nearly black.',
  },
  {
    id: 'iron-blue-green',
    name: 'Iron Blue-Green (Ferrous)',
    swatch: '#0f766e',
    colorant: 'Iron oxide, Fe²⁺ (ferrous)',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      'Iron in the ferrous (Fe²⁺) state reads blue-green. Which oxidation state you get depends on the furnace atmosphere during working, not just the batch recipe — the same base glass can swing toward this or its ferric sibling.',
  },
  {
    id: 'iron-yellow-green',
    name: 'Iron Yellow-Green (Ferric)',
    swatch: '#84cc16',
    colorant: 'Iron oxide, Fe³⁺ (ferric)',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      'Same colorant as the ferrous entry, oxidized further: ferric iron (Fe³⁺) reads yellow-green instead of blue-green. A clear example of why "the same" iron-colored glass can shift piece to piece with furnace conditions.',
  },
  {
    id: 'sulfur-carbon-amber',
    name: 'Amber (Iron/Sulfur/Carbon)',
    swatch: '#92400e',
    colorant: 'Iron + sulfur, reduced with carbon',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      "Classic bottle-glass amber isn't iron alone — it's a specific chromophore formed when iron and sulfide sulfur combine under a reducing (carbon-added) melt. Different chemistry from the plain iron entries above even though the visual family (brown/amber) can look similar.",
  },
  {
    id: 'nickel-violet',
    name: 'Nickel Violet / Gray-Brown',
    swatch: '#6d5a7a',
    colorant: 'Nickel oxide (NiO)',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      'A strong colorant whose result depends heavily on the base glass: in a potash-based glass it reads violet/blue-violet, in a soda-lime base (the common furnace glass) it tends toward brown or gray instead. Same oxide, different outcome, because of what it\'s melted into — not a fixed color the way some other colorants are.',
  },
  {
    id: 'opal-white',
    name: 'Opal White',
    swatch: '#f5f5f4',
    colorant: 'Tin oxide / phosphate-crystal opacifiers',
    family: 'opaque',
    strikes: false,
    devitrifies: true,
    caution: null,
    notes:
      "Not a tint — an opacifier. It works by growing microscopic crystals in the glass that scatter light instead of transmitting it, which is what makes it opaque rather than colored. Opal and opaque whites are commonly documented as the colors most prone to devitrification (a whitish, rough, crazed surface) after too much time in the flame — worth planning shorter reheats around.",
  },
  {
    id: 'silver-stain-yellow',
    name: 'Silver Stain Yellow',
    swatch: '#ca8a04',
    colorant: 'Silver nitrate (surface stain)',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      "Different mechanism from every other entry here: it isn't mixed into the melt at all. Silver nitrate is painted onto the surface and fired at a comparatively low temperature (roughly 550-560°C), where it diffuses into the glass surface and becomes part of its structure — the technique that's actually the origin of the term \"stained glass.\" A longer or repeated firing deepens pale yellow toward a richer orange.",
  },
  {
    id: 'neodymium-violet',
    name: 'Neodymium Violet (Color-Shifting)',
    swatch: '#c4b5fd',
    colorant: 'Neodymium oxide',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      'A rare-earth colorant, weaker than the traditional transition-metal colorants above, so it takes a higher percentage to show color. Reads as pale violet in normal light but shifts noticeably blue under fluorescent lighting — a genuine color-shifting effect, not a trick of the swatch.',
  },
  {
    id: 'praseodymium-green',
    name: 'Praseodymium Pale Green',
    swatch: '#86efac',
    colorant: 'Praseodymium oxide',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      "Another rare-earth colorant, giving a soft pastel green on its own — combined with other materials it can also produce a notably clean, pure yellow. Like neodymium, it's a weaker colorant than the transition metals, so it stays pastel rather than saturated.",
  },
  {
    id: 'erbium-pink',
    name: 'Erbium Rose Pink',
    swatch: '#f9a8d4',
    colorant: 'Erbium oxide',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      'A third rare-earth colorant, giving a soft rose pink. Like the other rare earths here, it reads pastel rather than saturated compared to the traditional transition-metal colorants.',
  },
  {
    id: 'black-glass',
    name: 'Black',
    swatch: '#18181b',
    colorant: 'Manganese + chromium + cobalt (or iron + manganese + cobalt)',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution: null,
    notes:
      "True black isn't one colorant — it's a documented multi-oxide recipe, most commonly manganese dioxide, chromium oxide, and cobalt oxide together (an iron/manganese/cobalt combination is also used). Each of those three shows up elsewhere in this index on its own; stacked together in the right ratio, they push the glass past any single hue into black.",
  },
  {
    id: 'uranium-vaseline',
    name: 'Uranium / Vaseline Yellow-Green',
    swatch: '#a3e635',
    colorant: 'Uranium oxide',
    family: 'transparent',
    strikes: false,
    devitrifies: false,
    caution:
      'Contains a radioactive element. Uncommon in modern studio practice for that reason — listed here for chemistry completeness, not as a recommended working color.',
    notes:
      'Famous for glowing green under UV/blacklight because of its uranium content. This is historic "vaseline glass" — rarely sourced by studios today given the regulatory hurdles around a radioactive colorant.',
  },
]

export const COE_NOTE = {
  title: 'Why every color also needs to physically match',
  body: "Chemistry sets a glass's color; physics decides whether it can actually be combined with other colors. Every glass has a Coefficient of Expansion (COE) — how much it expands when heated and contracts when it cools, in parts per million per °C. If two colors in the same piece have different COEs, they pull against each other as the whole thing cools after being worked, building up internal stress. That stress shows up as cracking, sometimes immediately and sometimes weeks later, and it happens regardless of how well the colors chemically get along. This is a separate axis from what's covered above — a compatible COE match doesn't guarantee a nice color combination, and a great color combination is worthless if the COEs don't match. Common named systems include COE 104 (soft/lampworking glass — long working time, most color variety), COE 96 and COE 90 (fusing systems), and COE 33 (borosilicate, high-temperature). The specific number for any given colored rod depends on its manufacturer's formulation, not the colorant family alone — this app doesn't assign COE numbers per color for that reason, and neither should you without checking the actual supplier data for the glass in hand.",
}

export const ENCASEMENT_NOTE = {
  title: 'Does a murrino need a clear casing layer?',
  body: "Often yes, for two documented reasons — not just convention. First, encasing a cane in clear glass protects a striking color's pattern through the repeated reheating and handling a pull requires; striking colors (like the cadmium and copper-red entries above) specifically need that controlled reheat to develop, so shielding the pattern during it matters. Second, some colors — notably opal whites and certain commercial purples — are documented as prone to devitrification with repeated flame exposure; a clear casing cuts down how much direct flame time that color sees. Not every color needs it, and encasement always changes a cane's size and proportions, so it's a real design tradeoff, not a free win.",
}
