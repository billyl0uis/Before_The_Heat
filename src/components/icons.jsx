import { buildCompoundElements, COMPOUND_SHAPE_TYPES } from '../engine/murrini/compoundShapes'
import { computeShapeReach, SHAPE_TYPES } from '../engine/murrini/shapes'

// Authored UI icons: one 24px grid, 2px round strokes, currentColor.
const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const PATHS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevronUp: <path d="M6 15l6-6 6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  undo: <path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11" />,
  redo: <path d="M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 000 11H13" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  print: <path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
    </>
  ),
  warning: <path d="M12 3l10 18H2zM12 10v5M12 18v.5" />,
  select: <path d="M5 3l14 8-6 2-2 6z" />,
  tools: (
    <>
      <circle cx="8" cy="8" r="4" />
      <circle cx="16" cy="16" r="4" />
    </>
  ),
  colour: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </>
  ),
  casing: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
    </>
  ),
  plan: <path d="M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5" />,
}

export function Icon({ name, size = 20, className, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...STROKE}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  )
}

// The brand mark: a six-petal murrine slice in the section's colours.
export function Mark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="-13 -13 26 26" aria-hidden="true">
      <circle r="12" fill="var(--accent)" />
      <circle r="9.6" fill="var(--ground)" />
      <g fill="var(--accent-2)">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <ellipse key={angle} cy="-5" rx="1.9" ry="3" transform={`rotate(${angle})`} />
        ))}
      </g>
      <circle r="2" fill="var(--accent)" />
    </svg>
  )
}

function polygonPath(points) {
  if (!points.length) return ''
  return `M${points.map((point) => `${point.x.toFixed(2)},${(-point.y).toFixed(2)}`).join('L')}Z`
}

function elementPath(element) {
  const definition = SHAPE_TYPES[element.shape]
  if (!definition) return ''
  const shape = definition.createShape(element.params)
  const { shape: outer, holes } = shape.extractPoints(18)
  const rad = ((element.rotation ?? 0) * Math.PI) / 180
  const place = (point) => ({
    x: element.x + point.x * Math.cos(rad) - point.y * Math.sin(rad),
    y: element.y + point.x * Math.sin(rad) + point.y * Math.cos(rad),
  })
  return [outer, ...holes].map((ring) => polygonPath(ring.map(place))).join('')
}

// Placeholder colours only distinguish layers inside the icon; the icon is
// drawn in currentColor at three strengths, never in real glass colours.
const ICON_TRIO = {
  primary: { swatch: '#000', id: 'a' },
  accent: { swatch: '#111', id: 'b' },
  casing: { swatch: '#222', id: 'c' },
}

// A tool's icon is the cross-section it actually places, traced from the
// same geometry the canvas renders, so the toolbar can never drift from
// what a click produces.
export function ShapeGlyph({ shapeKey, size = 26 }) {
  const compound = COMPOUND_SHAPE_TYPES[shapeKey]
  const elements = compound
    ? buildCompoundElements(shapeKey, 0, 0, compound.defaultParams, ICON_TRIO)
    : [{ shape: shapeKey, x: 0, y: 0, rotation: 0, params: SHAPE_TYPES[shapeKey].defaultParams }]
  const reach =
    Math.max(...elements.map((e) => Math.hypot(e.x, e.y) + computeShapeReach(e.shape, e.params))) ||
    1
  const opacity = { '#000': 0.95, '#111': 0.55, '#222': 0.3 }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-reach} ${-reach} ${reach * 2} ${reach * 2}`}
      aria-hidden="true"
    >
      {elements.map((element, index) => (
        <path
          key={index}
          d={elementPath(element)}
          fill="currentColor"
          fillRule="evenodd"
          opacity={compound ? (opacity[element.color] ?? 0.9) : 0.95}
        />
      ))}
    </svg>
  )
}
