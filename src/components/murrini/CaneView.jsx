import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createExtrudedElementGeometry } from '../../engine/murrini/extrude'
import { casingRings, findColorant, ROD_WORLD_RADIUS, TWIST_SECTION_DIAMETERS } from '../../engine/murrini/rod'
import { SHAPE_TYPES } from '../../engine/murrini/shapes'
import { createStudioEnvironment } from '../three/studio'
import { WebGLUnavailable } from '../WebGLUnavailable'

// The visible section of pulled cane, in rod diameters. A real pull is a
// few millimetres across and over a metre long; this shows a short stretch
// so the outside pattern and the cut end read together, with the twist at
// the rate the plan gives (see TWIST_SECTION_DIAMETERS).
const SECTION_DIAMETERS = TWIST_SECTION_DIAMETERS
const FOV = 28
// Looking at the cut end from about 40° off the cane's axis: enough of the
// end face to read the murrine itself, enough of the side to see the twist.
const VIEW_DIRECTION = new THREE.Vector3(0.78, 0.34, 1).normalize()

// How much a layer of glass covers what's behind it, seen straight on.
// Clear has no colorant; its value is the faint reflection that shows the
// surface. Transparent colors follow Beer–Lambert from one calibration
// (38% for a 1.5 mm layer), so a thicker layer reads deeper and a thin one
// lighter. Opaque glass covers completely.
const CLEAR_COVER = 0.16
const TRANSPARENT_COVER_AT_1_5_MM = 0.38

function layerCover(colorant, thicknessMm) {
  if (!colorant || colorant.id === 'clear') return CLEAR_COVER
  if (colorant.family === 'opaque') return 1
  return 1 - (1 - TRANSPARENT_COVER_AT_1_5_MM) ** (thicknessMm / 1.5)
}

// Light crossing a thin shell at a glancing angle travels further through
// it, so a cased cane is deeper in color at its edges than across its face.
// The cover is raised to that longer path in the shader (1 / cos θ).
function addPathLength(material) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
      float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
      diffuseColor.a = 1.0 - pow(1.0 - diffuseColor.a, 1.0 / max(facing, 0.2));`,
    )
  }
  return material
}

function glassMaterial(color, cover, side) {
  const see = cover < 1
  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    // Reflections belong to clear glass; on colored glass they wash its
    // color toward white.
    envMapIntensity: cover <= CLEAR_COVER ? 1 : 0.45,
    transparent: see,
    opacity: cover,
    depthWrite: !see,
    side,
  })
  return see ? addPathLength(material) : material
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
// engine), clear glass between them, and the casing layers as shells.
//
// See-through glass is drawn in a fixed order instead of letting three.js
// sort it by distance (every part shares one center, so that sort is a coin
// toss and flickers as the cane turns): the back walls of every shell from
// the outside in, then the canes, then the front walls from the inside out.
// That's the order light meets them on its way to your eye.
function populateCane(group, { elements, rod, casing, twistDegrees }) {
  disposeChildren(group)
  const length = ROD_WORLD_RADIUS * 2 * SECTION_DIAMETERS
  const extrusion = { length, twistDegrees, taper: 0 }
  const { rings, contentRadius } = casingRings(rod, casing)

  const shells = [
    { outer: contentRadius, inner: 0, colorantId: 'clear', thicknessMm: 0 },
    ...rings,
  ].map((shell) => ({ ...shell, colorant: findColorant(shell.colorantId) }))
  const BACK_BASE = 0
  const CANES = shells.length + 1
  const FRONT_BASE = CANES + 1

  shells.forEach((shell, index) => {
    const cover = layerCover(shell.colorant, shell.thicknessMm)
    const color = shell.colorant?.swatch ?? '#cfdcd8'
    const geometry = new THREE.ExtrudeGeometry(ringShape(shell.outer, shell.inner), {
      depth: length,
      bevelEnabled: false,
      curveSegments: 96,
    })
    if (cover >= 1) {
      group.add(new THREE.Mesh(geometry, glassMaterial(color, 1, THREE.FrontSide)))
      return
    }
    const back = new THREE.Mesh(geometry, glassMaterial(color, cover, THREE.BackSide))
    back.renderOrder = BACK_BASE + (shells.length - index) // outermost back wall first
    const front = new THREE.Mesh(geometry.clone(), glassMaterial(color, cover, THREE.FrontSide))
    front.renderOrder = FRONT_BASE + index // innermost front wall first
    group.add(back, front)
  })

  elements.forEach((element, index) => {
    const definition = SHAPE_TYPES[element.shape]
    if (!definition) return
    const geometry = createExtrudedElementGeometry(definition.createShape(element.params), extrusion, {
      x: element.x,
      y: element.y,
    })
    // A cane is solid glass several millimetres through, so even a
    // transparent color reads as its own color from the side; only a clear
    // cane stays see-through.
    const colorant = findColorant(element.colorantId)
    const clear = colorant?.id === 'clear'
    const material = glassMaterial(element.color, clear ? CLEAR_COVER : 1, THREE.FrontSide)
    // Canes stacked in the pattern (a core laid on a larger disc) end in the
    // same plane at the cut; the one placed later sits on top there, the
    // way it was gathered, instead of the two flickering.
    material.polygonOffset = true
    material.polygonOffsetFactor = -1
    material.polygonOffsetUnits = -(index + 1)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.renderOrder = CANES
    group.add(mesh)
  })

  group.position.z = -length / 2
  return length
}

// Backs the camera off along VIEW_DIRECTION until the whole cane, turned to
// any angle round its axis, fits the frame with a margin.
function fitCamera(camera, length) {
  const halfLength = length / 2
  const corners = []
  for (const x of [-halfLength, halfLength])
    for (const y of [-ROD_WORLD_RADIUS, ROD_WORLD_RADIUS])
      for (const z of [-ROD_WORLD_RADIUS, ROD_WORLD_RADIUS]) corners.push(new THREE.Vector3(x, y, z))
  const tanV = Math.tan(((FOV / 2) * Math.PI) / 180) * 0.86
  const tanH = tanV * camera.aspect
  const fits = (distance) => {
    camera.position.copy(VIEW_DIRECTION).multiplyScalar(distance)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    return corners.every((corner) => {
      const p = corner.clone().applyMatrix4(camera.matrixWorldInverse)
      return -p.z > 0 && Math.abs(p.x) / -p.z <= tanH && Math.abs(p.y) / -p.z <= tanV
    })
  }
  let near = ROD_WORLD_RADIUS
  let far = length * 20
  for (let i = 0; i < 24; i++) {
    const mid = (near + far) / 2
    if (fits(mid)) far = mid
    else near = mid
  }
  fits(far)
}

export function CaneView({ elements, rod, casing, twistDegrees, width, height }) {
  const mountRef = useRef(null)
  const stateRef = useRef(null)
  const [webglFailed, setWebglFailed] = useState(false)

  // The scene is made once; size and content changes update it in place,
  // so a resize never leaves an empty view behind.
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

    // Pivot lays the cane left–right; the spinner turns it slowly round its
    // own axis so the spiral visibly travels along it.
    const pivot = new THREE.Group()
    pivot.rotation.y = Math.PI / 2
    scene.add(pivot)
    const spinner = new THREE.Group()
    pivot.add(spinner)
    const cane = new THREE.Group()
    spinner.add(cane)

    const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 40000)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let visible = true
    const draw = () => renderer.render(scene, camera)
    const loop = () => {
      spinner.rotation.z += 0.004
      draw()
      frame = requestAnimationFrame(loop)
    }
    const run = () => {
      cancelAnimationFrame(frame)
      if (still || !visible) draw()
      else loop()
    }
    // No spinning while scrolled out of view or in a background tab.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      run()
    })
    observer.observe(mount)

    stateRef.current = { renderer, camera, cane, run, length: 0 }

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      disposeChildren(cane)
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      stateRef.current = null
    }
  }, [])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    state.length = populateCane(state.cane, { elements, rod, casing, twistDegrees })
    fitCamera(state.camera, state.length)
    state.run()
  }, [elements, rod, casing, twistDegrees])

  useEffect(() => {
    const state = stateRef.current
    if (!state || !width || !height) return
    state.renderer.setSize(width, height)
    state.camera.aspect = width / height
    state.camera.updateProjectionMatrix()
    if (state.length) fitCamera(state.camera, state.length)
    state.run()
  }, [width, height])

  if (webglFailed) return <WebGLUnavailable width={width} height={height} />
  return <div ref={mountRef} style={{ width, height }} aria-hidden="true" />
}
