import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createExtrudedElementGeometry } from '../../engine/murrini/extrude'
import { casingRings, findColorant, ROD_WORLD_RADIUS } from '../../engine/murrini/rod'
import { SHAPE_TYPES } from '../../engine/murrini/shapes'
import { createStudioEnvironment } from '../three/studio'
import { WebGLUnavailable } from '../WebGLUnavailable'

// The visible section of pulled cane, in rod diameters. A real pull is a
// few millimetres across and over a metre long; this shows a short,
// honest-looking stretch so the outside pattern and the cut end read
// together. The caption says the length isn't to scale.
const SECTION_DIAMETERS = 3.2
const FOV = 28

// How see-through each glass reads from the side: clear casing lets the
// pattern inside show through (that's how a zanfirico's threads are seen),
// coloured transparent glass tints it, opaque glass hides it.
function glassOpacity(colorant) {
  if (!colorant || colorant.id === 'clear') return 0.18
  return colorant.family === 'opaque' ? 1 : 0.55
}

function glassMaterial(color, opacity) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
    side: opacity < 1 ? THREE.DoubleSide : THREE.FrontSide,
  })
}

function ringShape(outer, inner) {
  const shape = new THREE.Shape().absarc(0, 0, outer, 0, Math.PI * 2, false)
  if (inner > 0.5) shape.holes.push(new THREE.Path().absarc(0, 0, inner, 0, Math.PI * 2, true))
  return shape
}

function disposeChildren(group) {
  for (const child of group.children) {
    child.geometry.dispose()
    child.material.dispose()
  }
  group.clear()
}

// Builds the cane along +Z: every cane in the cross-section extruded and
// twisted round the shared axis (the real zanfirico mechanism, from the
// engine), a clear core between them, and the casing layers as shells.
function populateCane(group, { elements, rod, casing, twistDegrees }) {
  disposeChildren(group)
  const length = ROD_WORLD_RADIUS * 2 * SECTION_DIAMETERS
  const extrusion = { length, twistDegrees, taper: 0 }
  const { rings, contentRadius } = casingRings(rod, casing)

  for (const element of elements) {
    const definition = SHAPE_TYPES[element.shape]
    if (!definition) continue
    const geometry = createExtrudedElementGeometry(definition.createShape(element.params), extrusion, {
      x: element.x,
      y: element.y,
    })
    // Clear and translucent canes stay see-through, so threads inside or
    // behind them show, exactly the way a zanfirico's core reads.
    const colorant = findColorant(element.colorantId)
    const opacity = Math.min(
      element.opacity ?? 1,
      colorant?.id === 'clear' ? glassOpacity(colorant) : colorant?.family === 'transparent' ? 0.88 : 1,
    )
    const mesh = new THREE.Mesh(geometry, glassMaterial(element.color, opacity))
    if (opacity < 1) mesh.renderOrder = 1
    group.add(mesh)
  }

  // Clear glass filling the space between the canes, then each casing
  // layer from the inside out (drawn in that order so the shells sort).
  const shells = [
    { outer: contentRadius, inner: 0, colorant: findColorant('clear') },
    ...rings.map((ring) => ({ outer: ring.outer, inner: ring.inner, colorant: findColorant(ring.colorantId) })),
  ]
  shells.forEach((shell, index) => {
    const geometry = new THREE.ExtrudeGeometry(ringShape(shell.outer, shell.inner), {
      depth: length,
      bevelEnabled: false,
      curveSegments: 96,
    })
    const mesh = new THREE.Mesh(
      geometry,
      glassMaterial(shell.colorant?.swatch ?? '#cfdcd8', glassOpacity(shell.colorant)),
    )
    mesh.renderOrder = index + 2
    group.add(mesh)
  })

  group.position.z = -length / 2
  return length
}

export function CaneView({ elements, rod, casing, twistDegrees, width, height }) {
  const mountRef = useRef(null)
  const stateRef = useRef(null)
  const [webglFailed, setWebglFailed] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
    } catch {
      setWebglFailed(true)
      return undefined
    }
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(
      getComputedStyle(document.documentElement).getPropertyValue('--ground').trim() || '#150b07',
    )
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = createStudioEnvironment(pmrem)
    scene.environment = environment
    const key = new THREE.DirectionalLight(0xffffff, 1.2)
    key.position.set(600, 900, 1200)
    scene.add(key)

    // Pivot turns the cane to lie left–right; the inner group spins slowly
    // round the cane's own axis so the spiral visibly travels along it.
    const pivot = new THREE.Group()
    pivot.rotation.y = Math.PI / 2
    scene.add(pivot)
    const spinner = new THREE.Group()
    pivot.add(spinner)
    const cane = new THREE.Group()
    spinner.add(cane)

    const camera = new THREE.PerspectiveCamera(FOV, width / height, 10, 20000)
    stateRef.current = { renderer, scene, camera, cane, spinner }

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const loop = () => {
      if (!still) spinner.rotation.z += 0.004
      renderer.render(scene, camera)
      if (!still) frame = requestAnimationFrame(loop)
    }
    stateRef.current.start = () => {
      cancelAnimationFrame(frame)
      loop()
    }

    return () => {
      cancelAnimationFrame(frame)
      disposeChildren(cane)
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      stateRef.current = null
    }
  }, [width, height])

  useEffect(() => {
    const state = stateRef.current
    if (!state || webglFailed) return
    const length = populateCane(state.cane, { elements, rod, casing, twistDegrees })
    // Three-quarter view from the front right: the side pattern and one cut
    // end both in frame, fitted to whichever view angle is narrower.
    // Fit the length to the width and the diameter to the height, rather
    // than a sphere round the whole cane, so a long thin cane fills the frame.
    const vertical = ((FOV / 2) * Math.PI) / 180
    const horizontal = Math.atan(Math.tan(vertical) * state.camera.aspect)
    const distance = Math.max(
      ((length / 2) * 1.3) / Math.tan(horizontal),
      (ROD_WORLD_RADIUS * 1.5) / Math.tan(vertical),
    )
    const direction = new THREE.Vector3(0.42, 0.3, 1).normalize()
    state.camera.position.copy(direction.multiplyScalar(distance))
    state.camera.lookAt(0, 0, 0)
    state.start()
  }, [elements, rod, casing, twistDegrees, webglFailed])

  if (webglFailed) return <WebGLUnavailable width={width} height={height} />
  return <div ref={mountRef} style={{ width, height }} aria-hidden="true" />
}
