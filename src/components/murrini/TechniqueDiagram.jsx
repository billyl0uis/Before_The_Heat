const BASE = '#d97706'
const CASING = '#38bdf8'
const ACCENT = '#f472b6'
const MOLD = '#71717a'

function polygonPoints(cx, cy, radius, sides, rotationDeg = -90) {
  const points = []
  for (let i = 0; i < sides; i++) {
    const angle = ((rotationDeg + (i * 360) / sides) * Math.PI) / 180
    points.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`)
  }
  return points.join(' ')
}

function starPoints(cx, cy, outerRadius, innerRadius, points) {
  const coords = []
  const step = 180 / points
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius
    const angle = ((i * step - 90) * Math.PI) / 180
    coords.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`)
  }
  return coords.join(' ')
}

// Schematic cross-sections of the real cane each shape stands in for — not
// tied to the live slider values on the toolbar, just illustrative.
const DIAGRAMS = {
  circle: () => <circle cx="80" cy="80" r="48" fill={BASE} />,
  ring: () => (
    <>
      <circle cx="80" cy="80" r="50" fill={CASING} />
      <circle cx="80" cy="80" r="30" fill={BASE} />
    </>
  ),
  polygon: () => (
    <>
      <polygon
        points={polygonPoints(80, 80, 58, 6)}
        fill="none"
        stroke={MOLD}
        strokeDasharray="4 4"
        strokeWidth="2"
      />
      <polygon points={polygonPoints(80, 80, 44, 6)} fill={BASE} />
    </>
  ),
  star: () => (
    <>
      <polygon points={starPoints(80, 80, 55, 26, 5)} fill={BASE} />
      <polygon points={starPoints(80, 80, 38, 18, 5)} fill={CASING} />
      <polygon points={starPoints(80, 80, 22, 10, 5)} fill={ACCENT} />
    </>
  ),
  line: () => <rect x="20" y="72" width="120" height="16" rx="8" fill={BASE} />,
}

export function TechniqueDiagram({ shape }) {
  const Diagram = DIAGRAMS[shape]
  if (!Diagram) return null

  return (
    <div className="flex items-center justify-center rounded-md bg-neutral-950 p-2">
      <svg viewBox="0 0 160 160" className="h-32 w-32">
        <Diagram />
      </svg>
    </div>
  )
}
