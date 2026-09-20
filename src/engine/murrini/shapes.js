import * as THREE from 'three'

function regularPolygonShape(radius, sides) {
  const shape = new THREE.Shape()
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

// Exported so presets that place two interleaved spirals (see
// MurriniEditor's jellyroll preset) can offset the second one by exactly
// half a pitch cycle, without duplicating this constant.
export const SPIRAL_PITCH_FACTOR = 1.25

// Traces a coiled ribbon: two Archimedean spirals (inner and outer edge,
// offset by `thickness`) walked outward together and closed into one
// loop. This is the real jellyroll technique — a striped strip of glass
// wound into a coil from the center out, cased, then pulled — not a
// helix along the rod's length (that's twist/zanfirico, a different real
// technique). `radialOffset` shifts where the ribbon starts growing from;
// two spirals with the same turns/thickness but offset by half a turn's
// pitch interleave into alternating color bands, matching how a real
// jellyroll is built from an alternating striped strip.
function spiralRibbonShape(innerRadius, turns, thickness, radialOffset) {
  const totalAngle = turns * Math.PI * 2
  const segments = Math.max(24, Math.round(turns * 28))
  const outerPoints = []
  const innerPoints = []

  // Radial distance gained per full turn (the pitch) has to be strictly
  // more than the band's own thickness — otherwise the outer edge of one
  // wind lands exactly on the inner edge of the next, a zero-gap polygon
  // that earcut's triangulation can't reliably fill (it rendered as
  // nearly nothing). A modest 25% gap keeps the coils visually tight
  // while staying a strictly simple polygon.
  const pitch = thickness * SPIRAL_PITCH_FACTOR

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * totalAngle
    const growth = (pitch * theta) / (Math.PI * 2)
    const rOuter = innerRadius + radialOffset + growth
    const rInner = Math.max(0, rOuter - thickness)
    outerPoints.push([Math.cos(theta) * rOuter, Math.sin(theta) * rOuter])
    innerPoints.push([Math.cos(theta) * rInner, Math.sin(theta) * rInner])
  }

  const shape = new THREE.Shape()
  shape.moveTo(outerPoints[0][0], outerPoints[0][1])
  for (const [x, y] of outerPoints.slice(1)) shape.lineTo(x, y)
  for (const [x, y] of innerPoints.slice().reverse()) shape.lineTo(x, y)
  shape.closePath()
  return shape
}

function starShape(outerRadius, innerRadius, points) {
  const shape = new THREE.Shape()
  const step = Math.PI / points
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius
    const angle = i * step - Math.PI / 2
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

// Each entry is the whole contract a new shape type needs: label for the
// toolbar, default params for a freshly placed instance, the slider
// controls to edit those params, and createShape() to turn params into a
// THREE.Shape the canvas (and later the extrusion/vessel-wrap engines)
// can consume identically regardless of shape type.
export const SHAPE_TYPES = {
  circle: {
    label: 'Circle',
    defaultParams: { radius: 20 },
    controls: [{ key: 'radius', label: 'Radius', min: 4, max: 100, step: 1 }],
    createShape: ({ radius }) => {
      const shape = new THREE.Shape()
      shape.absarc(0, 0, radius, 0, Math.PI * 2, false)
      return shape
    },
  },
  ring: {
    label: 'Ring',
    defaultParams: { radius: 20, innerRadius: 10 },
    controls: [
      { key: 'radius', label: 'Outer radius', min: 4, max: 100, step: 1 },
      { key: 'innerRadius', label: 'Inner radius', min: 1, max: 90, step: 1 },
    ],
    createShape: ({ radius, innerRadius }) => {
      const outer = new THREE.Shape()
      outer.absarc(0, 0, radius, 0, Math.PI * 2, false)
      const hole = new THREE.Path()
      hole.absarc(0, 0, Math.min(innerRadius, radius - 1), 0, Math.PI * 2, true)
      outer.holes.push(hole)
      return outer
    },
  },
  polygon: {
    label: 'Polygon',
    defaultParams: { radius: 20, sides: 5 },
    controls: [
      { key: 'radius', label: 'Radius', min: 4, max: 100, step: 1 },
      { key: 'sides', label: 'Sides', min: 3, max: 12, step: 1 },
    ],
    createShape: ({ radius, sides }) => regularPolygonShape(radius, sides),
  },
  star: {
    label: 'Star',
    defaultParams: { radius: 24, innerRadius: 10, points: 5 },
    controls: [
      { key: 'radius', label: 'Outer radius', min: 6, max: 100, step: 1 },
      { key: 'innerRadius', label: 'Inner radius', min: 2, max: 90, step: 1 },
      { key: 'points', label: 'Points', min: 3, max: 12, step: 1 },
    ],
    createShape: ({ radius, innerRadius, points }) =>
      starShape(radius, innerRadius, points),
  },
  square: {
    label: 'Square',
    defaultParams: { width: 30, height: 30 },
    controls: [
      { key: 'width', label: 'Width', min: 4, max: 100, step: 1 },
      { key: 'height', label: 'Height', min: 4, max: 100, step: 1 },
    ],
    createShape: ({ width, height }) => {
      const shape = new THREE.Shape()
      const halfWidth = width / 2
      const halfHeight = height / 2
      shape.moveTo(-halfWidth, -halfHeight)
      shape.lineTo(halfWidth, -halfHeight)
      shape.lineTo(halfWidth, halfHeight)
      shape.lineTo(-halfWidth, halfHeight)
      shape.closePath()
      return shape
    },
  },
  spiral: {
    label: 'Spiral',
    defaultParams: { innerRadius: 2, turns: 2.5, thickness: 4, radialOffset: 0 },
    controls: [
      { key: 'innerRadius', label: 'Inner radius', min: 0, max: 20, step: 1 },
      { key: 'turns', label: 'Turns', min: 1, max: 6, step: 0.5 },
      { key: 'thickness', label: 'Band thickness', min: 1, max: 12, step: 0.5 },
      { key: 'radialOffset', label: 'Radial offset', min: 0, max: 12, step: 0.5 },
    ],
    createShape: ({ innerRadius, turns, thickness, radialOffset }) =>
      spiralRibbonShape(innerRadius, turns, thickness, radialOffset),
  },
  line: {
    label: 'Line',
    defaultParams: { length: 40, thickness: 4 },
    controls: [
      { key: 'length', label: 'Length', min: 4, max: 120, step: 1 },
      { key: 'thickness', label: 'Thickness', min: 1, max: 20, step: 1 },
    ],
    createShape: ({ length, thickness }) => {
      const shape = new THREE.Shape()
      const halfLength = length / 2
      const halfThickness = thickness / 2
      shape.moveTo(-halfLength, -halfThickness)
      shape.lineTo(halfLength, -halfThickness)
      shape.lineTo(halfLength, halfThickness)
      shape.lineTo(-halfLength, halfThickness)
      shape.closePath()
      return shape
    },
  },
}

export const SHAPE_ORDER = ['circle', 'square', 'ring', 'polygon', 'star', 'spiral', 'line']
