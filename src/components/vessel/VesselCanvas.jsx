import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createVesselGeometry } from '../../engine/vessel/profile'

const GLASS_COLOR = '#d97706'

export function VesselCanvas({ params, width = 360, height = 420 }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const meshRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1a1a1a')

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000)
    camera.position.set(0, 150, 320)

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

    const material = new THREE.MeshStandardMaterial({
      color: GLASS_COLOR,
      metalness: 0.05,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    })
    // Placeholder geometry — the params-driven effect below fills in the
    // real shape immediately after mount, so this setup effect never has
    // to depend on params itself (keeps the WebGL context stable while
    // sliders move instead of tearing it down every drag).
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material)
    scene.add(mesh)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.2
    controls.minDistance = 80
    controls.maxDistance = 800

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    meshRef.current = mesh
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
      mesh.geometry.dispose()
      material.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [width, height])

  useEffect(() => {
    const mesh = meshRef.current
    const controls = controlsRef.current
    if (!mesh || !controls) return

    mesh.geometry.dispose()
    mesh.geometry = createVesselGeometry(params)
    controls.target.set(0, params.height / 2, 0)
  }, [params])

  return (
    <div
      ref={mountRef}
      className="overflow-hidden rounded-lg border border-neutral-800"
    />
  )
}
