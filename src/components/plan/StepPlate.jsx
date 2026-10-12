import { useMemo } from 'react'
import { findColorant } from '../../engine/murrini/rod'
import { renderCanePlate, renderSlicePlate } from '../../engine/murrini/slicePlate'

// Reticello threads seen from the side: each thread winds round the wall,
// so it's drawn where it really is at every height. The back half shows
// faintly through the clear glass, the front half solid, which is what
// makes the crossing diamonds read.
function drawReticelloThreads(ctx, { outline, scale, cx, yAt, threads }) {
  const { perSide, drift, colorA, colorB, threadPx } = threads
  const last = outline.length - 1
  const sets = [
    { sign: 1, color: colorA },
    { sign: -1, color: colorB },
  ].filter((set) => set.color)
  ctx.lineCap = 'round'
  ctx.lineWidth = threadPx
  for (const front of [false, true]) {
    ctx.globalAlpha = front ? 1 : 0.28
    for (const { sign, color } of sets) {
      ctx.strokeStyle = color
      for (let i = 0; i < perSide; i++) {
        ctx.beginPath()
        let drawing = false
        for (let j = 0; j <= last * 4; j++) {
          const t = j / (last * 4)
          const r = outline[Math.min(last, Math.floor(t * last))]
          const phi = 2 * Math.PI * (i / perSide + sign * drift * t)
          if (Math.cos(phi) > 0 === front) {
            const x = cx + Math.sin(phi) * r * scale
            const y = yAt(t * last)
            if (drawing) ctx.lineTo(x, y)
            else ctx.moveTo(x, y)
            drawing = true
          } else {
            drawing = false
          }
        }
        ctx.stroke()
      }
    }
  }
  ctx.globalAlpha = 1
}

// The vessel a pick-up step blows out to: its real outline, as clear glass
// on the same backdrop disc the slices sit on. For reticello, its threads.
function renderVesselPlate({ outline, height, size, backdrop, threads }) {
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
  const tracePath = () => {
    ctx.beginPath()
    outline.forEach((r, j) => ctx.lineTo(size / 2 + r * scale, yAt(j)))
    for (let j = outline.length - 1; j >= 0; j--) ctx.lineTo(size / 2 - outline[j] * scale, yAt(j))
    ctx.closePath()
  }
  tracePath()
  ctx.fillStyle = 'rgb(207 220 216 / 0.35)'
  ctx.fill()
  if (threads) {
    ctx.save()
    ctx.clip()
    drawReticelloThreads(ctx, { outline, scale, cx: size / 2, yAt, threads: { ...threads, threadPx: Math.max(1.5, threads.threadMm * scale) } })
    ctx.restore()
  }
  // Drawn as a vessel seen a little from above: the walls and a curved
  // base, and the rim as an open ellipse, so it reads as a glass rather
  // than a flat outline.
  const last = outline.length - 1
  const cx = size / 2
  const tilt = 0.16
  ctx.strokeStyle = '#eef6ff'
  ctx.lineWidth = Math.max(1.5, size / 60)
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (let j = last; j >= 0; j--) ctx.lineTo(cx - outline[j] * scale, yAt(j))
  ctx.ellipse(cx, yAt(0), outline[0] * scale, outline[0] * scale * tilt, 0, Math.PI, 0, true)
  for (let j = 0; j <= last; j++) ctx.lineTo(cx + outline[j] * scale, yAt(j))
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(cx, yAt(last), outline[last] * scale, outline[last] * scale * tilt, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgb(207 220 216 / 0.18)'
  ctx.fill()
  ctx.stroke()
  return canvas
}

// A reticello rib cane end on: one colored thread cased in clear.
function renderRibPlate({ colorantId, size, backdrop }) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const c = size / 2
  ctx.fillStyle = backdrop
  ctx.beginPath()
  ctx.arc(c, c, c, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgb(207 220 216 / 0.35)'
  ctx.beginPath()
  ctx.arc(c, c, c * 0.62, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = findColorant(colorantId)?.swatch ?? '#f5f5f4'
  ctx.beginPath()
  ctx.arc(c, c, c * 0.24, 0, Math.PI * 2)
  ctx.fill()
  return canvas
}

// The thumbnail that proves a step: the cane it pulls, the rod as it is
// once that step is done, or the vessel it ends in. Drawn from the real
// design, never illustrated.
export function StepPlate({ plate, design, size, backdrop = '#3a3d45', className = '' }) {
  const src = useMemo(() => {
    const px = size * 2
    let canvas
    if (plate.kind === 'rib') {
      canvas = renderRibPlate({ colorantId: plate.colorantId, size: px, backdrop })
    } else if (plate.kind === 'vessel') {
      canvas = renderVesselPlate({ outline: plate.outline, height: plate.height, size: px, backdrop, threads: plate.threads })
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
    plate.kind === 'rib'
      ? 'A rib cane, end on: a colored thread in clear'
      : plate.kind === 'vessel'
      ? plate.threads
        ? plate.threads.colorB
          ? 'The finished vessel, with its reticello threads crossing'
          : 'The finished vessel, with the picked-up canes running up the wall'
        : 'Outline of the finished vessel'
      : plate.kind === 'cane'
        ? 'The cane, end on'
        : plate.casingUpTo === -1
          ? 'The bundle, end on, before casing'
          : 'The rod, end on, at this stage'
  return <img src={src} alt={alt} width={size} height={size} className={className} />
}
