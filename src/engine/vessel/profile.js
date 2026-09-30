import * as THREE from 'three'

export const DEFAULT_VESSEL_PARAMS = {
  height: 200,
  baseRadius: 40,
  topRadius: 60,
  bulge: 20,
  sphereBlend: 0,
  waveAmplitude: 0,
  waveFrequency: 8,
  // Optic ribs: real glass-cane design software (VirtualGlass) gives its
  // blown-piece model ("Piece", piece.h) its own twist_ field, distinct
  // from the Cane class's -- the whole-vessel analog of twisting a rod
  // while pulling it, and the real technique behind spiral/"barley twist"
  // ribbed vessels. ribAmplitude 0 means no ribs (identical to every
  // vessel this app made before this feature existed).
  ribAmplitude: 0,
  ribCount: 8,
  ribTwist: 0,
}

const MIN_RADIUS = 2
const PROFILE_SAMPLES = 64

// The height-only part of the vessel wall -- a few blended mathematical
// primitives, this is the "morphograph":
//  - taper: a straight line from baseRadius to topRadius (a cone/cylinder)
//  - parabola: sin(pi*t) is zero at both ends and peaks at the middle, so
//    it reads as a smooth belly (bulge > 0) or waist (bulge < 0)
//  - sphereArc: sqrt(1 - (2t-1)^2) traces an actual semicircle, so
//    sphereBlend adds a true round, globe-like silhouette rather than an
//    approximation
//  - ripple: a sine wave along the height, for a corrugated/banded
//    profile -- horizontal rings, since a LatheGeometry revolves this
//    curve uniformly around the axis. Genuinely different from the
//    angle-dependent optic ribs below, which a lathe can't produce at
//    all (every point at a given height has the same radius, by
//    definition of a lathe/revolve).
export function computeProfileRadius(params, t) {
  const { baseRadius, topRadius, bulge, sphereBlend, waveAmplitude, waveFrequency } = params
  const taper = baseRadius + (topRadius - baseRadius) * t
  const parabola = bulge * Math.sin(Math.PI * t)
  const sphereArc =
    sphereBlend *
    Math.max(baseRadius, topRadius) *
    Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2))
  const ripple = waveAmplitude * Math.sin(waveFrequency * t * Math.PI * 2)
  return Math.max(MIN_RADIUS, taper + parabola + sphereArc + ripple)
}

export function computeProfilePoints(params) {
  const points = []
  for (let i = 0; i <= PROFILE_SAMPLES; i++) {
    const t = i / PROFILE_SAMPLES
    points.push(new THREE.Vector2(computeProfileRadius(params, t), t * params.height))
  }
  return points
}

// A true optic-rib/twist surface needs radius as a function of BOTH
// height and angle, which LatheGeometry structurally cannot express (it
// revolves one 2D profile identically all the way around) -- so this
// builds the surface directly as a height x angle grid instead of
// revolving a curve. `radiusAtT` is whichever profile is active
// (parametric formula or the free-form spline), kept generic so ribbing
// works identically in both modes. `ribTwist` spirals the rib phase
// progressively with height -- 0 gives straight vertical ribs (a real
// "optic mold" vessel), nonzero gives the classic spiral/twist look.
function createRibbedVesselGeometry(
  radiusAtT,
  height,
  { ribAmplitude, ribCount, ribTwist },
  radialSegments = 48,
  heightSegments = 64,
) {
  const positions = []
  const uvs = []
  const indices = []
  const twistRadPerT = (ribTwist * Math.PI) / 180

  for (let i = 0; i <= heightSegments; i++) {
    const t = i / heightSegments
    const y = t * height
    const twist = twistRadPerT * t
    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2
      const rib = ribAmplitude * Math.cos(ribCount * theta - twist)
      const radius = Math.max(MIN_RADIUS, radiusAtT(t) + rib)
      positions.push(Math.cos(theta) * radius, y, Math.sin(theta) * radius)
      uvs.push(j / radialSegments, t)
    }
  }

  const stride = radialSegments + 1
  for (let i = 0; i < heightSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j
      const b = a + stride
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function createVesselGeometry(params, radialSegments = 48) {
  if (!params.ribAmplitude) {
    const profilePoints = computeProfilePoints(params)
    return new THREE.LatheGeometry(profilePoints, radialSegments)
  }
  return createRibbedVesselGeometry(
    (t) => computeProfileRadius(params, t),
    params.height,
    params,
    radialSegments,
  )
}

// How many draggable control points the free-form profile editor exposes.
// Evenly spaced by height fraction, so the spline below can use plain
// array-index parameterization instead of needing each point's own
// position solved for.
export const FREEFORM_CONTROL_COUNT = 9

// Monotone cubic Hermite interpolation (Fritsch–Carlson): unlike a plain
// Catmull-Rom spline, this never overshoots past either endpoint's value
// within a segment. Catmull-Rom's overshoot is exactly what made dragging
// one point to an extreme next to very different neighbors spike out past
// both of them — a real, visible defect on a shape that's supposed to
// read as a smooth vessel wall, not fixable by tuning tension, only by
// using a spline that's shape-preserving by construction.
function computeMonotonicTangents(values) {
  const n = values.length
  const secants = []
  for (let i = 0; i < n - 1; i++) secants.push(values[i + 1] - values[i])

  const tangents = new Array(n)
  tangents[0] = secants[0] ?? 0
  tangents[n - 1] = secants[n - 2] ?? 0
  for (let i = 1; i < n - 1; i++) {
    const mPrev = secants[i - 1]
    const mNext = secants[i]
    tangents[i] = mPrev === 0 || mNext === 0 || mPrev > 0 !== mNext > 0
      ? 0
      : (mPrev + mNext) / 2
  }

  // Clamp each tangent pair so the curve can't overshoot the interval's
  // own endpoints, per Fritsch–Carlson.
  for (let i = 0; i < n - 1; i++) {
    const m = secants[i]
    if (m === 0) {
      tangents[i] = 0
      tangents[i + 1] = 0
      continue
    }
    const a = tangents[i] / m
    const b = tangents[i + 1] / m
    const s = a * a + b * b
    if (s > 9) {
      const scale = 3 / Math.sqrt(s)
      tangents[i] = scale * a * m
      tangents[i + 1] = scale * b * m
    }
  }
  return tangents
}

function hermiteAt(values, tangents, u) {
  const n = values.length
  const i = Math.min(n - 2, Math.max(0, Math.floor(u)))
  const t = u - i
  const y0 = values[i]
  const y1 = values[i + 1]
  const m0 = tangents[i]
  const m1 = tangents[i + 1]
  const t2 = t * t
  const t3 = t2 * t

  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * m0 +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * m1
  )
}

// Samples a monotone spline through `values` at `sampleCount + 1` evenly
// spaced points — shared by the real 3D profile below and the 2D preview
// curve in ProfileCurveEditor, so the on-screen curve always matches the
// geometry exactly rather than two independent implementations drifting.
export function sampleMonotonicSpline(values, sampleCount) {
  const tangents = computeMonotonicTangents(values)
  const samples = []
  for (let i = 0; i <= sampleCount; i++) {
    const u = (i / sampleCount) * (values.length - 1)
    samples.push(hermiteAt(values, tangents, u))
  }
  return samples
}

// Radially symmetric free-form silhouette: a smooth curve threaded through
// user-dragged control points (radius at evenly-spaced heights), instead
// of blended formulas. Real blown vessels are always radially symmetric
// (spun on a pipe) — this keeps that constraint while letting the wall
// take any shape along its height, not just the taper/bulge/ripple blend.
export function computeCustomProfilePoints(controlRadii, height) {
  const radii = sampleMonotonicSpline(controlRadii, PROFILE_SAMPLES)
  return radii.map(
    (radius, i) => new THREE.Vector2(Math.max(MIN_RADIUS, radius), (i / PROFILE_SAMPLES) * height),
  )
}

export function createCustomVesselGeometry(controlRadii, height, radialSegments = 48, ribParams) {
  if (!ribParams?.ribAmplitude) {
    const profilePoints = computeCustomProfilePoints(controlRadii, height)
    return new THREE.LatheGeometry(profilePoints, radialSegments)
  }
  const tangents = computeMonotonicTangents(controlRadii)
  return createRibbedVesselGeometry(
    (t) => Math.max(MIN_RADIUS, hermiteAt(controlRadii, tangents, t * (controlRadii.length - 1))),
    height,
    ribParams,
    radialSegments,
  )
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
