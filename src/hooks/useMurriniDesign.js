import { useCallback, useState } from 'react'
import { DEFAULT_EXTRUSION } from '../engine/murrini/extrude'
import { DEFAULT_PATTERN } from '../engine/murrini/pattern'
import { SHAPE_TYPES } from '../engine/murrini/shapes'

const DEFAULT_CANVAS = { width: 500, height: 500, backgroundColor: '#1a1a1a' }

export function useMurriniDesign(canvas = DEFAULT_CANVAS) {
  const [elements, setElements] = useState([])
  const [pattern, setPattern] = useState(DEFAULT_PATTERN)
  const [extrusion, setExtrusion] = useState(DEFAULT_EXTRUSION)

  const addElement = useCallback((shapeType, x, y, overrides = {}) => {
    const definition = SHAPE_TYPES[shapeType]
    if (!definition) return

    setElements((prev) => [
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
  }, [])

  const removeElement = useCallback((id) => {
    setElements((prev) => prev.filter((element) => element.id !== id))
  }, [])

  const clearElements = useCallback(() => setElements([]), [])

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
  }
}
