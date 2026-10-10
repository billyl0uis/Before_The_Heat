import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { repaintVesselTexture } from '../../engine/vessel/paint'
import { createCustomVesselGeometry, createVesselGeometry } from '../../engine/vessel/profile'
import { paintReticelloTexture } from '../../engine/vessel/reticello'
import { createStudioEnvironment } from '../three/studio'
import { WebGLUnavailable } from '../WebGLUnavailable'

const GLASS_COLOR = '#d97706'
const TEXTURE_SIZE = 512
const FOV = 40

// A soft round shadow under the base, so the vessel sits on something
// instead of floating. Painted once; scaled to each vessel's footprint.
function createContactShadow() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(0,0,0,0.55)')
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.25)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -0.4
  mesh.renderOrder = -1
  return mesh
}

export function VesselCanvas({
  params,
  freeform,
  controlRadii,
  manualMode,
  placements,
  onPlacePattern,
  reticelloMode,
  reticelloParams,
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
  const shadowRef = useRef(null)
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
    // The section's own ground, so the vessel sits in the page, not a grey box.
    const ground =
      getComputedStyle(document.documentElement).getPropertyValue('--ground').trim() || '#071433'
    scene.background = new THREE.Color(ground)

    const camera = new THREE.PerspectiveCamera(FOV, width / height, 1, 3000)
    camera.position.set(0, 150, 320)

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
    } catch {
      setWebglFailed(true)
      return
    }
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.appendChild(renderer.domElement)

    // Glass reads as glass mostly through what it reflects: a soft studio
    // environment gives the surface highlights and edges something to show.
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = createStudioEnvironment(pmrem)
    scene.environment = environment
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4)
    keyLight.position.set(150, 260, 200)
    scene.add(keyLight)

    // The vessel is a closed solid now, so one-sided rendering is correct
    // and avoids the sorting flicker a transparent double-sided shell had.
    const plainMaterial = new THREE.MeshPhysicalMaterial({
      color: GLASS_COLOR,
      metalness: 0,
      roughness: 0.12,
      // Opaque on purpose: transmission's low-resolution background
      // sampling showed up as blocky bands on the wall.
      ior: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.6,
      side: THREE.FrontSide,
    })

    // Offscreen 2D canvas hand-placed murrini stamps get painted onto, used
    // as a live-updating texture source — never attached to the DOM.
    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = TEXTURE_SIZE
    textureCanvas.height = TEXTURE_SIZE
    const texture = new THREE.CanvasTexture(textureCanvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    const texturedMaterial = new THREE.MeshPhysicalMaterial({
      map: texture,
      color: 0xffffff,
      metalness: 0,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      side: THREE.FrontSide,
    })

    // Placeholder geometry — the params-driven effect below fills in the
    // real shape immediately after mount, so this setup effect never has
    // to depend on params itself (keeps the WebGL context stable while
    // sliders move instead of tearing it down every drag).
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), plainMaterial)
    scene.add(mesh)
    const shadow = createContactShadow()
    scene.add(shadow)
    shadowRef.current = shadow

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
      shadow.geometry.dispose()
      shadow.material.map.dispose()
      shadow.material.dispose()
      environment.dispose()
      pmrem.dispose()
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
      ? createCustomVesselGeometry(controlRadii, params.height, 64, params)
      : createVesselGeometry(params)
    controls.target.set(0, params.height / 2, 0)

    // Shadow sized to the base; camera pulled in or out only when the form
    // would otherwise be cropped or lost, so sliders don't fight the user's
    // own orbit and zoom.
    const box = new THREE.Box3().setFromObject(mesh)
    const footprint = Math.max(box.max.x - box.min.x, box.max.z - box.min.z)
    shadowRef.current?.scale.set(footprint * 1.25, footprint * 1.25, 1)
    const camera = cameraRef.current
    if (camera) {
      const radius = mesh.geometry.boundingSphere.radius
      // Fit to the narrower of the two view angles: the canvas is portrait,
      // so a wide bowl is limited by the horizontal one.
      const vertical = ((FOV / 2) * Math.PI) / 180
      const horizontal = Math.atan(Math.tan(vertical) * camera.aspect)
      const fit = (radius / Math.sin(Math.min(vertical, horizontal))) * 1.08
      const offset = camera.position.clone().sub(controls.target)
      const distance = offset.length()
      if (distance < fit * 0.85 || distance > fit * 2.2) {
        camera.position.copy(controls.target).add(offset.setLength(fit))
      }
    }
  }, [params, freeform, controlRadii, webglFailed])

  useEffect(() => {
    const mesh = meshRef.current
    const canvas = textureCanvasRef.current
    const texture = textureRef.current
    if (!mesh || !canvas || !texture) return

    const ctx = canvas.getContext('2d')

    if (reticelloMode) {
      paintReticelloTexture(ctx, TEXTURE_SIZE, reticelloParams)
      texture.needsUpdate = true

      // The texture's diamond cells are square in canvas-pixel space, but
      // LatheGeometry's default UV maps U (circumference) and V (height)
      // each 0-1 across that same square canvas regardless of the
      // vessel's actual proportions -- on any vessel where circumference
      // != height (almost always), that would stretch the cells (and the
      // "trapped air" dots) into ellipses instead of the circles a real
      // fused bubble actually leaves. Repeating the texture around the
      // circumference by the real aspect ratio keeps cells square in
      // world space instead.
      const avgRadius = freeform
        ? controlRadii.reduce((sum, r) => sum + r, 0) / controlRadii.length
        : (params.baseRadius + params.topRadius) / 2
      const circumference = 2 * Math.PI * avgRadius
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(Math.max(1, circumference / params.height), 1)

      mesh.material = texturedMaterialRef.current
      return
    }

    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.repeat.set(1, 1)

    if (!manualMode) {
      mesh.material = plainMaterialRef.current
      return
    }

    repaintVesselTexture(ctx, TEXTURE_SIZE, GLASS_COLOR, placements)
    texture.needsUpdate = true
    mesh.material = texturedMaterialRef.current
  }, [
    manualMode,
    placements,
    reticelloMode,
    reticelloParams,
    params,
    freeform,
    controlRadii,
    webglFailed,
  ])

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
