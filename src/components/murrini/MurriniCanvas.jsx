import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { findColorant, ROD_WORLD_RADIUS } from '../../engine/murrini/rod'
import { SHAPE_TYPES } from '../../engine/murrini/shapes'
import { WebGLUnavailable } from '../WebGLUnavailable'

function disposeGroupChildren(group) {
  for (const child of group.children) {
    child.geometry.dispose()
    child.material.dispose()
  }
}

// The rod itself: a clear-glass core behind the canes, then the casing
// layers and an outer mask in front of them. Drawing casing over the canes
// is what a real cross-section looks like (a cane can't poke through its
// casing), and the mask trims anything placed past the rod's edge.
function populateRod(behind, front, slice) {
  disposeGroupChildren(behind)
  behind.clear()
  disposeGroupChildren(front)
  front.clear()
  if (!slice) return

  const flat = (geometry, color, opacity = 1) =>
    new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity }),
    )
  const core = flat(new THREE.CircleGeometry(slice.contentRadius, 96), findColorant('clear').swatch, 0.16)
  behind.add(core)

  for (const ring of slice.rings) {
    const colorant = findColorant(ring.colorantId)
    const mesh = flat(
      new THREE.RingGeometry(ring.inner, ring.outer, 128),
      colorant?.swatch ?? '#888888',
      colorant?.family === 'transparent' ? 0.82 : 1,
    )
    front.add(mesh)
  }
  front.add(flat(new THREE.RingGeometry(ROD_WORLD_RADIUS, ROD_WORLD_RADIUS * 2, 128), slice.groundColor))
}

// Shared by both the setup effect and the elements effect below, so a
// freshly (re)created group always gets the current elements drawn into
// it immediately -- not just whenever the `elements` prop itself changes.
// Without this, a resize-triggered scene rebuild (see renderWidth/
// renderHeight below) recreates an empty group that never gets
// repopulated, since the elements effect's own deps wouldn't consider
// that a reason to re-run -- the whole placed pattern would silently
// vanish until something actually changed `elements` again.
function populateGroup(group, elements) {
  disposeGroupChildren(group)
  group.clear()

  for (const element of elements) {
    const definition = SHAPE_TYPES[element.shape]
    if (!definition) continue

    const shape = definition.createShape(element.params)
    const geometry = new THREE.ShapeGeometry(shape)
    const material = new THREE.MeshBasicMaterial({
      color: element.color,
      transparent: element.opacity < 1,
      opacity: element.opacity,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(element.x, element.y, 0)
    mesh.rotation.z = (element.rotation * Math.PI) / 180
    group.add(mesh)
  }
}

export function MurriniCanvas({
  canvas,
  elements,
  onPlace,
  preview,
  displayWidth,
  displayHeight,
  slice = null,
}) {
  // The logical coordinate system (world units used for placement math,
  // pattern repeat, saved designs) is always canvas.width/height — fixed,
  // never changes with screen size. displayWidth/displayHeight is just
  // how many actual CSS pixels that gets rendered into, which can shrink
  // on a narrow phone screen. They're decoupled on purpose: shrinking the
  // display size must never change where a click at a given world
  // position ends up.
  const renderWidth = displayWidth ?? canvas.width
  const renderHeight = displayHeight ?? canvas.height
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const groupRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const previewMeshRef = useRef(null)
  const rodBehindRef = useRef(null)
  const rodFrontRef = useRef(null)
  const sliceRef = useRef(slice)
  const onPlaceRef = useRef(onPlace)
  // Read by the setup effect below so it can immediately repopulate a
  // freshly (re)created group with whatever's currently placed, without
  // making `elements` a dependency of that effect (which would tear down
  // and rebuild the whole WebGL context on every shape placed, instead of
  // just on an actual canvas/size change).
  const elementsRef = useRef(elements)
  // Read by the pointermove handler below, which is set up once (its
  // effect doesn't depend on `preview`) — a compound tool (jellyroll,
  // pinwheel) isn't a single SHAPE_TYPES entry, so there's no one ghost
  // shape to show; keeping this in sync lets pointermove know to keep the
  // preview hidden instead of showing whatever shape was last selected.
  const previewShapeKeyRef = useRef(preview.shape)
  const [webglFailed, setWebglFailed] = useState(false)

  // onPlace is a new closure every render (it captures the current tool
  // and color). Reading it through a ref lets the click listener below
  // always call the latest version without tearing down the WebGL canvas
  // every time the toolbar state changes.
  useEffect(() => {
    onPlaceRef.current = onPlace
  }, [onPlace])

  useEffect(() => {
    elementsRef.current = elements
  }, [elements])

  useEffect(() => {
    previewShapeKeyRef.current = preview.shape
  }, [preview.shape])

  useEffect(() => {
    sliceRef.current = slice
  }, [slice])

  useEffect(() => {
    const mount = mountRef.current
    const { width, height, backgroundColor } = canvas

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(sliceRef.current?.groundColor ?? backgroundColor)

    // Orthographic camera sized to exactly match the canvas in pixels, so
    // world units == pixel offsets from center. That keeps click-to-place
    // math a plain subtraction instead of a raycast.
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      10,
    )
    camera.position.z = 5

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
    } catch {
      setWebglFailed(true)
      return
    }
    renderer.setSize(renderWidth, renderHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)

    const rodBehind = new THREE.Group()
    rodBehind.position.z = -0.05
    scene.add(rodBehind)
    const group = new THREE.Group()
    scene.add(group)
    populateGroup(group, elementsRef.current)
    const rodFront = new THREE.Group()
    rodFront.position.z = 0.05
    scene.add(rodFront)
    populateRod(rodBehind, rodFront, sliceRef.current)
    rodBehindRef.current = rodBehind
    rodFrontRef.current = rodFront

    // Ghost of whatever shape/color is about to be placed, following the
    // cursor so you can see exactly where and what will land before you
    // click — not part of `group`, so it's never touched by the elements
    // effect below.
    const previewMesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.45,
        depthTest: false,
      }),
    )
    previewMesh.visible = false
    previewMesh.position.z = 0.1
    previewMesh.renderOrder = 2
    scene.add(previewMesh)
    previewMeshRef.current = previewMesh

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    groupRef.current = group

    renderer.render(scene, camera)

    const pointerToWorld = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      // rect.width/height is the rendered CSS size, which can be smaller
      // than the logical width/height on a narrow screen — scale into
      // world units so a click always lands where it visually looks like
      // it landed, regardless of display size.
      const scaleX = width / rect.width
      const scaleY = height / rect.height
      const x = (event.clientX - rect.left) * scaleX - width / 2
      const y = height / 2 - (event.clientY - rect.top) * scaleY
      return { x, y }
    }

    const handleClick = (event) => {
      const { x, y } = pointerToWorld(event)
      onPlaceRef.current(x, y)
    }
    const handlePointerMove = (event) => {
      const { x, y } = pointerToWorld(event)
      previewMesh.position.set(x, y, 0.1)
      previewMesh.visible = true
      renderer.render(scene, camera)
    }
    const handlePointerLeave = () => {
      previewMesh.visible = false
      renderer.render(scene, camera)
    }
    renderer.domElement.addEventListener('click', handleClick)
    renderer.domElement.addEventListener('pointermove', handlePointerMove)
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      renderer.domElement.removeEventListener('click', handleClick)
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave)
      disposeGroupChildren(group)
      disposeGroupChildren(rodBehind)
      disposeGroupChildren(rodFront)
      previewMesh.geometry.dispose()
      previewMesh.material.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [canvas, renderWidth, renderHeight])

  useEffect(() => {
    const group = groupRef.current
    if (!group || webglFailed) return

    populateGroup(group, elements)
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }, [elements, webglFailed])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || webglFailed) return
    if (slice) scene.background = new THREE.Color(slice.groundColor)
    populateRod(rodBehindRef.current, rodFrontRef.current, slice)
    rendererRef.current.render(scene, cameraRef.current)
  }, [slice, webglFailed])

  useEffect(() => {
    const mesh = previewMeshRef.current
    if (!mesh || webglFailed) return

    const definition = SHAPE_TYPES[preview.shape]
    if (!definition) return

    mesh.geometry.dispose()
    mesh.geometry = new THREE.ShapeGeometry(definition.createShape(preview.params))
    mesh.material.color.set(preview.color)

    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }, [preview.shape, preview.params, preview.color, webglFailed])

  if (webglFailed) {
    return <WebGLUnavailable width={renderWidth} height={renderHeight} />
  }

  return (
    <div
      ref={mountRef}
      className={slice ? 'h-fit w-fit' : 'h-fit w-fit overflow-hidden rounded-lg border border-neutral-800'}
    />
  )
}
