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

// Named starting shapes for the sliders above. VirtualGlass's own blown-
// piece model (PieceTemplate::Type, piecetemplate.h) independently
// catalogs these same five named vessel forms -- Tumbler, Bowl, Vase, Pot,
// Plate -- as its standard presets, confirming they're the real, standard
// archetypes worth offering here too. It also stores each one as an exact
// hand-drawn Bezier control curve (piece.cpp), but that curve's coordinate
// system and scale aren't documented anywhere reachable, so rather than
// guess at numbers I can't verify, these presets are built from this app's
// own well-understood sliders instead -- real vessel-form knowledge, not a
// claimed reproduction of VirtualGlass's exact geometry. (VirtualGlass
// also has a sixth template, Fishtrap -- a distinctly unusual form left
// out here rather than guessed at.)
export const VESSEL_FORM_PRESETS = {
  tumbler: {
    label: 'Tumbler',
    params: {
      height: 130,
      baseRadius: 48,
      topRadius: 50,
      bulge: 0,
      sphereBlend: 0,
      waveAmplitude: 0,
      ribAmplitude: 0,
    },
  },
  bowl: {
    label: 'Bowl',
    params: {
      height: 70,
      baseRadius: 14,
      topRadius: 95,
      bulge: -5,
      sphereBlend: 0.4,
      waveAmplitude: 0,
      ribAmplitude: 0,
    },
  },
  vase: {
    label: 'Vase',
    params: {
      height: 220,
      baseRadius: 30,
      topRadius: 35,
      bulge: 40,
      sphereBlend: 0,
      waveAmplitude: 0,
      ribAmplitude: 0,
    },
  },
  pot: {
    label: 'Pot',
    params: {
      height: 150,
      baseRadius: 45,
      topRadius: 28,
      bulge: 35,
      sphereBlend: 0,
      waveAmplitude: 0,
      ribAmplitude: 0,
    },
  },
  plate: {
    label: 'Plate',
    params: {
      // A narrow foot under a wide, shallow body: the vessel is built as a
      // solid with a closed base, so the foot needs no special handling.
      height: 25,
      baseRadius: 4,
      topRadius: 95,
      bulge: 0,
      sphereBlend: 0.1,
      waveAmplitude: 0,
      ribAmplitude: 0,
    },
  },
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

// A blown vessel is a solid: a wall with real thickness, a closed base, a
// rounded lip. Revolving only the outer wall line (what LatheGeometry
// does) leaves an open-bottomed, paper-thin shell with a knife-edge rim.
// Instead this traces the whole cross-section as one closed path -- across
// the base, up the outside, round the lip, down the inside, across the
// inner floor -- and revolves that, so every vessel comes out watertight.
//
// Each path point carries `ribWeight`: optic ribs (radius varying with
// angle, which a plain lathe can't express) are applied to every point
// at its height, outside and inside alike, so a ribbed wall keeps its
// thickness; the weight fades toward the axis so the base stays round.
function wallThickness(maxRadius) {
  return Math.min(5, Math.max(2, maxRadius * 0.045))
}

function arc(cx, cy, radius, fromRad, toRad, steps) {
  const points = []
  for (let i = 1; i <= steps; i++) {
    const a = fromRad + ((toRad - fromRad) * i) / steps
    points.push({ r: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius })
  }
  return points
}

export function computeVesselSection(radiusAtT, height, samples = PROFILE_SAMPLES) {
  const outer = []
  for (let i = 0; i <= samples; i++) outer.push(radiusAtT(i / samples))
  const maxRadius = Math.max(...outer)
  const wall = wallThickness(maxRadius)
  const baseThickness = Math.min(wall * 2, height * 0.25)
  const r0 = outer[0]
  const r1 = outer[samples]
  const foot = Math.min(wall * 1.5, r0 * 0.35, height * 0.1)
  const innerAt = (t) => Math.max(MIN_RADIUS * 0.5, radiusAtT(t) - wall)

  const path = [{ r: 0, y: 0 }, { r: (r0 - foot) * 0.5, y: 0 }, { r: r0 - foot, y: 0 }]
  // Rounded foot: the base turns up into the wall instead of a sharp crease.
  path.push(...arc(r0 - foot, foot, foot, -Math.PI / 2, 0, 5))
  // Outside wall, bottom to top.
  for (let i = 0; i <= samples; i++) {
    const y = (i / samples) * height
    if (y > foot) path.push({ r: outer[i], y })
  }
  // Rounded lip from the outside of the rim to the inside.
  const lipRadius = Math.min(wall / 2, (r1 - MIN_RADIUS * 0.5) / 2)
  path.push(...arc(r1 - lipRadius, height, lipRadius, 0, Math.PI, 8))
  // Inside wall, top down to the floor.
  for (let i = samples; i >= 0; i--) {
    const y = (i / samples) * height
    if (y <= baseThickness + foot) break
    path.push({ r: innerAt(i / samples), y })
  }
  // Inner floor with a small fillet, back to the axis.
  const floorRadius = innerAt(baseThickness / height)
  const fillet = Math.min(foot, floorRadius * 0.4)
  path.push(...arc(floorRadius - fillet, baseThickness + fillet, fillet, 0, -Math.PI / 2, 4))
  path.push({ r: (floorRadius - fillet) * 0.5, y: baseThickness }, { r: 0, y: baseThickness })

  // Joins between pieces (wall to lip, wall to floor) can repeat a point;
  // a repeated point revolves into a zero-height ring of broken faces.
  const unique = path.filter(
    (point, i) => i === 0 || Math.hypot(point.r - path[i - 1].r, point.y - path[i - 1].y) > 1e-6,
  )

  return unique.map((point) => ({
    ...point,
    t: Math.min(1, Math.max(0, point.y / height)),
    ribWeight: Math.min(1, point.r / Math.max(1, r0 * 0.6)),
  }))
}

function revolveSection(section, height, { ribAmplitude = 0, ribCount = 8, ribTwist = 0 } = {}, radialSegments = 64) {
  const positions = []
  const uvs = []
  const indices = []
  const twistRadPerT = (ribTwist * Math.PI) / 180
  const stride = radialSegments + 1

  for (const point of section) {
    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2
      const rib = ribAmplitude * Math.cos(ribCount * theta - twistRadPerT * point.t) * point.ribWeight
      const radius = point.r === 0 ? 0 : Math.max(MIN_RADIUS * 0.5, point.r + rib)
      positions.push(Math.sin(theta) * radius, point.y, Math.cos(theta) * radius)
      // Stamps and textures key off height fraction around the outside.
      uvs.push(j / radialSegments, point.t)
    }
  }
  for (let i = 0; i < section.length - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j
      const b = a + stride
      // Wound so every face points out of the glass: down under the base,
      // outward on the outside wall, into the cavity on the inside wall.
      indices.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  // The first and last column are the same place (the seam where the
  // revolve closes); averaging their normals removes the visible crease.
  const normals = geometry.getAttribute('normal')
  const n = new THREE.Vector3()
  for (let i = 0; i < section.length; i++) {
    const first = i * stride
    const last = first + radialSegments
    n.fromBufferAttribute(normals, first).add(new THREE.Vector3().fromBufferAttribute(normals, last)).normalize()
    normals.setXYZ(first, n.x, n.y, n.z)
    normals.setXYZ(last, n.x, n.y, n.z)
  }
  normals.needsUpdate = true
  geometry.computeBoundingSphere()
  return geometry
}

export function createVesselGeometry(params, radialSegments = 64) {
  const section = computeVesselSection((t) => computeProfileRadius(params, t), params.height)
  return revolveSection(section, params.height, params, radialSegments)
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

export function createCustomVesselGeometry(controlRadii, height, radialSegments = 64, ribParams) {
  const tangents = computeMonotonicTangents(controlRadii)
  const radiusAt = (t) =>
    Math.max(MIN_RADIUS, hermiteAt(controlRadii, tangents, t * (controlRadii.length - 1)))
  return revolveSection(computeVesselSection(radiusAt, height), height, ribParams, radialSegments)
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
