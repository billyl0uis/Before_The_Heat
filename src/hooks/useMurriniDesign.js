import { useCallback, useRef, useState } from 'react'
import { DEFAULT_EXTRUSION } from '../engine/murrini/extrude'
import { DEFAULT_PATTERN } from '../engine/murrini/pattern'
import { SHAPE_TYPES } from '../engine/murrini/shapes'

const DEFAULT_CANVAS = { width: 500, height: 500, backgroundColor: '#1a1a1a' }

export function useMurriniDesign(canvas = DEFAULT_CANVAS) {
  const [elements, setElements] = useState([])
  // Undo/redo only covers `elements` (placing/removing/clearing shapes) —
  // that's the action worth undoing. Pattern/extrusion are settings, not
  // edits, and aren't tracked here.
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const [pattern, setPattern] = useState(DEFAULT_PATTERN)
  const [extrusion, setExtrusion] = useState(DEFAULT_EXTRUSION)

  // Mirrors `elements` synchronously, the instant any function here
  // changes it — not just after the next render. Without this, calling
  // addElement twice in the same handler (a preset that places two shapes
  // at once, say) would have both calls read the same stale pre-handler
  // `elements` from their render closure, and the second call would
  // overwrite the first's result instead of building on it.
  const elementsRef = useRef(elements)

  // Every undoable change snapshots the current elements onto the undo
  // stack first, then clears the redo stack — a fresh edit invalidates
  // whatever was undone.
  const applyElements = useCallback((updater) => {
    const prev = elementsRef.current
    const next = typeof updater === 'function' ? updater(prev) : updater
    elementsRef.current = next
    setPast((p) => [...p, prev])
    setFuture([])
    setElements(next)
  }, [])

  const addElement = useCallback(
    (shapeType, x, y, overrides = {}) => {
      const definition = SHAPE_TYPES[shapeType]
      if (!definition) return

      applyElements((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          shape: shapeType,
          x,
          y,
          rotation: overrides.rotation ?? 0,
          color: overrides.color ?? '#c084fc',
          // Reference back to the real colorant this color came from (see
          // content/glassColorIndex.js) — null for a free custom color that
          // isn't tied to a documented real colorant.
          colorantId: overrides.colorantId ?? null,
          opacity: overrides.opacity ?? 1,
          layer: prev.length,
          params: { ...definition.defaultParams, ...overrides.params },
        },
      ])
    },
    [applyElements],
  )

  // Places several elements as one undoable step — for a compound tool
  // (jellyroll, pinwheel) that places multiple real shapes at once, so
  // undo removes the whole thing in one action instead of one shape at a
  // time.
  const addElements = useCallback(
    (specs) => {
      if (specs.length === 0) return
      applyElements((prev) => {
        const next = [...prev]
        for (const spec of specs) {
          const definition = SHAPE_TYPES[spec.shape]
          if (!definition) continue
          next.push({
            id: crypto.randomUUID(),
            shape: spec.shape,
            x: spec.x,
            y: spec.y,
            rotation: spec.rotation ?? 0,
            color: spec.color ?? '#c084fc',
            colorantId: spec.colorantId ?? null,
            opacity: spec.opacity ?? 1,
            layer: next.length,
            params: { ...definition.defaultParams, ...spec.params },
            compoundId: spec.compoundId,
            compoundType: spec.compoundType,
          })
        }
        return next
      })
    },
    [applyElements],
  )

  const removeElement = useCallback(
    (id) => applyElements((prev) => prev.filter((element) => element.id !== id)),
    [applyElements],
  )

  // Resizing an already-placed shape is a continuous drag (a range
  // input fires onChange on every tick, not just at the end), and
  // pushing every tick through applyElements would both spam the undo
  // stack with dozens of near-identical steps for one drag and force a
  // full re-render/WebGL rebuild each tick. beginElementEdit snapshots
  // the pre-drag state; updateElementLive mutates elements directly
  // (skipping undo bookkeeping) for a responsive live preview while
  // dragging; commitElementEdit folds the whole gesture into one undo
  // step once the drag ends, the same way a single addElement call does.
  const dragSnapshotRef = useRef(null)

  const beginElementEdit = useCallback(() => {
    dragSnapshotRef.current = elementsRef.current
  }, [])

  const updateElementLive = useCallback((id, updates) => {
    const next = elementsRef.current.map((element) =>
      element.id === id
        ? { ...element, ...updates, params: { ...element.params, ...updates.params } }
        : element,
    )
    elementsRef.current = next
    setElements(next)
  }, [])

  const commitElementEdit = useCallback(() => {
    const before = dragSnapshotRef.current
    dragSnapshotRef.current = null
    if (!before || before === elementsRef.current) return
    setPast((p) => [...p, before])
    setFuture([])
  }, [])

  const clearElements = useCallback(() => {
    if (elementsRef.current.length > 0) applyElements([])
  }, [applyElements])

  const undo = useCallback(() => {
    if (past.length === 0) return
    const previous = past[past.length - 1]
    setPast(past.slice(0, -1))
    setFuture([elementsRef.current, ...future])
    elementsRef.current = previous
    setElements(previous)
  }, [past, future])

  const redo = useCallback(() => {
    if (future.length === 0) return
    const [next, ...rest] = future
    setFuture(rest)
    setPast([...past, elementsRef.current])
    elementsRef.current = next
    setElements(next)
  }, [past, future])

  // Wholesale-replaces the live design with a saved one (from the Design
  // Vault). Distinct from addElement/setPattern/setExtrusion, which only
  // ever change one piece at a time from user interaction.
  const loadDesign = useCallback((saved) => {
    const next = saved.elements ?? []
    elementsRef.current = next
    setElements(next)
    setPattern(saved.pattern ?? DEFAULT_PATTERN)
    setExtrusion(saved.extrusion ?? DEFAULT_EXTRUSION)
    setPast([])
    setFuture([])
  }, [])

  return {
    canvas,
    elements,
    pattern,
    setPattern,
    extrusion,
    setExtrusion,
    addElement,
    addElements,
    removeElement,
    beginElementEdit,
    updateElementLive,
    commitElementEdit,
    clearElements,
    loadDesign,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}
