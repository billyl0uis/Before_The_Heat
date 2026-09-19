import { useCallback, useState } from 'react'
import { DEFAULT_VESSEL_PARAMS } from '../engine/vessel/profile'

export function useVesselShape() {
  const [params, setParams] = useState(DEFAULT_VESSEL_PARAMS)

  const setParam = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setParams(DEFAULT_VESSEL_PARAMS), [])

  return { params, setParam, reset }
}
