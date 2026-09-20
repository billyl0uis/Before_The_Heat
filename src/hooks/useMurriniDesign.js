import { useCallback, useState } from 'react'
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

  // Every undoable change snapshots the current elements onto the undo
  // stack first, then clears the redo stack — a fresh edit invalidates
  // whatever was undone.
  const applyElements = useCallback(
    (next) => {
      setPast((prev) => [...prev, elements])
      setFuture([])
      setElements(next)
    },
    [elements],
  )

  const addElement = useCallback(
    (shapeType, x, y, overrides = {}) => {
      const definition = SHAPE_TYPES[shapeType]
      if (!definition) return

      applyElements([
        ...elements,
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
          layer: elements.length,
          params: { ...definition.defaultParams, ...overrides.params },
        },
      ])
    },
    [elements, applyElements],
  )

  const removeElement = useCallback(
    (id) => applyElements(elements.filter((element) => element.id !== id)),
    [elements, applyElements],
  )

  const clearElements = useCallback(() => {
    if (elements.length > 0) applyElements([])
  }, [elements, applyElements])

  const undo = useCallback(() => {
    if (past.length === 0) return
    const previous = past[past.length - 1]
    setPast(past.slice(0, -1))
    setFuture([elements, ...future])
    setElements(previous)
  }, [past, future, elements])

  const redo = useCallback(() => {
    if (future.length === 0) return
    const [next, ...rest] = future
    setFuture(rest)
    setPast([...past, elements])
    setElements(next)
  }, [past, future, elements])

  // Wholesale-replaces the live design with a saved one (from the Design
  // Vault). Distinct from addElement/setPattern/setExtrusion, which only
  // ever change one piece at a time from user interaction.
  const loadDesign = useCallback((saved) => {
    setElements(saved.elements ?? [])
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
    removeElement,
    clearElements,
    loadDesign,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}
