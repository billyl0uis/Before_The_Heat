import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { paintBaseSkin, paintMurriniSkin } from '../../engine/vessel/paint'
import { measureWall } from '../../engine/vessel/pickup'
import { createBaseSkin, createVesselBody, createWallSkin, vesselRadiusFunction } from '../../engine/vessel/profile'
import { paintReticelloSkin } from '../../engine/vessel/reticello'
import { createStudioEnvironment } from '../three/studio'
import { WebGLUnavailable } from '../WebGLUnavailable'

const FOV = 30
const SKIN_SIZE = 2048
const BASE_SIZE = 1024
// The pattern sits this far inside the outer surface, under the glass.
const SKIN_INSET_MM = 1
const MORPH_MS = 520

function contactShadow() {
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
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }),
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -0.4
  mesh.renderOrder = -1
  return mesh
}

// Clear glass: see-through face on, denser toward its edges, the way a real
// wall reads (at a glancing angle you look through more glass). Physical
// transmission was tried before and banded on the wall.
function glassMaterial() {
  const material = new THREE.MeshPhysicalMaterial({
    roughness: 0.05,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    transparent: true,
    depthWrite: false,
    envMapIntensity: 1.4,
  })
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
      float facing = abs(dot(normalize(vViewPosition), normal));
      gl_FragColor.a = mix(gl_FragColor.a, 1.0, pow(1.0 - facing, 3.0) * 0.8);`,
    )
  }
  return material
}

function skinTexture(size, renderer, wrap) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  if (wrap) texture.wrapS = THREE.RepeatWrapping
  return { canvas, texture }
}

// The far side of the pattern shows through clear glass, dimmed so the
// near side reads first, as it does when you hold the real piece.
function skinMaterial(map, side, opacity) {
  return new THREE.MeshPhysicalMaterial({
    map,
    side,
    transparent: true,
    opacity,
    alphaTest: 0.05,
    roughness: 0.35,
  })
}

export function VesselCanvas({ vessel, morph, wall, layout, sliceImage, sliceDiameterMm, glass, ribColors, onPlace, label }) {
  const mountRef = useRef(null)
  const rulerRef = useRef(null)
  const sceneRef = useRef(null)
  const shownRef = useRef(null)
  const lastMorph = useRef(morph)
  const onPlaceRef = useRef(onPlace)
  const [webglFailed, setWebglFailed] = useState(false)

  useEffect(() => {
    onPlaceRef.current = onPlace
  }, [onPlace])

  useEffect(() => {
    const mount = mountRef.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
    } catch {
      setWebglFailed(true)
      return undefined
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.domElement.style.display = 'block'
    mount.prepend(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(
      getComputedStyle(document.documentElement).getPropertyValue('--ground').trim() || '#071433',
    )
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = createStudioEnvironment(pmrem)
    scene.environment = environment
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(300, 600, 500)
    scene.add(key, new THREE.AmbientLight(0x8fb3ff, 0.25))
    const shadow = contactShadow()
    scene.add(shadow)

    const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 6000)
    camera.position.set(0, 160, 420)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.maxPolarAngle = Math.PI * 0.64

    const wallSkin = skinTexture(SKIN_SIZE, renderer, true)
    const baseSkin = skinTexture(BASE_SIZE, renderer, false)
    const glassMat = glassMaterial()
    const meshes = {
      skinBack: new THREE.Mesh(new THREE.BufferGeometry(), skinMaterial(wallSkin.texture, THREE.BackSide, 0.5)),
      skinFront: new THREE.Mesh(new THREE.BufferGeometry(), skinMaterial(wallSkin.texture, THREE.FrontSide, 1)),
      base: new THREE.Mesh(new THREE.BufferGeometry(), skinMaterial(baseSkin.texture, THREE.DoubleSide, 1)),
      body: new THREE.Mesh(new THREE.BufferGeometry(), glassMat),
    }
    meshes.skinBack.renderOrder = 1
    meshes.base.renderOrder = 1
    meshes.skinFront.renderOrder = 2
    meshes.body.renderOrder = 3
    scene.add(...Object.values(meshes))

    const state = { meshes, wallSkin, baseSkin, glassMat, tween: null, wall: null }
    sceneRef.current = state

    // Fit the height to the view's height and the width to its width,
    // keeping whatever angle the vessel has been turned to.
    const fit = (fitWall) => {
      const tan = Math.tan((FOV * Math.PI) / 360)
      const distance = Math.max(
        (fitWall.height * (camera.aspect < 1 ? 0.95 : 0.78)) / tan,
        (fitWall.maxRadius * 1.7) / (tan * camera.aspect),
      )
      const direction = camera.position.clone().sub(controls.target)
      if (direction.lengthSq() < 1) direction.set(0, 0.34, 1)
      direction.normalize()
      controls.target.set(0, fitWall.height * 0.5, 0)
      camera.position.copy(controls.target).addScaledVector(direction, distance)
      controls.minDistance = distance * 0.35
      controls.maxDistance = distance * 2.5
    }

    state.build = (shape) => {
      const builtWall = measureWall(shape.radiusAt, shape.height)
      const skin = createWallSkin(builtWall, shape.ribs, SKIN_INSET_MM)
      const next = {
        body: createVesselBody(shape.radiusAt, shape.height, shape.ribs),
        skinFront: skin,
        skinBack: skin,
        base: createBaseSkin(builtWall, shape.ribs, Math.min(1, shape.height * 0.02), SKIN_INSET_MM),
      }
      const previous = new Set(Object.values(meshes).map((mesh) => mesh.geometry))
      for (const [name, mesh] of Object.entries(meshes)) mesh.geometry = next[name]
      for (const geometry of previous) geometry.dispose()
      const footprint = Math.max(builtWall.baseRadius, 20) * 2.6
      shadow.scale.set(footprint, footprint, 1)
      fit(builtWall)
      state.wall = builtWall
    }

    const resize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      if (state.wall) fit(state.wall)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    resize()

    // A tap places a slice; a drag only turns the view.
    let down = null
    const raycaster = new THREE.Raycaster()
    const onDown = (event) => {
      down = [event.clientX, event.clientY]
    }
    const onUp = (event) => {
      if (!down || !onPlaceRef.current) return
      if (Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 5) return
      const rect = renderer.domElement.getBoundingClientRect()
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      )
      const [hit] = raycaster.intersectObjects([meshes.skinFront, meshes.skinBack])
      if (hit?.uv) onPlaceRef.current(hit.uv.x, hit.uv.y)
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)

    // A mm ruler beside the vessel, following the view as it turns.
    const drawRuler = () => {
      const svg = rulerRef.current
      const shownWall = state.wall
      if (!svg || !shownWall) return
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
      const offset = right.multiplyScalar(-(shownWall.maxRadius + 14))
      const toPx = (y) => {
        const p = new THREE.Vector3(0, y, 0).add(offset).project(camera)
        return [(p.x * 0.5 + 0.5) * mount.clientWidth, (-p.y * 0.5 + 0.5) * mount.clientHeight]
      }
      const [x0, y0] = toPx(0)
      const [x1, y1] = toPx(shownWall.height)
      const length = Math.hypot(x1 - x0, y1 - y0)
      if (length < 50) {
        svg.innerHTML = ''
        return
      }
      const nx = -(y1 - y0) / length
      const ny = (x1 - x0) / length
      const step = shownWall.height > 150 ? 20 : 10
      let marks = `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`
      for (let mm = 0; mm <= shownWall.height + 0.01; mm += step) {
        const [x, y] = toPx(mm)
        const tick = mm % (step * 5) === 0 ? 9 : 5
        marks += `<line x1="${x}" y1="${y}" x2="${x + nx * tick}" y2="${y + ny * tick}"/>`
      }
      marks += `<text x="${x1 + nx * 12}" y="${y1 + 4}" text-anchor="end">${Math.round(shownWall.height)} mm</text>`
      svg.innerHTML = marks
    }

    let frame = 0
    const loop = () => {
      const tween = state.tween
      if (tween) {
        const k = Math.min(1, (performance.now() - tween.start) / MORPH_MS)
        const e = 1 - 2 ** (-10 * k)
        state.build({
          radiusAt: (t) => tween.from.radiusAt(t) + (tween.to.radiusAt(t) - tween.from.radiusAt(t)) * e,
          height: tween.from.height + (tween.to.height - tween.from.height) * e,
          ribs: tween.to.ribs,
        })
        if (k >= 1) state.tween = null
      }
      controls.update()
      renderer.render(scene, camera)
      drawRuler()
      frame = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      controls.dispose()
      for (const mesh of Object.values(meshes)) {
        mesh.geometry.dispose()
        mesh.material.dispose()
      }
      wallSkin.texture.dispose()
      baseSkin.texture.dispose()
      shadow.geometry.dispose()
      shadow.material.map.dispose()
      shadow.material.dispose()
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      sceneRef.current = null
    }
  }, [])

  // The form. A named form eases in; sliders and dragging follow directly.
  const { params, freeform, controlRadii } = vessel
  useEffect(() => {
    const state = sceneRef.current
    if (!state) return
    const target = { radiusAt: vesselRadiusFunction({ params, freeform, controlRadii }), height: params.height, ribs: params }
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (morph !== lastMorph.current && shownRef.current && !still) {
      state.tween = { from: shownRef.current, to: target, start: performance.now() }
    } else {
      state.tween = null
      state.build(target)
    }
    lastMorph.current = morph
    shownRef.current = target
  }, [params, freeform, controlRadii, morph])

  useEffect(() => {
    const state = sceneRef.current
    if (!state) return
    state.glassMat.color.set(glass.swatch)
    state.glassMat.opacity = glass.clear ? 0.14 : 0.45
  }, [glass.swatch, glass.clear])

  // What's in the glass, painted at real size onto the target form.
  const { pattern, place, placements, ribsAround } = vessel
  useEffect(() => {
    const state = sceneRef.current
    if (!state) return
    const wallCtx = state.wallSkin.canvas.getContext('2d')
    const baseCtx = state.baseSkin.canvas.getContext('2d')
    if (pattern === 'murrini' && sliceImage) {
      const slices = place === 'hand' ? { wall: placements, base: [] } : layout
      paintMurriniSkin(wallCtx, SKIN_SIZE, wall, slices?.wall ?? [], sliceImage, sliceDiameterMm)
      paintBaseSkin(baseCtx, BASE_SIZE, wall, slices?.base ?? [], sliceImage, sliceDiameterMm)
    } else if (pattern === 'reticello') {
      paintReticelloSkin(wallCtx, SKIN_SIZE, wall, { ribsAround, colorA: ribColors.a, colorB: ribColors.b })
      baseCtx.clearRect(0, 0, BASE_SIZE, BASE_SIZE)
    } else {
      wallCtx.clearRect(0, 0, SKIN_SIZE, SKIN_SIZE)
      baseCtx.clearRect(0, 0, BASE_SIZE, BASE_SIZE)
    }
    state.wallSkin.texture.needsUpdate = true
    state.baseSkin.texture.needsUpdate = true
  }, [wall, layout, sliceImage, sliceDiameterMm, pattern, place, placements, ribsAround, ribColors.a, ribColors.b])

  if (webglFailed) return <WebGLUnavailable width={360} height={420} />

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 touch-none ${onPlace ? '[&_canvas]:cursor-crosshair' : ''}`}
      role="img"
      aria-label={label}
    >
      <svg
        ref={rulerRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible [&_line]:stroke-faint [&_text]:fill-mute [&_text]:font-mono [&_text]:text-[11px]"
      />
    </div>
  )
}
