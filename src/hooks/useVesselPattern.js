import { useCallback, useState } from 'react'

// Mirrors useMurriniDesign's undo/redo shape: each placement is one
// hand-pressed murrini slice (a UV position plus a snapshot canvas of what
// the pattern looked like at that moment), not a live reference back to
// the pattern — editing the Murrini tab later shouldn't retroactively
// change slices already pressed onto the vessel.
export function useVesselPattern() {
  const [placements, setPlacements] = useState([])
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])

  const applyPlacements = useCallback(
    (next) => {
      setPast((prev) => [...prev, placements])
      setFuture([])
      setPlacements(next)
    },
    [placements],
  )

  const addPlacement = useCallback(
    (u, v, stampCanvas, sizeFraction) => {
      applyPlacements([
        ...placements,
        { id: crypto.randomUUID(), u, v, stampCanvas, sizeFraction },
      ])
    },
    [placements, applyPlacements],
  )

  const clearPlacements = useCallback(() => {
    if (placements.length > 0) applyPlacements([])
  }, [placements, applyPlacements])

  const undo = useCallback(() => {
    if (past.length === 0) return
    const previous = past[past.length - 1]
    setPast(past.slice(0, -1))
    setFuture([placements, ...future])
    setPlacements(previous)
  }, [past, future, placements])

  const redo = useCallback(() => {
    if (future.length === 0) return
    const [next, ...rest] = future
    setFuture(rest)
    setPast([...past, placements])
    setPlacements(next)
  }, [past, future, placements])

  return {
    placements,
    addPlacement,
    clearPlacements,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}
