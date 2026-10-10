import { useMemo } from 'react'
import { casingRings } from '../engine/murrini/rod'

// The rod as the canvas draws it: casing rings in world units, the room
// left inside them for canes, and the section's ground colour for the
// mask. Shared by Simple and Advanced so both draw the rod identically.
export function useSliceGeometry(rod, casing) {
  return useMemo(() => {
    const { rings, contentRadius } = casingRings(rod, casing)
    const groundColor =
      getComputedStyle(document.documentElement).getPropertyValue('--ground').trim() || '#150b07'
    return { rings, contentRadius, groundColor }
  }, [rod, casing])
}
