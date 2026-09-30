import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createExtrudedElementGeometry } from '../../engine/murrini/extrude'
import { SHAPE_TYPES } from '../../engine/murrini/shapes'
import { WebGLUnavailable } from '../WebGLUnavailable'

function disposeGroupChildren(group) {
  for (const child of group.children) {
    child.geometry.dispose()
    child.material.dispose()
  }
}

// Shared by both the setup effect and the elements effect below, so a
// freshly (re)created group always gets the current elements extruded into
// it immediately -- not just whenever the `elements`/`extrusion` props
// themselves change. Without this, a resize-triggered scene rebuild (see
// width/height below) recreates an empty group that never gets
// repopulated, since the elements effect's own deps wouldn't consider
// that a reason to re-run -- the rod would render blank until something
// actually changed the pattern or extrusion settings again.
function populateGroup(group, elements, extrusion) {
  disposeGroupChildren(group)
  group.clear()

  for (const element of elements) {
    const definition = SHAPE_TYPES[element.shape]
    if (!definition) continue

    const shape = definition.createShape(element.params)
    const geometry = createExtrudedElementGeometry(shape, extrusion, {
      x: element.x,
      y: element.y,
    })
    const material = new THREE.MeshStandardMaterial({
      color: element.color,
      metalness: 0.05,
      roughness: 0.2,
      transparent: element.opacity < 1,
      opacity: element.opacity,
      side: THREE.DoubleSide,
      // A casing's inner edge (or an embedded thread's edge) often sits at
      // almost exactly the same radius as the shape it's nested against,
      // so their extruded surfaces are coincident or nearly so along the
      // whole twisted length -- the GPU has no stable way to decide which
      // wins the depth test there, which flickers as "meshes fighting."
      // Nudging each element's depth by its placement order (later ==
      // higher layer == physically gathered on top) gives every tie a
      // consistent winner instead, matching real build order.
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: -(element.layer ?? 0),
    })
    const mesh = new THREE.Mesh(geometry, material)
    group.add(mesh)
  }
}

export function RodPreviewCanvas({ elements, extrusion, width = 360, height = 420 }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const groupRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const [webglFailed, setWebglFailed] = useState(false)
  // Read by the setup effect below so it can immediately repopulate a
  // freshly (re)created group with the current pattern, without making
  // elements/extrusion dependencies of that effect (which would tear down
  // and rebuild the whole WebGL context/OrbitControls on every shape
  // placed or slider tick, instead of just on an actual size change).
  const elementsRef = useRef(elements)
  const extrusionRef = useRef(extrusion)

  useEffect(() => {
    elementsRef.current = elements
    extrusionRef.current = extrusion
  }, [elements, extrusion])

  useEffect(() => {
    const mount = mountRef.current

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1a1a1a')

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000)
    camera.position.set(140, 110, 260)

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

    const group = new THREE.Group()
    scene.add(group)
    populateGroup(group, elementsRef.current, extrusionRef.current)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 1
    controls.minDistance = 60
    controls.maxDistance = 800

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    groupRef.current = group
    controlsRef.current = controls

    let frameId
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      controls.dispose()
      disposeGroupChildren(group)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [width, height])

  useEffect(() => {
    const group = groupRef.current
    const controls = controlsRef.current
    if (!group || !controls || webglFailed) return

    populateGroup(group, elements, extrusion)

    // Rotate the whole pulled rod 90° instead of re-deriving its geometry
    // — "sideways" is an orientation flip, not a different pull.
    group.rotation.y = extrusion.sideways ? Math.PI / 2 : 0

    // Center the camera's orbit target on the rod's midpoint so twist and
    // taper both stay in view as the length slider changes.
    const targetZ = extrusion.sideways ? 0 : extrusion.length / 2
    const targetX = extrusion.sideways ? extrusion.length / 2 : 0
    controls.target.set(targetX, 0, targetZ)
  }, [elements, extrusion, webglFailed])

  if (webglFailed) {
    return <WebGLUnavailable width={width} height={height} />
  }

  return (
    <div
      ref={mountRef}
      className="overflow-hidden rounded-lg border border-neutral-800"
    />
  )
}
