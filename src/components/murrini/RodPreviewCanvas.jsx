import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createExtrudedElementGeometry } from '../../engine/murrini/extrude'
import { SHAPE_TYPES } from '../../engine/murrini/shapes'

function disposeGroupChildren(group) {
  for (const child of group.children) {
    child.geometry.dispose()
    child.material.dispose()
  }
}

export function RodPreviewCanvas({ elements, extrusion, width = 360, height = 420 }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const groupRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1a1a1a')

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000)
    camera.position.set(140, 110, 260)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
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
    if (!group || !controls) return

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
      })
      const mesh = new THREE.Mesh(geometry, material)
      group.add(mesh)
    }

    // Center the camera's orbit target on the rod's midpoint so twist and
    // taper both stay in view as the length slider changes.
    controls.target.set(0, 0, extrusion.length / 2)
  }, [elements, extrusion])

  return (
    <div
      ref={mountRef}
      className="overflow-hidden rounded-lg border border-neutral-800"
    />
  )
}
