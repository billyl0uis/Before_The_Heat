import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { WebGLUnavailable } from '../WebGLUnavailable'

const GLASS_COLOR = '#d97706'
const BASE_RADIUS = 60
const ICOSPHERE_DETAIL = 5

// IcosahedronGeometry (like other Polyhedron-based geometries) builds a
// non-indexed buffer — every triangle owns its own unique corner vertices,
// even where they sit at the same position as a neighboring triangle's
// corner. computeVertexNormals() only averages normals across *shared*
// vertices, so on a non-indexed geometry it has nothing to average and
// every triangle stays flat-shaded regardless of subdivision level —
// that's the faceted/pixelated look. mergeVertices collapses coincident
// corners into shared, indexed vertices first, so normals actually blend
// across triangle seams and the surface reads as smooth.
function createSculptGeometry() {
  const geometry = mergeVertices(new THREE.IcosahedronGeometry(BASE_RADIUS, ICOSPHERE_DETAIL))
  geometry.computeVertexNormals()
  return geometry
}

// A real 3D sculpting tool: push/pull vertices of a subdivided blob along
// their own normals wherever the cursor drags, with smooth falloff. Not
// radially symmetric on purpose — unlike the Vessel Morphograph (which
// stays constrained to what a real spun-on-a-pipe vessel can be), this is
// for shapes that aren't vessels at all, worked freehand like a gather of
// hot glass being tooled by hand.
export const SculptCanvas = forwardRef(function SculptCanvas(
  { brushRadius, brushStrength, brushMode, onHistoryChange, width = 480, height = 480 },
  ref,
) {
  const mountRef = useRef(null)
  const meshRef = useRef(null)
  const isSculptingRef = useRef(false)
  const strokeStartRef = useRef(null)
  const lastStampRef = useRef(null)
  const strokeNormalsRef = useRef(null)
  const pastRef = useRef([])
  const futureRef = useRef([])
  const brushRef = useRef({ radius: brushRadius, strength: brushStrength, mode: brushMode })
  const onHistoryChangeRef = useRef(onHistoryChange)
  const [webglFailed, setWebglFailed] = useState(false)

  useEffect(() => {
    brushRef.current = { radius: brushRadius, strength: brushStrength, mode: brushMode }
  }, [brushRadius, brushStrength, brushMode])

  useEffect(() => {
    onHistoryChangeRef.current = onHistoryChange
  }, [onHistoryChange])

  // Stable identity (empty deps, only touches refs) so it can be safely
  // depended on from the setup effect below without triggering re-runs.
  const reportHistory = useCallback(() => {
    onHistoryChangeRef.current?.({
      canUndo: pastRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
    })
  }, [])

  useImperativeHandle(ref, () => ({
    undo() {
      const mesh = meshRef.current
      if (!mesh || pastRef.current.length === 0) return
      const position = mesh.geometry.attributes.position
      futureRef.current.push(position.array.slice())
      position.array.set(pastRef.current.pop())
      position.needsUpdate = true
      mesh.geometry.computeVertexNormals()
      reportHistory()
    },
    redo() {
      const mesh = meshRef.current
      if (!mesh || futureRef.current.length === 0) return
      const position = mesh.geometry.attributes.position
      pastRef.current.push(position.array.slice())
      position.array.set(futureRef.current.pop())
      position.needsUpdate = true
      mesh.geometry.computeVertexNormals()
      reportHistory()
    },
    reset() {
      const mesh = meshRef.current
      if (!mesh) return
      const position = mesh.geometry.attributes.position
      pastRef.current.push(position.array.slice())
      futureRef.current = []
      const fresh = createSculptGeometry()
      position.array.set(fresh.attributes.position.array)
      position.needsUpdate = true
      mesh.geometry.computeVertexNormals()
      fresh.dispose()
      reportHistory()
    },
  }))

  useEffect(() => {
    const mount = mountRef.current

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1a1a1a')

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000)
    camera.position.set(0, 60, 220)

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
    } catch {
      setWebglFailed(true)
      return
    }
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(150, 200, 200)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
    fillLight.position.set(-150, 50, -100)
    scene.add(fillLight)

    const material = new THREE.MeshStandardMaterial({
      color: GLASS_COLOR,
      metalness: 0.05,
      roughness: 0.15,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    })
    const geometry = createSculptGeometry()
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    meshRef.current = mesh

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.minDistance = 80
    controls.maxDistance = 600
    // Left button is reserved for sculpting, not orbiting — drag with the
    // right button (or scroll to zoom) to move the camera instead, like a
    // dedicated sculpting tool rather than a viewer.
    controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }
    // mouseButtons has no effect on touch input — OrbitControls defaults
    // a one-finger touch drag to ROTATE regardless, which would fight
    // the pointerdown/pointermove brush listeners below over the same
    // gesture on a phone or tablet. Reserve one finger for sculpting
    // (matching the left-button convention above) and two fingers for
    // orbit + pinch-zoom together.
    controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const applyBrush = (worldHit) => {
      const position = mesh.geometry.attributes.position
      // Push direction comes from strokeNormalsRef — a snapshot taken
      // once at the start of this stroke — not the live, continuously
      // recomputed normal attribute. Pushing along the vertex's own
      // surface normal (rather than the vector from the mesh's center)
      // was the right fix for spikes across SEPARATE strokes, but
      // recomputing that normal after every dab WITHIN one continuous
      // stroke backfires: once a bump grows enough that its local normal
      // tilts sideways (toward becoming a ridge wall rather than an
      // outward bulge), later dabs in the same stroke push along that
      // increasingly-tilted direction instead of continuing outward —
      // compounding into a sharp folded crease instead of a smooth ridge.
      // Freezing the direction per stroke means every dab in one drag
      // pushes the same way, so the result stays a smooth bulge.
      const strokeNormals = strokeNormalsRef.current
      const { radius, strength, mode } = brushRef.current
      const sign = mode === 'pull' ? -1 : 1
      const localHit = mesh.worldToLocal(worldHit.clone())

      for (let i = 0; i < position.count; i++) {
        const vx = position.getX(i)
        const vy = position.getY(i)
        const vz = position.getZ(i)
        const dx = vx - localHit.x
        const dy = vy - localHit.y
        const dz = vz - localHit.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist > radius) continue

        const falloff = 1 - dist / radius
        const smooth = falloff * falloff * (3 - 2 * falloff)
        const amount = sign * strength * smooth
        position.setXYZ(
          i,
          vx + strokeNormals[i * 3] * amount,
          vy + strokeNormals[i * 3 + 1] * amount,
          vz + strokeNormals[i * 3 + 2] * amount,
        )
      }
      position.needsUpdate = true
      // Still recomputed every dab so lighting/shading tracks the
      // deforming surface in real time — only the push DIRECTION is
      // frozen, not the shading normals.
      mesh.geometry.computeVertexNormals()
      mesh.geometry.computeBoundingSphere()
    }

    // Browsers fire pointermove far faster than a real hand moves the
    // mouse — a slow drag can deliver a dozen events without the cursor
    // meaningfully moving. Applying a full-strength dab on every one of
    // those stacks displacement on nearly the same spot, which is what
    // was actually making the brush look spiky rather than a smooth bump:
    // not the falloff math, but the same push reapplied many times in a
    // row before the stroke had gone anywhere. Spacing dabs by distance
    // (the same approach every paint/sculpt tool uses) fixes it — a stamp
    // only lands once the cursor has moved a fraction of the brush radius
    // since the last one, regardless of how many events fired in between.
    //
    // That spacing has to stay small, though: too wide a gap between dabs
    // and a genuine drag stops reading as one continuous stroke and
    // instead looks like a row of separate round bumps laid end to end
    // (visibly scalloped in a side-lit profile) — heavily overlapping
    // dabs is what makes a swept stroke look like one smooth ridge
    // instead of a string of beads, the same reason every paint/sculpt
    // tool defaults its brush spacing well under half the brush size.
    const MIN_STAMP_SPACING_FACTOR = 0.1
    const shouldStamp = (worldHit) => {
      const last = lastStampRef.current
      if (!last) return true
      return worldHit.distanceTo(last) >= brushRef.current.radius * MIN_STAMP_SPACING_FACTOR
    }

    const getHitPoint = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const [hit] = raycaster.intersectObject(mesh)
      return hit?.point ?? null
    }

    const handlePointerDown = (event) => {
      if (event.button !== 0) return
      const hitPoint = getHitPoint(event)
      if (!hitPoint) return
      isSculptingRef.current = true
      controls.enabled = false
      strokeStartRef.current = mesh.geometry.attributes.position.array.slice()
      strokeNormalsRef.current = mesh.geometry.attributes.normal.array.slice()
      applyBrush(hitPoint)
      lastStampRef.current = hitPoint.clone()
    }
    const handlePointerMove = (event) => {
      if (!isSculptingRef.current) return
      const hitPoint = getHitPoint(event)
      if (!hitPoint) return
      if (!shouldStamp(hitPoint)) return
      applyBrush(hitPoint)
      lastStampRef.current = hitPoint.clone()
    }
    const endStroke = () => {
      if (!isSculptingRef.current) return
      isSculptingRef.current = false
      controls.enabled = true
      pastRef.current.push(strokeStartRef.current)
      futureRef.current = []
      strokeStartRef.current = null
      lastStampRef.current = null
      strokeNormalsRef.current = null
      reportHistory()
    }

    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    renderer.domElement.addEventListener('pointermove', handlePointerMove)
    renderer.domElement.addEventListener('pointerup', endStroke)
    renderer.domElement.addEventListener('pointerleave', endStroke)

    let frameId
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerup', endStroke)
      renderer.domElement.removeEventListener('pointerleave', endStroke)
      controls.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [width, height, reportHistory])

  if (webglFailed) {
    return <WebGLUnavailable width={width} height={height} />
  }

  return (
    <div
      ref={mountRef}
      className="overflow-hidden rounded-lg border border-neutral-800"
    />
  )
})
