import { useRef } from 'react'

const SVG_WIDTH = 200
const SVG_HEIGHT = 320
const AXIS_X = 24
const MAX_RADIUS = 160
const MIN_RADIUS = 2
const PREVIEW_SAMPLES = 40

function catmullRomAt(values, u) {
  const n = values.length
  const i = Math.floor(u)
  const t = u - i
  const p0 = values[Math.max(0, i - 1)]
  const p1 = values[Math.min(n - 1, i)]
  const p2 = values[Math.min(n - 1, i + 1)]
  const p3 = values[Math.min(n - 1, i + 2)]
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  )
}

function radiusToX(radius) {
  return AXIS_X + (radius / MAX_RADIUS) * (SVG_WIDTH - AXIS_X - 10)
}

function tToY(t) {
  return SVG_HEIGHT - t * SVG_HEIGHT
}

// Drag any point on the silhouette to reshape the vessel wall at that
// height — stays radially symmetric (only the radius changes, not the
// height of each point) because that's the one constraint a real vessel
// spun on a pipe can't break.
export function ProfileCurveEditor({ controlRadii, onChangeRadius }) {
  const svgRef = useRef(null)

  const curvePoints = []
  for (let i = 0; i <= PREVIEW_SAMPLES; i++) {
    const t = i / PREVIEW_SAMPLES
    const u = t * (controlRadii.length - 1)
    const radius = Math.max(MIN_RADIUS, catmullRomAt(controlRadii, u))
    curvePoints.push(`${radiusToX(radius)},${tToY(t)}`)
  }

  const handlePointerDown = (index) => (event) => {
    event.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    svg.setPointerCapture(event.pointerId)

    const updateFromEvent = (moveEvent) => {
      const rect = svg.getBoundingClientRect()
      const scaleX = SVG_WIDTH / rect.width
      const localX = (moveEvent.clientX - rect.left) * scaleX
      const radius = Math.max(
        MIN_RADIUS,
        Math.min(MAX_RADIUS, ((localX - AXIS_X) / (SVG_WIDTH - AXIS_X - 10)) * MAX_RADIUS),
      )
      onChangeRadius(index, radius)
    }

    updateFromEvent(event)

    const handleMove = (moveEvent) => updateFromEvent(moveEvent)
    const handleUp = () => {
      svg.removeEventListener('pointermove', handleMove)
      svg.removeEventListener('pointerup', handleUp)
    }
    svg.addEventListener('pointermove', handleMove)
    svg.addEventListener('pointerup', handleUp)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="h-[320px] w-[200px] touch-none rounded-lg border border-neutral-800 bg-neutral-950"
    >
      <line
        x1={AXIS_X}
        y1={0}
        x2={AXIS_X}
        y2={SVG_HEIGHT}
        stroke="#404040"
        strokeDasharray="3 3"
      />
      <polyline points={curvePoints.join(' ')} fill="none" stroke="#d97706" strokeWidth="2" />
      {controlRadii.map((radius, index) => {
        const t = index / (controlRadii.length - 1)
        return (
          <circle
            key={index}
            cx={radiusToX(radius)}
            cy={tToY(t)}
            r={7}
            fill="#c084fc"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            className="cursor-ew-resize"
            onPointerDown={handlePointerDown(index)}
          />
        )
      })}
    </svg>
  )
}
