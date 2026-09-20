import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { repaintVesselTexture } from '../../engine/vessel/paint'
import { createCustomVesselGeometry, createVesselGeometry } from '../../engine/vessel/profile'
import { WebGLUnavailable } from '../WebGLUnavailable'

const GLASS_COLOR = '#d97706'
const TEXTURE_SIZE = 512
const STAMP_FRACTION = 0.16

export function VesselCanvas({
  params,
  freeform,
  controlRadii,
  manualMode,
  placements,
  onPlacePattern,
  width = 360,
  height = 420,
}) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const meshRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const plainMaterialRef = useRef(null)
  const texturedMaterialRef = useRef(null)
  const textureRef = useRef(null)
  const textureCanvasRef = useRef(null)
  const manualModeRef = useRef(manualMode)
  const onPlacePatternRef = useRef(onPlacePattern)
  const [webglFailed, setWebglFailed] = useState(false)

  // Read through refs in the click listener (added once, in the setup
  // effect below) so it always sees the latest mode/callback without
  // tearing down and rebuilding the WebGL context on every toggle.
  useEffect(() => {
    manualModeRef.current = manualMode
  }, [manualMode])
  useEffect(() => {
    onPlacePatternRef.current = onPlacePattern
  }, [onPlacePattern])

  useEffect(() => {
    const mount = mountRef.current

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1a1a1a')

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000)
    camera.position.set(0, 150, 320)

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

    const plainMaterial = new THREE.MeshStandardMaterial({
      color: GLASS_COLOR,
      metalness: 0.05,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    })

    // Offscreen 2D canvas hand-placed murrini stamps get painted onto, used
    // as a live-updating texture source — never attached to the DOM.
    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = TEXTURE_SIZE
    textureCanvas.height = TEXTURE_SIZE
    const texture = new THREE.CanvasTexture(textureCanvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    const texturedMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.2,
      side: THREE.DoubleSide,
    })

    // Placeholder geometry — the params-driven effect below fills in the
    // real shape immediately after mount, so this setup effect never has
    // to depend on params itself (keeps the WebGL context stable while
    // sliders move instead of tearing it down every drag).
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), plainMaterial)
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
    plainMaterialRef.current = plainMaterial
    texturedMaterialRef.current = texturedMaterial
    textureRef.current = texture
    textureCanvasRef.current = textureCanvas

    // Click-to-place: only acts in manual mode, and only when the click
    // actually lands on the vessel wall (not a drag-to-orbit release).
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const handleClick = (event) => {
      if (!manualModeRef.current) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const [hit] = raycaster.intersectObject(mesh)
      if (hit?.uv) onPlacePatternRef.current(hit.uv.x, hit.uv.y)
    }
    renderer.domElement.addEventListener('click', handleClick)

    let frameId
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      renderer.domElement.removeEventListener('click', handleClick)
      controls.dispose()
      mesh.geometry.dispose()
      plainMaterial.dispose()
      texturedMaterial.dispose()
      texture.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [width, height])

  useEffect(() => {
    const mesh = meshRef.current
    const controls = controlsRef.current
    if (!mesh || !controls) return

    mesh.geometry.dispose()
    mesh.geometry = freeform
      ? createCustomVesselGeometry(controlRadii, params.height)
      : createVesselGeometry(params)
    controls.target.set(0, params.height / 2, 0)
  }, [params, freeform, controlRadii, webglFailed])

  useEffect(() => {
    const mesh = meshRef.current
    const canvas = textureCanvasRef.current
    const texture = textureRef.current
    if (!mesh || !canvas || !texture) return

    if (!manualMode) {
      mesh.material = plainMaterialRef.current
      return
    }

    const ctx = canvas.getContext('2d')
    repaintVesselTexture(ctx, TEXTURE_SIZE, GLASS_COLOR, placements, STAMP_FRACTION)
    texture.needsUpdate = true
    mesh.material = texturedMaterialRef.current
  }, [manualMode, placements, webglFailed])

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
