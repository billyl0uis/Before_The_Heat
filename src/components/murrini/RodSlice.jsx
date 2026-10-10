import { useMemo } from 'react'
import { pulledDiameterMm, ROD_WORLD_RADIUS } from '../../engine/murrini/rod'
import { MurriniCanvas } from './MurriniCanvas'

const fmt = (value, digits = 1) =>
  value.toLocaleString('en', { minimumFractionDigits: digits, maximumFractionDigits: digits })

// One tick per millimetre of the rod's circumference, every fifth one long,
// so the slice carries its own scale: count ticks, read millimetres.
function TickRing({ canvasSize, gatherDiameterMm }) {
  const half = canvasSize / 2
  const ticks = useMemo(() => {
    const count = Math.round(Math.PI * gatherDiameterMm)
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      const long = i % 5 === 0
      const r1 = ROD_WORLD_RADIUS + 3
      const r2 = ROD_WORLD_RADIUS + (long ? 13 : 8)
      return {
        long,
        x1: Math.sin(angle) * r1,
        y1: -Math.cos(angle) * r1,
        x2: Math.sin(angle) * r2,
        y2: -Math.cos(angle) * r2,
      }
    })
  }, [gatherDiameterMm])

  return (
    <svg
      viewBox={`${-half} ${-half} ${canvasSize} ${canvasSize}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {ticks.map(({ long, ...line }, i) => (
        <line
          key={i}
          {...line}
          stroke="var(--mute)"
          strokeWidth={long ? 1.6 : 0.9}
          strokeOpacity={long ? 0.9 : 0.55}
        />
      ))}
    </svg>
  )
}

export function RodSlice({ canvas, elements, slice, rod, onPlace, preview, size }) {
  return (
    <figure className="flex flex-col items-center gap-2 lg:gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <MurriniCanvas
          canvas={canvas}
          elements={elements}
          onPlace={onPlace}
          preview={preview}
          displayWidth={size}
          displayHeight={size}
          slice={slice}
        />
        <TickRing canvasSize={canvas.width} gatherDiameterMm={rod.gatherDiameterMm} />
      </div>
      <figcaption className="flex gap-4 text-center sm:gap-8">
        <Readout value={`${rod.gatherDiameterMm}`} label="gather Ø mm" />
        <Readout value={`${rod.pullRatio}:1`} label="pull ratio" />
        <Readout value={fmt(pulledDiameterMm(rod))} label="pulled Ø mm" emphasis />
      </figcaption>
    </figure>
  )
}

function Readout({ value, label, emphasis = false }) {
  return (
    <div className="sm:min-w-24">
      <p
        className={`font-mono text-[1.6rem] leading-tight font-semibold tracking-tight ${
          emphasis ? 'text-accent' : 'text-ink'
        }`}
      >
        {value}
      </p>
      <p className="text-[0.8rem] tracking-[0.06em] whitespace-nowrap text-mute uppercase">{label}</p>
    </div>
  )
}
