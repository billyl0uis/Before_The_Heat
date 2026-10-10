import { useMemo } from 'react'
import { renderCanePlate, renderSlicePlate } from '../../engine/murrini/slicePlate'

// The vessel a pick-up step blows out to: its real outline, as clear glass
// on the same backdrop disc the slices sit on.
function renderVesselPlate({ outline, height, size, backdrop }) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = backdrop
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()
  const maxR = Math.max(...outline, height * 0.5)
  const pad = size * 0.2
  const scale = Math.min((size / 2 - pad) / maxR, (size - pad * 2) / height)
  const yAt = (j) => size / 2 + (height * scale) / 2 - (j / (outline.length - 1)) * height * scale
  ctx.beginPath()
  outline.forEach((r, j) => ctx.lineTo(size / 2 + r * scale, yAt(j)))
  for (let j = outline.length - 1; j >= 0; j--) ctx.lineTo(size / 2 - outline[j] * scale, yAt(j))
  ctx.closePath()
  ctx.fillStyle = 'rgb(207 220 216 / 0.35)'
  ctx.fill()
  ctx.strokeStyle = '#eef6ff'
  ctx.lineWidth = Math.max(1.5, size / 60)
  ctx.stroke()
  return canvas
}

// The thumbnail that proves a step: the cane it pulls, the rod as it is
// once that step is done, or the vessel it ends in. Drawn from the real
// design, never illustrated.
export function StepPlate({ plate, design, size, backdrop = '#3a3d45', className = '' }) {
  const src = useMemo(() => {
    const px = size * 2
    let canvas
    if (plate.kind === 'vessel') {
      canvas = renderVesselPlate({ outline: plate.outline, height: plate.height, size: px, backdrop })
    } else if (plate.kind === 'cane') {
      canvas = renderCanePlate({ elements: plate.elements, size: px, backdrop })
    } else {
      canvas = renderSlicePlate({
        elements: design.repeatedElements,
        rod: design.rod,
        casing: design.casing,
        size: px,
        backdrop,
        casingUpTo: plate.casingUpTo,
      })
    }
    return canvas.toDataURL('image/png')
  }, [plate, design.repeatedElements, design.rod, design.casing, size, backdrop])

  // The step's own title already says what this shows; the alt names
  // the kind of picture so it isn't skipped as decoration.
  const alt =
    plate.kind === 'vessel'
      ? 'Outline of the finished vessel'
      : plate.kind === 'cane'
        ? 'The cane, end on'
        : plate.casingUpTo === -1
          ? 'The bundle, end on, before casing'
          : 'The rod, end on, at this stage'
  return <img src={src} alt={alt} width={size} height={size} className={className} />
}
