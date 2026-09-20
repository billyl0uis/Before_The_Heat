import * as THREE from 'three'

export const DEFAULT_VESSEL_PARAMS = {
  height: 200,
  baseRadius: 40,
  topRadius: 60,
  bulge: 20,
  sphereBlend: 0,
  waveAmplitude: 0,
  waveFrequency: 8,
}

const MIN_RADIUS = 2
const PROFILE_SAMPLES = 64

// The vessel wall is one radius-as-a-function-of-height curve, built from
// a few blended mathematical primitives — this is the "morphograph":
//  - taper: a straight line from baseRadius to topRadius (a cone/cylinder)
//  - parabola: sin(pi*t) is zero at both ends and peaks at the middle, so
//    it reads as a smooth belly (bulge > 0) or waist (bulge < 0)
//  - sphereArc: sqrt(1 - (2t-1)^2) traces an actual semicircle, so
//    sphereBlend adds a true round, globe-like silhouette rather than an
//    approximation
//  - ripple: a sine wave along the height, for a ribbed/wavy surface
export function computeProfilePoints(params) {
  const {
    height,
    baseRadius,
    topRadius,
    bulge,
    sphereBlend,
    waveAmplitude,
    waveFrequency,
  } = params

  const points = []
  for (let i = 0; i <= PROFILE_SAMPLES; i++) {
    const t = i / PROFILE_SAMPLES
    const taper = baseRadius + (topRadius - baseRadius) * t
    const parabola = bulge * Math.sin(Math.PI * t)
    const sphereArc =
      sphereBlend *
      Math.max(baseRadius, topRadius) *
      Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2))
    const ripple = waveAmplitude * Math.sin(waveFrequency * t * Math.PI * 2)

    const radius = Math.max(MIN_RADIUS, taper + parabola + sphereArc + ripple)
    points.push(new THREE.Vector2(radius, t * height))
  }
  return points
}

export function createVesselGeometry(params, radialSegments = 48) {
  const profilePoints = computeProfilePoints(params)
  return new THREE.LatheGeometry(profilePoints, radialSegments)
}

// How many draggable control points the free-form profile editor exposes.
// Evenly spaced by height fraction, so Catmull-Rom interpolation between
// them can use plain array-index parameterization instead of needing each
// point's own position solved for.
export const FREEFORM_CONTROL_COUNT = 9

function catmullRomAt(values, u) {
  const n = values.length
  const i = Math.floor(u)
  const t = u - i
  const p0 = values[Math.max(0, i - 1)]
  const p1 = values[Math.min(n - 1, i)]
  const p2 = values[Math.min(n - 1, i + 1)]
  const p3 = values[Math.min(n - 1, i + 2)]
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  )
}

// Radially symmetric free-form silhouette: a smooth curve threaded through
// user-dragged control points (radius at evenly-spaced heights), instead
// of blended formulas. Real blown vessels are always radially symmetric
// (spun on a pipe) — this keeps that constraint while letting the wall
// take any shape along its height, not just the taper/bulge/ripple blend.
export function computeCustomProfilePoints(controlRadii, height) {
  const n = controlRadii.length
  const points = []
  for (let i = 0; i <= PROFILE_SAMPLES; i++) {
    const t = i / PROFILE_SAMPLES
    const u = t * (n - 1)
    const radius = Math.max(MIN_RADIUS, catmullRomAt(controlRadii, u))
    points.push(new THREE.Vector2(radius, t * height))
  }
  return points
}

export function createCustomVesselGeometry(controlRadii, height, radialSegments = 48) {
  const profilePoints = computeCustomProfilePoints(controlRadii, height)
  return new THREE.LatheGeometry(profilePoints, radialSegments)
}

// Snapshots whatever the current formula-based profile looks like into
// FREEFORM_CONTROL_COUNT control radii, so switching into free-form mode
// starts from the visible shape instead of jumping to something else.
export function sampleControlRadii(params) {
  const profile = computeProfilePoints(params)
  const radii = []
  for (let i = 0; i < FREEFORM_CONTROL_COUNT; i++) {
    const t = i / (FREEFORM_CONTROL_COUNT - 1)
    const index = Math.round(t * (profile.length - 1))
    radii.push(profile[index].x)
  }
  return radii
}
