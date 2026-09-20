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

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const applyBrush = (worldHit) => {
      const position = mesh.geometry.attributes.position
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
        const len = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1
        const amount = sign * strength * smooth
        position.setXYZ(i, vx + (vx / len) * amount, vy + (vy / len) * amount, vz + (vz / len) * amount)
      }
      position.needsUpdate = true
      mesh.geometry.computeVertexNormals()
      mesh.geometry.computeBoundingSphere()
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
      applyBrush(hitPoint)
    }
    const handlePointerMove = (event) => {
      if (!isSculptingRef.current) return
      const hitPoint = getHitPoint(event)
      if (!hitPoint) return
      applyBrush(hitPoint)
    }
    const endStroke = () => {
      if (!isSculptingRef.current) return
      isSculptingRef.current = false
      controls.enabled = true
      pastRef.current.push(strokeStartRef.current)
      futureRef.current = []
      strokeStartRef.current = null
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
