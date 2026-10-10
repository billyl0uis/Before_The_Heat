import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_VESSEL_PARAMS, sampleControlRadii, VESSEL_FORM_PRESETS } from '../engine/vessel/profile'

const STORAGE_KEY = 'before-the-heat:vessel'

const START_PARAMS = { ...DEFAULT_VESSEL_PARAMS, ...VESSEL_FORM_PRESETS.tumbler.params }

// Everything about the vessel in one saved object: its form, its glass,
// and what's on its surface. The plan reads the same object to add the
// pick-up step, so it's kept in this browser like the design is.
export const DEFAULT_VESSEL = {
  params: START_PARAMS,
  presetKey: 'tumbler',
  edited: false,
  freeform: false,
  controlRadii: sampleControlRadii(START_PARAMS),
  glassId: 'clear',
  // Plain glass until someone chooses a pattern: choosing Murrini is
  // what adds the pick-up to the plan.
  pattern: 'none',
  place: 'fill',
  thicknessMm: 5,
  placements: [],
  ribsAround: 40,
  ribA: 'opal-white',
  ribB: 'cobalt-blue',
}

export function readVessel() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    if (!saved || typeof saved !== 'object' || typeof saved.params !== 'object') return DEFAULT_VESSEL
    return {
      ...DEFAULT_VESSEL,
      ...saved,
      params: { ...DEFAULT_VESSEL.params, ...saved.params },
      placements: Array.isArray(saved.placements) ? saved.placements : [],
      controlRadii: Array.isArray(saved.controlRadii) ? saved.controlRadii : DEFAULT_VESSEL.controlRadii,
    }
  } catch {
    return DEFAULT_VESSEL
  }
}

export function useVessel() {
  const [vessel, setVessel] = useState(readVessel)
  // Bumped only by a named form, so the canvas eases into it; slider moves
  // follow the hand directly.
  const [morph, setMorph] = useState(0)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vessel))
    } catch {
      // Private mode or full storage: the vessel just won't survive a reload.
    }
  }, [vessel])

  const update = useCallback((patch) => setVessel((prev) => ({ ...prev, ...patch })), [])

  const setParam = useCallback((key, value) => {
    setVessel((prev) => ({ ...prev, edited: true, params: { ...prev.params, [key]: value } }))
  }, [])

  const applyPreset = useCallback((presetKey) => {
    setVessel((prev) => ({
      ...prev,
      presetKey,
      edited: false,
      freeform: false,
      params: { ...prev.params, ...VESSEL_FORM_PRESETS[presetKey].params },
    }))
    setMorph((n) => n + 1)
  }, [])

  // Drawing starts from whatever the sliders show, so switching doesn't
  // make the form jump.
  const enterFreeform = useCallback(() => {
    setVessel((prev) =>
      prev.freeform ? prev : { ...prev, freeform: true, controlRadii: sampleControlRadii(prev.params) },
    )
  }, [])

  const setControlRadius = useCallback((index, radius) => {
    setVessel((prev) => {
      const controlRadii = [...prev.controlRadii]
      controlRadii[index] = radius
      return { ...prev, controlRadii }
    })
  }, [])

  const addPlacement = useCallback((u, v) => {
    setVessel((prev) => ({ ...prev, placements: [...prev.placements, { u, v }] }))
  }, [])

  return {
    vessel,
    morph,
    update,
    setParam,
    applyPreset,
    enterFreeform,
    exitFreeform: useCallback(() => update({ freeform: false }), [update]),
    setControlRadius,
    addPlacement,
    undoPlacement: useCallback(() => setVessel((prev) => ({ ...prev, placements: prev.placements.slice(0, -1) })), []),
    clearPlacements: useCallback(() => update({ placements: [] }), [update]),
  }
}
