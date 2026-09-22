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

function spiralPathPoints(cx, cy, innerRadius, turns, pitch) {
  const points = []
  const steps = Math.round(turns * 24)
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * turns * Math.PI * 2
    const r = innerRadius + (pitch * theta) / (Math.PI * 2)
    points.push(`${cx + Math.cos(theta) * r},${cy + Math.sin(theta) * r}`)
  }
  return points.join(' ')
}

// One pinwheel blade's outline (leading edge out, trailing edge back) —
// same curved-wedge math as engine/murrini/shapes.js's pinwheelBladeShape,
// just producing an SVG point list instead of a THREE.Shape.
function pinwheelBladePoints(cx, cy, innerRadius, outerRadius, angleWidthDeg, curveDeg, startAngleDeg) {
  const segments = 10
  const half = (angleWidthDeg * Math.PI) / 360
  const curve = (curveDeg * Math.PI) / 180
  const start = (startAngleDeg * Math.PI) / 180
  const leading = []
  const trailing = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const r = innerRadius + (outerRadius - innerRadius) * t
    const sweep = start + curve * t
    leading.push(`${cx + Math.cos(sweep - half) * r},${cy + Math.sin(sweep - half) * r}`)
    trailing.push(`${cx + Math.cos(sweep + half) * r},${cy + Math.sin(sweep + half) * r}`)
  }
  return [...leading, ...trailing.reverse()].join(' ')
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

// Schematic cross-sections of the real technique each entry stands in for.
// Most are static illustrations; marver reflects the live "sides" slider
// since that's literally the shape being pressed by hand.
const DIAGRAMS = {
  circle: () => <circle cx="80" cy="80" r="48" fill={BASE} />,
  ring: () => (
    <>
      <circle cx="80" cy="80" r="50" fill={CASING} />
      <circle cx="80" cy="80" r="30" fill={BASE} />
    </>
  ),
  marver: (params) => (
    <>
      {/* the marver: a flat steel table the gather is pressed against */}
      <rect x="14" y="118" width="132" height="10" rx="2" fill={MOLD} />
      <polygon points={polygonPoints(80, 78, 38, params.sides ?? 4)} fill={BASE} />
    </>
  ),
  opticMold: () => (
    <>
      <polygon
        points={polygonPoints(80, 80, 58, 8)}
        fill="none"
        stroke={MOLD}
        strokeDasharray="4 4"
        strokeWidth="2"
      />
      <polygon points={polygonPoints(80, 80, 44, 8)} fill={BASE} />
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
  // Two interleaved spiral strokes (alternating colors, like the real
  // striped strip) wound into a coil from the center out.
  spiral: () => (
    <>
      <circle cx="80" cy="80" r="56" fill={MOLD} opacity="0.15" />
      <polyline
        points={spiralPathPoints(80, 80, 4, 3.2, 7)}
        fill="none"
        stroke={ACCENT}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <polyline
        points={spiralPathPoints(80, 80, 7.5, 3.2, 7)}
        fill="none"
        stroke={BASE}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </>
  ),
  // A thin accent thread embedded off-center in a base gather — distinct
  // from 'ring' (a full casing dead-center on the core).
  embeddedThread: () => (
    <>
      <circle cx="80" cy="80" r="52" fill={BASE} />
      <circle cx="112" cy="80" r="9" fill={CASING} />
    </>
  ),
  // The jellyroll coil (same two interleaved strokes as 'spiral' above)
  // with the casing layer it's typically pulled under afterward.
  jellyroll: () => (
    <>
      <circle cx="80" cy="80" r="58" fill={CASING} />
      <polyline
        points={spiralPathPoints(80, 80, 4, 3.2, 6)}
        fill="none"
        stroke={ACCENT}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <polyline
        points={spiralPathPoints(80, 80, 7.5, 3.2, 6)}
        fill="none"
        stroke={BASE}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </>
  ),
  // Alternating curved wedges fanning out from center — the swirl a
  // twisted bundle of straight-sided wedge canes develops as it's pulled.
  pinwheel: (params) => {
    const blades = params.blades ?? 6
    const angleWidth = 360 / blades
    const curve = angleWidth * 0.7
    return (
      <>
        {Array.from({ length: blades }, (_, i) => (
          <polygon
            key={i}
            points={pinwheelBladePoints(80, 80, 6, 58, angleWidth, curve, i * angleWidth - 90)}
            fill={i % 2 === 0 ? BASE : CASING}
          />
        ))}
      </>
    )
  },
  // A handful of already-pulled canes packed together before the whole
  // bundle is fused and redrawn as one composite rod.
  bundle: () => (
    <>
      <circle cx="80" cy="80" r="14" fill={MOLD} />
      <circle cx="80" cy="52" r="15" fill={BASE} />
      <circle cx="106" cy="66" r="15" fill={CASING} />
      <circle cx="106" cy="94" r="15" fill={ACCENT} />
      <circle cx="80" cy="108" r="15" fill={BASE} />
      <circle cx="54" cy="94" r="15" fill={CASING} />
      <circle cx="54" cy="66" r="15" fill={ACCENT} />
    </>
  ),
}

export function TechniqueDiagram({ techniqueKey, params = {} }) {
  const renderDiagram = DIAGRAMS[techniqueKey]
  if (!renderDiagram) return null

  return (
    <div className="flex items-center justify-center rounded-md bg-neutral-950 p-2">
      <svg viewBox="0 0 160 160" className="h-32 w-32">
        {renderDiagram(params)}
      </svg>
    </div>
  )
}
