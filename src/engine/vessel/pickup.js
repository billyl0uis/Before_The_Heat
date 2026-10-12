import { findColorant, pulledDiameterMm, pulledLengthMm } from '../murrini/rod'
import { pullRodOf, turnsLabel } from '../murrini/shopPlan'
import { VESSEL_FORM_PRESETS, vesselRadiusFunction } from './profile'
import { THREAD_MM, threadDriftTurns } from './reticello'

// A murrini pick-up, worked out from the vessel's own outside wall: how
// many slices of the pulled cane cover it, how much cane that takes, and
// the patch you lay out on the kiln shelf. Everything here is in mm.

const WALL_ROWS = 96

// Slices lie on the wall, so the wall is measured along its length (up the
// curve), not by straight height: a bowl's side is much longer than the
// bowl is tall.
export function measureWall(radiusAt, height, rows = WALL_ROWS) {
  const radii = []
  for (let j = 0; j <= rows; j++) radii.push(radiusAt(j / rows))
  const arc = [0]
  for (let j = 1; j <= rows; j++) arc.push(arc[j - 1] + Math.hypot(radii[j] - radii[j - 1], height / rows))
  return {
    height,
    rows,
    radii,
    arc,
    length: arc[rows],
    maxRadius: Math.max(...radii),
    meanRadius: radii.reduce((sum, r) => sum + r, 0) / radii.length,
    baseRadius: radii[0],
    rimRadius: radii[rows],
  }
}

export function radiusAtLength(wall, s) {
  const { arc, radii, rows } = wall
  let j = 0
  while (j < rows - 1 && arc[j + 1] < s) j++
  const f = Math.min(1, Math.max(0, (s - arc[j]) / Math.max(1e-6, arc[j + 1] - arc[j])))
  return radii[j] + (radii[j + 1] - radii[j]) * f
}

// Edge to edge in hex rows up the wall, as many slices as fit round the
// circumference at each row's height, then a centre slice and rings on the
// base. Wall slices are {u, v}: u round the wall, v the fraction of the
// way up its length. Base slices are {x, y} in mm from the centre.
export function murriniLayout(wall, sliceDiameterMm) {
  const d = sliceDiameterMm
  const wallSlices = []
  const rowGap = (d * Math.sqrt(3)) / 2
  for (let s = d / 2, row = 0; s + d / 2 <= wall.length + 1e-6; s += rowGap, row++) {
    const around = Math.floor((2 * Math.PI * radiusAtLength(wall, s)) / d)
    for (let i = 0; i < around; i++) {
      wallSlices.push({ u: (i + (row % 2 ? 0.5 : 0)) / around, v: s / wall.length })
    }
  }
  const baseSlices = []
  if (d / 2 <= wall.baseRadius) baseSlices.push({ x: 0, y: 0 })
  for (let ring = 1; ring * d + d / 2 <= wall.baseRadius; ring++) {
    const radius = ring * d
    const around = Math.floor((2 * Math.PI * radius) / d)
    for (let i = 0; i < around; i++) {
      const a = (i / around) * Math.PI * 2
      baseSlices.push({ x: radius * Math.cos(a), y: radius * Math.sin(a) })
    }
  }
  return { wall: wallSlices, base: baseSlices, count: wallSlices.length + baseSlices.length }
}

// What a saw cut costs. Nipped slices lose nothing; sawn ones lose about a
// blade's width each, so the count is safe either way.
export const SAW_KERF_MM = 1

export function pickupTotals({ count, thicknessMm, pullLengthMm }) {
  const caneMm = count * (thicknessMm + SAW_KERF_MM)
  const pulls = Math.max(1, Math.ceil(caneMm / pullLengthMm))
  return { caneMm, pulls, spareMm: pulls * pullLengthMm - caneMm }
}

const round5 = (mm) => Math.max(5, Math.round(mm / 5) * 5)

// The wall unrolled, plus enough at one end to close over the base.
export function pickupPatch(wall) {
  return { widthMm: round5(2 * Math.PI * wall.meanRadius), heightMm: round5(wall.length + wall.baseRadius) }
}

export function vesselName(shape) {
  if (shape.freeform) return 'Your outline'
  const label = VESSEL_FORM_PRESETS[shape.presetKey]?.label ?? 'Custom form'
  return shape.edited ? `${label}, adjusted` : label
}

// The plan's own words for the form: "the tumbler", or "your form" once
// it's been changed from a named one.
function formPhrase(shape) {
  if (shape.freeform || shape.edited || !VESSEL_FORM_PRESETS[shape.presetKey]) return 'your form'
  return `the ${VESSEL_FORM_PRESETS[shape.presetKey].label.toLowerCase()}`
}

const fmt = (value, digits = 1) => value.toLocaleString('en', { maximumFractionDigits: digits })
export const metres = (mm) => fmt(mm / 1000, mm < 1000 ? 2 : 1)

// Everything the Vessel page and the plan need about the pick-up, or null
// when there's nothing to pick up (no cane, no murrini, no slices placed).
export function planPickup(vessel, design) {
  if (vessel.pattern === 'canes') return planCanePickup(vessel, design)
  if (vessel.pattern !== 'murrini' || !design.elements.length) return null
  const radiusAt = vesselRadiusFunction(vessel)
  const wall = measureWall(radiusAt, vessel.params.height)
  const rod = pullRodOf(design)
  const sliceDiameterMm = pulledDiameterMm(rod)
  const pullLengthMm = pulledLengthMm(rod)
  const byHand = vessel.place === 'hand'
  const count = byHand ? vessel.placements.length : murriniLayout(wall, sliceDiameterMm).count
  if (!count) return null
  const totals = pickupTotals({ count, thicknessMm: vessel.thicknessMm, pullLengthMm })
  const patch = pickupPatch(wall)
  const upTo = byHand ? '' : 'up to '
  const lines = [
    `Cut the Ø ${fmt(sliceDiameterMm)} mm cane into ${fmt(vessel.thicknessMm)} mm slices: ${upTo}${count.toLocaleString('en')} of them. That's about ${metres(totals.caneMm)} m of cane${
      totals.pulls > 1 ? `, so build and pull this cane ${totals.pulls} times` : ', one pull'
    }, allowing ${SAW_KERF_MM} mm per saw cut.`,
    byHand
      ? 'Lay them on a kiln shelf where you placed them, and heat them through.'
      : `Lay them edge to edge on a kiln shelf in a patch about ${patch.widthMm} × ${patch.heightMm} mm, with enough at one end to close over the base, and heat them through.`,
    `Roll the gather across to pick them up, then blow out to ${formPhrase(vessel)}: ${fmt(wall.height, 0)} mm tall, Ø ${fmt(
      wall.rimRadius * 2,
      0,
    )} mm at the rim.${byHand ? '' : ' “Up to”, because blowing out stretches the slices, so the piece takes fewer.'}`,
  ]
  const outline = []
  for (let j = 0; j <= 24; j++) outline.push(wall.radii[Math.round((j / 24) * wall.rows)])
  return {
    wall,
    count,
    byHand,
    // For the sheet: the wall unrolled, with each hand-placed slice on it.
    map: byHand ? { placements: vessel.placements, widthMm: 2 * Math.PI * wall.meanRadius, heightMm: wall.length } : null,
    sliceDiameterMm,
    pullLengthMm,
    totals,
    patch,
    step: {
      key: 'pickup',
      after: 'after “Pull”',
      title: `Cut ${upTo}${count.toLocaleString('en')} slices and pick them up`,
      detail: lines.join(' '),
      lines,
      colorantIds: [],
      plate: { kind: 'vessel', outline, height: wall.height },
    },
  }
}

// Rib twist in the same words as a cane's: "half a turn, right".
export function ribTwistLabel(degrees) {
  if (!degrees) return 'Straight'
  return `${turnsLabel(degrees) || `${fmt(Math.abs(degrees) / 360, 2)} turns`}, ${degrees > 0 ? 'right' : 'left'}`
}

// How wide the first cup is where the rib canes close round it. The canes
// lie side by side right round this, so it sets how thick each one is.
// It's the first gather, not the finished piece: about an inch of glass
// on the end of the blowpipe, roughly 2.5 in (64 mm) across, whatever
// form it's blown out to afterwards.
const FIRST_GATHER_MM = 64

export function firstCupDiameterMm() {
  return FIRST_GATHER_MM
}

// Twist to the nearest quarter turn: about as fine as it's turned by hand.
const quarterTurns = (turns) => Math.max(0.25, Math.round(turns * 4) / 4)

// How long each cane picked up round the first cup needs to be. Blowing out
// stretches the cup round and up alike (see reticello.js), so the canes
// start shorter than the finished wall by the same factor the cup grows
// round: the wall's length scaled back to the first cup, plus a little to
// work with.
export function firstCupLengthMm(wall) {
  const back = (firstCupDiameterMm() / 2) / Math.max(1, wall.meanRadius)
  return Math.max(40, Math.round((wall.length * Math.min(1, back) + 20) / 10) * 10)
}

// How many canes of a given Ø lie side by side right round the first cup.
const canesRoundCup = (caneMm) => Math.max(4, Math.round((Math.PI * firstCupDiameterMm()) / caneMm))

const colourName = (id) => findColorant(id)?.name.split(' / ')[0].replace(/ \(.*\)$/, '') ?? 'glass'

// Reticello as a plan step: two sets of rib canes, each picked up and
// twisted into a cup the opposite way, one cup blown inside the other so
// the threads cross and trap air in the diamonds (see reticello.js for the
// sources). It stands on its own: it doesn't use the cane above.
export function planReticello(vessel) {
  if (vessel.pattern !== 'reticello') return null
  const wall = measureWall(vesselRadiusFunction(vessel), vessel.params.height)
  const perSide = Math.max(4, Math.round(vessel.ribsAround / 2))
  const a = colourName(vessel.ribA)
  const b = colourName(vessel.ribB)
  const lengthMm = firstCupLengthMm(wall)
  const cupMm = firstCupDiameterMm()
  const ribMm = Math.max(2, Math.round(((Math.PI * cupMm) / perSide) * 2) / 2)
  const twist = turnsLabel(quarterTurns(threadDriftTurns(wall)) * 360)
  const outline = []
  for (let j = 0; j <= 24; j++) outline.push(wall.radii[Math.round((j / 24) * wall.rows)])
  // One description of a rib cane, used everywhere the plan names one.
  const ribCane = (name) => `${name} rib canes, Ø\u00a0${fmt(ribMm)}\u00a0mm: a single ${name} thread cased in clear (vetro a fili)`
  const lengthWhy = `${lengthMm}\u00a0mm is the wall's ${fmt(wall.length, 0)}\u00a0mm scaled back to the first cup, plus a little to work with`
  const lines = [
    `Pull ${perSide} ${ribCane(a)}, and ${perSide} ${ribCane(b)}, each ${lengthMm}\u00a0mm long. ${lengthWhy}.`,
    `Lay the ${a} canes side by side on a kiln shelf, heat them, pick them up and close them into a cylinder, then twist it ${twist} one way as you blow it into a cup. Do the same with the ${b} canes, twisting ${twist} the other way.`,
    `Blow one cup inside the other until they meet, so the threads cross and trap a bubble in each diamond. Then blow out to ${formPhrase(vessel)}: ${fmt(wall.height, 0)} mm tall, Ø ${fmt(wall.rimRadius * 2, 0)} mm at the rim.`,
  ]
  const form = formPhrase(vessel)
  const rib = (id, name) => ({
    key: `rib-${id}`,
    title: `Pull ${perSide} ${name} rib canes, Ø\u00a0${fmt(ribMm)}\u00a0mm, ${lengthMm}\u00a0mm long`,
    detail: `Each a single ${name} thread cased in clear (vetro a fili). At Ø ${fmt(ribMm)} mm, ${perSide} of them lie side by side right round a first cup about Ø ${fmt(cupMm, 0)} mm. ${lengthWhy}.`,
    colorantIds: [id, 'clear'].filter((c, i, all) => findColorant(c) && all.indexOf(c) === i),
    plate: { kind: 'rib', colorantId: id },
  })
  // The finished piece with its threads, drawn as the preview draws them.
  const vesselPlate = {
    kind: 'vessel',
    outline,
    height: wall.height,
    threads: {
      perSide,
      drift: threadDriftTurns(wall),
      threadMm: THREAD_MM,
      colorA: findColorant(vessel.ribA)?.swatch ?? '#f5f5f4',
      colorB: findColorant(vessel.ribB)?.swatch ?? '#1e3a8a',
    },
  }
  const steps = [
    rib(vessel.ribA, a),
    rib(vessel.ribB, b),
    {
      key: 'cup-a',
      title: `Make the ${a} cup, twisting ${twist} one way`,
      detail: `Lay the ${a} canes side by side on a kiln shelf and heat them. Pick them up, close them into a cylinder, and twist it ${twist} one way as you blow it into a cup. That sets the threads leaning about 42°, as the preview shows.`,
      colorantIds: findColorant(vessel.ribA) ? [vessel.ribA] : [],
      plate: { kind: 'rib', colorantId: vessel.ribA },
    },
    {
      key: 'cup-b',
      title: `Make the ${b} cup, twisting ${twist} the other way`,
      detail: `The same with the ${b} canes, ${twist} the opposite way, so the two sets of threads will cross.`,
      colorantIds: findColorant(vessel.ribB) ? [vessel.ribB] : [],
      plate: { kind: 'rib', colorantId: vessel.ribB },
    },
    {
      key: 'nest',
      title: 'Blow one cup inside the other',
      detail: `Inflate the inner cup until the two meet: the threads cross and trap a bubble in each diamond. Then blow out to ${form}: ${fmt(wall.height, 0)} mm tall, Ø ${fmt(wall.rimRadius * 2, 0)} mm at the rim.`,
      colorantIds: [],
      plate: vesselPlate,
    },
  ]
  return {
    perSide,
    ribMm,
    twist,
    names: [a, b],
    // Clear too: every rib is cased in it.
    colorantIds: [...new Set([vessel.ribA, vessel.ribB, 'clear'])].filter((id) => findColorant(id)),
    form,
    wall,
    outline,
    steps,
    step: {
      key: 'reticello',
      after: 'the whole plan, from the Vessel tab',
      title: `Make the reticello: ${perSide} + ${perSide} rib canes`,
      detail: lines.join(' '),
      lines,
      colorantIds: [vessel.ribA, vessel.ribB].filter((id) => findColorant(id)),
      plate: vesselPlate,
    },
  }
}

// The colour a cane shows on the wall: its most-used colour that isn't
// clear, so a zanfirico reads as its threads.
export function caneShowColour(design) {
  const counts = new Map()
  for (const e of design.elements) {
    if (!e.colorantId || e.colorantId === 'clear') continue
    counts.set(e.colorantId, (counts.get(e.colorantId) ?? 0) + 1)
  }
  const [id] = [...counts.entries()].sort((x, y) => y[1] - x[1])[0] ?? []
  return findColorant(id)?.swatch ?? '#f5f5f4'
}

// A cane pick-up: lengths of the pulled cane laid side by side and rolled
// up on the gather, the way filigree (zanfirico) cane is used, rather than
// sliced into murrini. The canes close round the first cup, like reticello
// ribs, so their count comes from the cane's Ø.
export function planCanePickup(vessel, design) {
  if (vessel.pattern !== 'canes' || !design.elements.length) return null
  const wall = measureWall(vesselRadiusFunction(vessel), vessel.params.height)
  const rod = pullRodOf(design)
  const caneMm = pulledDiameterMm(rod)
  const pullLengthMm = pulledLengthMm(rod)
  const count = canesRoundCup(caneMm)
  const lengthMm = firstCupLengthMm(wall)
  // Each length costs a saw cut too, the same allowance as a slice.
  const totals = pickupTotals({ count, thicknessMm: lengthMm, pullLengthMm })
  const form = formPhrase(vessel)
  const twisted = Boolean(design.extrusion?.twistDegrees)
  const lines = [
    `Cut the Ø ${fmt(caneMm)} mm cane into ${count} lengths of ${lengthMm} mm. That's about ${metres(totals.caneMm)} m of cane${
      totals.pulls > 1 ? `, so build and pull this cane ${totals.pulls} times` : ', one pull'
    }. ${lengthMm} mm is the wall's ${fmt(wall.length, 0)} mm scaled back to the first cup, plus a little to work with.`,
    `Lay them side by side on a kiln shelf, touching all the way along, and heat them through. ${count} of them make a patch that closes right round a first cup about Ø ${fmt(firstCupDiameterMm(), 0)} mm.`,
    `Roll the collar across to pick them up, close the seam, then blow out to ${form}: ${fmt(wall.height, 0)} mm tall, Ø ${fmt(wall.rimRadius * 2, 0)} mm at the rim.${
      twisted ? ' Your cane is twisted, so each length shows its spiral up the wall.' : ''
    }`,
  ]
  const outline = []
  for (let j = 0; j <= 24; j++) outline.push(wall.radii[Math.round((j / 24) * wall.rows)])
  return {
    wall,
    count,
    byHand: false,
    canes: true,
    lengthMm,
    map: null,
    sliceDiameterMm: caneMm,
    pullLengthMm,
    totals,
    patch: null,
    step: {
      key: 'pickup',
      after: 'after “Pull”',
      title: `Cut ${count} lengths of ${lengthMm}\u00a0mm and pick them up`,
      detail: lines.join(' '),
      lines,
      colorantIds: [],
      plate: {
        kind: 'vessel',
        outline,
        height: wall.height,
        // Straight canes round the wall, drawn the way the plate draws
        // reticello threads, one set only.
        threads: { perSide: count, drift: 0, threadMm: caneMm * 0.5, colorA: caneShowColour(design), colorB: null },
      },
    },
  }
}
