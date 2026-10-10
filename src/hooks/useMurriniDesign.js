import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_EXTRUSION } from '../engine/murrini/extrude'
import { CURRENT_SCHEMA_VERSION, migrateDesign } from '../engine/murrini/migrate'
import { DEFAULT_PATTERN } from '../engine/murrini/pattern'
import { DEFAULT_CASING, DEFAULT_ROD } from '../engine/murrini/rod'
import { SHAPE_TYPES } from '../engine/murrini/shapes'

// Design data, not interface colour: it's saved with every design and is the
// backdrop of saved thumbnails, so changing it would change saved work.
const DEFAULT_CANVAS = { width: 500, height: 500, backgroundColor: '#1a1a1a' }

// The working design is kept in this browser so a refresh, a crash
// recovery reload, or a mobile browser evicting the tab never loses it.
// Every read and write is guarded: private windows and blocked storage
// throw, and the editor must still work without persistence.
const AUTOSAVE_KEY = 'before-the-heat:working-design'

function readAutosave() {
  try {
    const raw = window.localStorage.getItem(AUTOSAVE_KEY)
    return raw ? migrateDesign(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function useMurriniDesign(canvas = DEFAULT_CANVAS) {
  const [initial] = useState(readAutosave)
  const [elements, setElements] = useState(initial?.elements ?? [])
  // Undo/redo only covers `elements` (placing/removing/clearing shapes) —
  // that's the action worth undoing. Pattern/extrusion are settings, not
  // edits, and aren't tracked here.
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const [pattern, setPattern] = useState(initial?.pattern ?? DEFAULT_PATTERN)
  const [extrusion, setExtrusion] = useState(initial?.extrusion ?? DEFAULT_EXTRUSION)
  // The rod you'll actually gather and pull, and the casing layers applied
  // to it inside → out. Settings like pattern/extrusion, not undoable edits.
  const [rod, setRod] = useState(initial?.rod ?? DEFAULT_ROD)
  const [casing, setCasing] = useState(initial?.casing ?? DEFAULT_CASING)
  const [savedLocally, setSavedLocally] = useState(Boolean(initial))

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
          color: overrides.color ?? '#f2762e',
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
            color: spec.color ?? '#f2762e',
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
    const design = migrateDesign(saved)
    elementsRef.current = design.elements
    setElements(design.elements)
    setPattern(design.pattern)
    setExtrusion(design.extrusion)
    setRod(design.rod)
    setCasing(design.casing)
    setPast([])
    setFuture([])
  }, [])

  // Casing edits, inside → out. Index 0 is the first layer applied.
  const addCasingLayer = useCallback((colorantId) => {
    setCasing((prev) => [...prev, { colorantId, thicknessMm: 1 }])
  }, [])
  const removeCasingLayer = useCallback((index) => {
    setCasing((prev) => prev.filter((_, i) => i !== index))
  }, [])
  const moveCasingLayer = useCallback((index, direction) => {
    setCasing((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])
  const updateCasingLayer = useCallback((index, updates) => {
    setCasing((prev) => prev.map((layer, i) => (i === index ? { ...layer, ...updates } : layer)))
  }, [])

  // Debounced so a slider drag writes once when it settles, not 60×/sec.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(
          AUTOSAVE_KEY,
          JSON.stringify({
            schemaVersion: CURRENT_SCHEMA_VERSION,
            canvas,
            elements,
            pattern,
            extrusion,
            rod,
            casing,
          }),
        )
        setSavedLocally(true)
      } catch {
        setSavedLocally(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [canvas, elements, pattern, extrusion, rod, casing])

  return {
    canvas,
    elements,
    pattern,
    setPattern,
    extrusion,
    setExtrusion,
    rod,
    setRod,
    casing,
    addCasingLayer,
    removeCasingLayer,
    moveCasingLayer,
    updateCasingLayer,
    savedLocally,
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
