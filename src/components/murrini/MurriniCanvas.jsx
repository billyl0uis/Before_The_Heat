import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { SHAPE_TYPES } from '../../engine/murrini/shapes'
import { WebGLUnavailable } from '../WebGLUnavailable'

function disposeGroupChildren(group) {
  for (const child of group.children) {
    child.geometry.dispose()
    child.material.dispose()
  }
}

export function MurriniCanvas({ canvas, elements, onPlace, preview }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const groupRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const previewMeshRef = useRef(null)
  const onPlaceRef = useRef(onPlace)
  const [webglFailed, setWebglFailed] = useState(false)

  // onPlace is a new closure every render (it captures the current tool
  // and color). Reading it through a ref lets the click listener below
  // always call the latest version without tearing down the WebGL canvas
  // every time the toolbar state changes.
  useEffect(() => {
    onPlaceRef.current = onPlace
  }, [onPlace])

  useEffect(() => {
    const mount = mountRef.current
    const { width, height, backgroundColor } = canvas

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(backgroundColor)

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
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

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
    scene.add(previewMesh)
    previewMeshRef.current = previewMesh

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    groupRef.current = group

    renderer.render(scene, camera)

    const pointerToWorld = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const x = event.clientX - rect.left - width / 2
      const y = height / 2 - (event.clientY - rect.top)
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
      previewMesh.geometry.dispose()
      previewMesh.material.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [canvas])

  useEffect(() => {
    const group = groupRef.current
    if (!group || webglFailed) return

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

    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }, [elements, webglFailed])

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
    return <WebGLUnavailable width={canvas.width} height={canvas.height} />
  }

  return (
    <div
      ref={mountRef}
      className="h-fit w-fit overflow-hidden rounded-lg border border-neutral-800"
    />
  )
}
