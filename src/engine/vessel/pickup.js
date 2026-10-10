import { findColorant, pulledDiameterMm, pulledLengthMm } from '../murrini/rod'
import { turnsLabel } from '../murrini/shopPlan'
import { VESSEL_FORM_PRESETS, vesselRadiusFunction } from './profile'

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
  if (vessel.pattern !== 'murrini' || !design.elements.length) return null
  const radiusAt = vesselRadiusFunction(vessel)
  const wall = measureWall(radiusAt, vessel.params.height)
  const sliceDiameterMm = pulledDiameterMm(design.rod)
  const pullLengthMm = pulledLengthMm(design.rod)
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
  const lengthMm = Math.round((wall.length + 20) / 10) * 10
  const outline = []
  for (let j = 0; j <= 24; j++) outline.push(wall.radii[Math.round((j / 24) * wall.rows)])
  const lines = [
    `Pull ${perSide} ${a} rib canes and ${perSide} ${b} rib canes, each at least ${lengthMm} mm long: the wall's length, ${fmt(wall.length, 0)} mm, plus a little to work with.`,
    `Lay the ${a} canes side by side on a kiln shelf, heat them, pick them up and close them into a cylinder, then twist it one way as you blow it into a cup. Do the same with the ${b} canes, twisting the other way.`,
    `Blow one cup inside the other until they meet, so the threads cross and trap a bubble in each diamond. Then blow out to ${formPhrase(vessel)}: ${fmt(wall.height, 0)} mm tall, Ø ${fmt(wall.rimRadius * 2, 0)} mm at the rim.`,
  ]
  return {
    step: {
      key: 'reticello',
      after: 'its own step, separate from the cane',
      title: `Make the reticello: ${perSide} + ${perSide} rib canes`,
      detail: lines.join(' '),
      lines,
      colorantIds: [vessel.ribA, vessel.ribB].filter((id) => findColorant(id)),
      plate: { kind: 'vessel', outline, height: wall.height },
    },
  }
}
