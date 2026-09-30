import { useCallback, useState } from 'react'
import { DEFAULT_VESSEL_PARAMS, sampleControlRadii } from '../engine/vessel/profile'

export function useVesselShape() {
  const [params, setParams] = useState(DEFAULT_VESSEL_PARAMS)
  const [freeform, setFreeform] = useState(false)
  const [controlRadii, setControlRadii] = useState(() =>
    sampleControlRadii(DEFAULT_VESSEL_PARAMS),
  )

  const setParam = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Applies several params at once (a named form preset) as one state
  // update, and drops back to Parametric mode so the new values actually
  // take effect immediately (a preset set while in Free-form would
  // otherwise silently do nothing, since free-form ignores params in
  // favor of controlRadii until you exit it).
  const applyPreset = useCallback((patch) => {
    setParams((prev) => ({ ...prev, ...patch }))
    setFreeform(false)
  }, [])

  const setControlRadius = useCallback((index, value) => {
    setControlRadii((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  // Entering free-form mode snapshots whatever the sliders currently
  // produce into draggable control points, so switching modes doesn't
  // jump the shape — dragging then takes over as the source of truth
  // (the sliders stop applying until you switch back).
  const enterFreeform = useCallback(() => {
    setControlRadii(sampleControlRadii(params))
    setFreeform(true)
  }, [params])

  const exitFreeform = useCallback(() => setFreeform(false), [])

  const reset = useCallback(() => {
    setParams(DEFAULT_VESSEL_PARAMS)
    setControlRadii(sampleControlRadii(DEFAULT_VESSEL_PARAMS))
    setFreeform(false)
  }, [])

  return {
    params,
    setParam,
    applyPreset,
    reset,
    freeform,
    enterFreeform,
    exitFreeform,
    controlRadii,
    setControlRadius,
  }
}
