import { useRef } from 'react'
import { sampleMonotonicSpline } from '../../engine/vessel/profile'

const SVG_WIDTH = 150
const SVG_HEIGHT = 200
const AXIS_X = 14
const PAD = 8
const MAX_RADIUS = 160
const MIN_RADIUS = 3
const PREVIEW_SAMPLES = 40

function radiusToX(radius) {
  return AXIS_X + (radius / MAX_RADIUS) * (SVG_WIDTH - AXIS_X - PAD)
}

function tToY(t) {
  return SVG_HEIGHT - PAD - t * (SVG_HEIGHT - PAD * 2)
}

// Drag any point on the silhouette to reshape the vessel wall at that
// height. It stays round (only the radius changes, not the height of each
// point), because that's the one constraint a vessel spun on a pipe can't
// break.
export function ProfileCurveEditor({ controlRadii, onChangeRadius }) {
  const svgRef = useRef(null)

  const sampledRadii = sampleMonotonicSpline(controlRadii, PREVIEW_SAMPLES)
  const curvePoints = sampledRadii.map((radius, i) => `${radiusToX(Math.max(MIN_RADIUS, radius))},${tToY(i / PREVIEW_SAMPLES)}`)

  const handlePointerDown = (index) => (event) => {
    event.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    svg.setPointerCapture(event.pointerId)

    const updateFromEvent = (moveEvent) => {
      const rect = svg.getBoundingClientRect()
      const localX = ((moveEvent.clientX - rect.left) / rect.width) * SVG_WIDTH
      const radius = ((localX - AXIS_X) / (SVG_WIDTH - AXIS_X - PAD)) * MAX_RADIUS
      onChangeRadius(index, Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, radius)))
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
      aria-label="Vessel outline: drag the points"
      className="h-[200px] w-[150px] shrink-0 touch-none rounded-[10px] border border-line bg-ground"
    >
      <line x1={AXIS_X} y1={0} x2={AXIS_X} y2={SVG_HEIGHT} className="stroke-line" strokeDasharray="3 3" />
      <polyline points={curvePoints.join(' ')} fill="none" strokeWidth="2" className="stroke-accent" />
      {controlRadii.map((radius, index) => (
        <circle
          key={index}
          cx={radiusToX(radius)}
          cy={tToY(index / (controlRadii.length - 1))}
          r={7}
          strokeWidth="2"
          className="cursor-ew-resize fill-accent-2 stroke-ground"
          onPointerDown={handlePointerDown(index)}
        />
      ))}
    </svg>
  )
}
