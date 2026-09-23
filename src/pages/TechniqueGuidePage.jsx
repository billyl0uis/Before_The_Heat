import { TechniqueDiagram } from '../components/murrini/TechniqueDiagram'
import { MURRINI_TECHNIQUES } from '../content/murrineTechniques'

// One entry per technique this app actually simulates, in a deliberate
// reading order (simple cane through to the most composite techniques)
// rather than object insertion order — plus whatever params that
// technique's diagram needs to render its representative default (e.g.
// marver needs a side count, since a square and a hexagon use the same
// technique but look different).
const TECHNIQUE_ORDER = [
  { key: 'circle', params: {} },
  { key: 'ring', params: {} },
  { key: 'embeddedThread', params: {} },
  { key: 'zanfirico', params: { threadCount: 3 } },
  { key: 'marver', params: { sides: 4 } },
  { key: 'opticMold', params: {} },
  { key: 'star', params: {} },
  { key: 'spiral', params: {} },
  { key: 'jellyroll', params: {} },
  { key: 'pinwheel', params: { blades: 6 } },
  { key: 'line', params: {} },
  { key: 'bundle', params: {} },
]

function TechniqueCard({ techniqueKey, params }) {
  const technique = MURRINI_TECHNIQUES[techniqueKey]
  if (!technique) return null

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex items-start gap-4">
        <TechniqueDiagram techniqueKey={techniqueKey} params={params} />
        <h2 className="text-base font-medium text-neutral-100">{technique.title}</h2>
      </div>
      <p className="text-base leading-relaxed text-neutral-300">{technique.summary}</p>
      <ol className="flex flex-col gap-1 text-base text-neutral-300">
        {technique.steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="text-neutral-400">{index + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function TechniqueGuidePage() {
  return (
    <div className="flex flex-col items-center gap-6 p-4 sm:p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-2xl font-medium text-neutral-100">Cane &amp; Murrini Techniques</h1>
        <p className="mt-1 text-base leading-relaxed text-neutral-400">
          Every technique this app simulates, gathered in one place — what
          it's called, how it's really made, and the same diagram the
          pattern editor shows while you work. These aren't simplified
          analogies made up for the app; each one is a real, documented
          glassblowing method. Some map to a specific tool in the Murrini
          Pattern Engine's toolbar (Ring, Spiral, Jellyroll, Pinwheel,
          Zanfirico); others — Casing, Bundling, Embedded Thread — are
          read back from the actual geometry of whatever you've placed,
          however you built it.
        </p>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-4 lg:grid-cols-2">
        {TECHNIQUE_ORDER.map(({ key, params }) => (
          <TechniqueCard key={key} techniqueKey={key} params={params} />
        ))}
      </div>
    </div>
  )
}
