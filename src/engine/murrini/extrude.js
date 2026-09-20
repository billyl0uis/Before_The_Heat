import * as THREE from 'three'

export const DEFAULT_EXTRUSION = {
  length: 100,
  twistDegrees: 0,
  taper: 0,
  // Some techniques (rolling a flat cane sheet into a coil before pulling,
  // rather than pulling straight through) are easier to reason about with
  // the rod running left-to-right instead of away from the camera — this
  // rotates the whole pulled rod 90° without changing its geometry.
  sideways: false,
}

// Real cane extrusion is a real physical process: a bundle of shapes gets
// pulled into a rod, narrowing (taper) and sometimes twisted along the
// way (the zanfirico technique — see content/murrineTechniques.js). This
// builds that as actual deformed geometry, not a texture wrap: extrude the
// shape straight along Z, then bend every vertex by how far along the rod
// (t, 0 at the near end to 1 at the far end) it sits.
//
// `offset` is the element's placement in the flat pattern (its x/y before
// extrusion). It has to be folded in BEFORE the taper/twist rotation, not
// applied as a rigid translation afterward — a twisted bundle spirals each
// piece around the bundle's shared center axis (like twisting a bundle of
// pencils), not around each piece's own center. Rotating post-offset
// vertices around the shared (0,0) axis is what makes that happen.
export function createExtrudedElementGeometry(shape, extrusion, offset = { x: 0, y: 0 }) {
  const { length, twistDegrees, taper } = extrusion

  // ExtrudeGeometry defaults to steps: 1 — no subdivision along the depth
  // axis at all, just two end caps joined by straight, unsubdivided side
  // walls. That's fine for taper (a straight-edged cone still looks like a
  // cone), but for twist it's wrong: the side walls become a straight-line
  // "shortcut" between two very differently-rotated end caps instead of a
  // helix, which pinches into a bowtie/blade shape once the twist is more
  // than a few degrees. One subdivision per ~8° of total twist keeps each
  // step's rotation small enough to read as a smooth spiral.
  const steps = Math.max(1, Math.min(128, Math.ceil(Math.abs(twistDegrees) / 8)))

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    steps,
    bevelEnabled: false,
    curveSegments: 16,
  })

  const position = geometry.attributes.position
  const maxTwistRad = (twistDegrees * Math.PI) / 180
  const taperFactor = Math.max(0, Math.min(0.9, taper / 100))

  for (let i = 0; i < position.count; i++) {
    const localX = position.getX(i) + offset.x
    const localY = position.getY(i) + offset.y
    const z = position.getZ(i)
    const t = length > 0 ? z / length : 0

    const scale = 1 - taperFactor * t
    const angle = maxTwistRad * t
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const scaledX = localX * scale
    const scaledY = localY * scale

    position.setXYZ(i, scaledX * cos - scaledY * sin, scaledX * sin + scaledY * cos, z)
  }

  position.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}
