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

export const SHAPE_ORDER = ['circle', 'ring', 'polygon', 'star', 'line']
