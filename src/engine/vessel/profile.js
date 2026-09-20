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

// How many times the murrini pattern tile repeats around and along the
// vessel — scaled to the vessel's actual size instead of a fixed count, so
// a tile stays roughly the same apparent size (like real murrini pieces)
// whether the vessel is small or large, rather than stretching or
// shrinking to fit a fixed repeat count. tileSize is in the same
// arbitrary design units as vessel radius/height; 40 was chosen so the
// default vessel (height 200, radius ~40-60) reproduces the repeat count
// this used to be hardcoded to (8x4), so existing designs don't jump.
export function computeTextureRepeat(params, tileSize = 40) {
  const profilePoints = computeProfilePoints(params)
  const averageRadius =
    profilePoints.reduce((sum, point) => sum + point.x, 0) / profilePoints.length
  const circumference = 2 * Math.PI * averageRadius

  return {
    x: Math.max(1, Math.round(circumference / tileSize)),
    y: Math.max(1, Math.round(params.height / tileSize)),
  }
}
