import { buildCompoundElements } from './compoundShapes'
import { DEFAULT_EXTRUSION } from './extrude'
import { CURRENT_SCHEMA_VERSION } from './migrate'
import { DEFAULT_PATTERN } from './pattern'
import { CLEAR_GLASS, findColorant } from './rod'
import { SHAPE_TYPES } from './shapes'

// Starting points for Simple mode: real murrine constructions, each with
// named colour slots. A recipe builds the same data the full editor makes
// (elements, pattern, casing), so the Plan, autosave, the Vault and
// Advanced mode all work on it unchanged.
//
// Sizes are world units inside a rod of radius 230, kept clear of the
// casing so nothing is trimmed by the rod edge.

const CASING_MM = 1.5

function swatch(id) {
  return { id, swatch: (findColorant(id) ?? CLEAR_GLASS).swatch }
}

function circle(x, y, radius, colorantId) {
  return { shape: 'circle', x, y, params: { radius }, colorantId }
}

// Turn plain specs into editor elements (ids, layers, colours).
function toElements(specs) {
  return specs.map((spec, layer) => ({
    id: crypto.randomUUID(),
    shape: spec.shape,
    x: spec.x,
    y: spec.y,
    rotation: spec.rotation ?? 0,
    color: spec.color ?? swatch(spec.colorantId).swatch,
    colorantId: spec.colorantId,
    opacity: spec.opacity ?? 1,
    layer,
    params: { ...SHAPE_TYPES[spec.shape]?.defaultParams, ...spec.params },
    compoundId: spec.compoundId,
    compoundType: spec.compoundType,
  }))
}

function compound(type, params, primary, accent, casing = 'clear') {
  return buildCompoundElements(type, 0, 0, params, {
    primary: swatch(primary),
    accent: swatch(accent),
    casing: swatch(casing),
  })
}

export const RECIPES = {
  bullseye: {
    name: 'Bullseye',
    blurb: 'A core cased in a ring of color',
    slots: {
      core: { label: 'Core', defaultId: 'gold-ruby' },
      ring: { label: 'Ring', defaultId: 'opal-white' },
      casing: { label: 'Casing', defaultId: 'cobalt-blue', allowClear: true },
    },
    build: (c) => ({ specs: [circle(0, 0, 160, c.ring), circle(0, 0, 80, c.core)] }),
  },
  flower: {
    name: 'Flower',
    blurb: 'Six petals around a centre',
    slots: {
      centre: { label: 'Centre', defaultId: 'silver-stain-yellow' },
      petals: { label: 'Petals', defaultId: 'opal-white' },
      casing: { label: 'Casing', defaultId: 'cobalt-blue', allowClear: true },
    },
    // One petal plus the centre, repeated six times round the middle; the
    // centre sits on the axis, so the plan correctly counts it once.
    build: (c) => ({
      specs: [circle(0, 118, 58, c.petals), circle(0, 0, 54, c.centre)],
      pattern: { ...DEFAULT_PATTERN, repeatType: 'radial', radialCount: 6 },
    }),
  },
  zanfirico: {
    name: 'Zanfirico',
    blurb: 'Threads round a core, twisted when pulled',
    slots: {
      threads: { label: 'Threads', defaultId: 'opal-white' },
      core: { label: 'Core', defaultId: 'clear', allowClear: true },
      casing: { label: 'Casing', defaultId: 'clear', allowClear: true },
    },
    build: (c) => ({
      specs: compound('zanfirico', { coreRadius: 160, threadCount: 6 }, c.core, c.threads),
      // A zanfirico only shows its spiral once it's twisted on the pull.
      extrusion: { ...DEFAULT_EXTRUSION, twistDegrees: 720, length: 200 },
    }),
  },
  tripod: {
    name: 'Tripod',
    blurb: 'Three canes round a centre cane',
    slots: {
      centre: { label: 'Centre cane', defaultId: 'copper-turquoise' },
      outer: { label: 'Outer canes', defaultId: 'opal-white' },
      casing: { label: 'Casing', defaultId: 'black-glass', allowClear: true },
    },
    build: (c) => ({ specs: compound('tripod', { caneRadius: 60, rings: 1 }, c.centre, c.outer) }),
  },
  cross: {
    name: 'Cross',
    blurb: 'Four canes round a centre cane',
    slots: {
      centre: { label: 'Centre cane', defaultId: 'gold-ruby' },
      outer: { label: 'Outer canes', defaultId: 'opal-white' },
      casing: { label: 'Casing', defaultId: 'clear', allowClear: true },
    },
    build: (c) => ({ specs: compound('cross', { caneRadius: 58, rings: 1 }, c.centre, c.outer) }),
  },
  frame: {
    name: 'Frame',
    blurb: 'A square centre in a ring of canes',
    slots: {
      centre: { label: 'Centre', defaultId: 'erbium-pink' },
      frame: { label: 'Frame canes', defaultId: 'chromium-green' },
      casing: { label: 'Casing', defaultId: 'clear', allowClear: true },
    },
    build: (c) => ({ specs: compound('frame', { extent: 140, sideCount: 3 }, c.centre, c.frame) }),
  },
}

export const RECIPE_ORDER = ['bullseye', 'flower', 'zanfirico', 'tripod', 'cross', 'frame']

export function defaultColours(recipeKey) {
  return Object.fromEntries(
    Object.entries(RECIPES[recipeKey].slots).map(([key, slot]) => [key, slot.defaultId]),
  )
}

// How far a recipe twists by default when pulled (degrees over the pull).
export function defaultTwist(recipeKey) {
  return RECIPES[recipeKey].build(defaultColours(recipeKey)).extrusion?.twistDegrees ?? 0
}

// The full design a recipe produces, ready for loadDesign(). `twistDegrees`
// overrides the recipe's own twist: any cane can be twisted on the pull.
export function buildRecipe(recipeKey, colours, rod, { twistDegrees } = {}) {
  const recipe = RECIPES[recipeKey]
  const merged = { ...defaultColours(recipeKey), ...colours }
  const { specs, pattern, extrusion } = recipe.build(merged)
  return {
    // Current-format data: without this, loadDesign's migration would read
    // it as an old save and replace the rod and casing chosen here.
    schemaVersion: CURRENT_SCHEMA_VERSION,
    elements: toElements(specs),
    pattern: pattern ?? DEFAULT_PATTERN,
    extrusion: {
      ...(extrusion ?? DEFAULT_EXTRUSION),
      ...(twistDegrees === undefined ? {} : { twistDegrees }),
    },
    rod,
    casing: [{ colorantId: merged.casing, thicknessMm: CASING_MM }],
  }
}

// What a design looks like for comparison, ignoring generated ids, so
// Simple mode can tell whether the design is still the one it made.
export function designSignature({ elements, pattern, casing }) {
  return JSON.stringify({
    e: elements.map((e) => [e.shape, Math.round(e.x), Math.round(e.y), e.colorantId, e.params]),
    p: [pattern.repeatType, pattern.radialCount, pattern.rows, pattern.columns],
    c: casing,
  })
}
