import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { renderPatternTile } from '../../engine/murrini/rasterize'
import { createVesselGeometry } from '../../engine/vessel/profile'

const GLASS_COLOR = '#d97706'

export function VesselCanvas({
  params,
  patternElements,
  patternCanvas,
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

    const plainMaterial = new THREE.MeshStandardMaterial({
      color: GLASS_COLOR,
      metalness: 0.05,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    })

    // Offscreen 2D canvas the murrini pattern gets rasterized onto, used
    // as a live-updating texture source — never attached to the DOM.
    const textureCanvas = document.createElement('canvas')
    const texture = new THREE.CanvasTexture(textureCanvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    // Fixed for now — tying these to the vessel's actual circumference and
    // height (so tile count reflects real proportions) is follow-up work.
    texture.repeat.set(8, 4)
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
    mesh.geometry = createVesselGeometry(params)
    controls.target.set(0, params.height / 2, 0)
  }, [params])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    if (patternElements && patternElements.length) {
      renderPatternTile(
        patternElements,
        patternCanvas.backgroundColor,
        256,
        textureCanvasRef.current,
      )
      textureRef.current.needsUpdate = true
      mesh.material = texturedMaterialRef.current
    } else {
      mesh.material = plainMaterialRef.current
    }
  }, [patternElements, patternCanvas])

  return (
    <div
      ref={mountRef}
      className="overflow-hidden rounded-lg border border-neutral-800"
    />
  )
}
