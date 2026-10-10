import { useMemo } from 'react'
import { renderCanePlate, renderSlicePlate } from '../../engine/murrini/slicePlate'

// The thumbnail that proves a step: the cane it pulls, or the rod as it is
// once that step is done. Drawn from the real design, never illustrated.
export function StepPlate({ plate, design, size, backdrop = '#3a3d45', className = '' }) {
  const src = useMemo(() => {
    const px = size * 2
    const canvas =
      plate.kind === 'cane'
        ? renderCanePlate({ elements: plate.elements, size: px, backdrop })
        : renderSlicePlate({
            elements: design.repeatedElements,
            rod: design.rod,
            casing: design.casing,
            size: px,
            backdrop,
            casingUpTo: plate.casingUpTo,
          })
    return canvas.toDataURL('image/png')
  }, [plate, design.repeatedElements, design.rod, design.casing, size, backdrop])

  return <img src={src} alt="" width={size} height={size} className={className} />
}
