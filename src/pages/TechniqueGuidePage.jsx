import { PageHeader } from '../components/PageHeader'
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
  { key: 'multiCasing', params: {} },
  { key: 'embeddedThread', params: {} },
  { key: 'zanfirico', params: { threadCount: 3 } },
  { key: 'marver', params: { sides: 4 } },
  { key: 'opticMold', params: {} },
  { key: 'star', params: {} },
  { key: 'spiral', params: {} },
  { key: 'jellyroll', params: {} },
  { key: 'pinwheel', params: { blades: 6 } },
  { key: 'line', params: {} },
  { key: 'tripod', params: {} },
  { key: 'cross', params: {} },
  { key: 'row', params: {} },
  { key: 'grid', params: {} },
  { key: 'frame', params: {} },
  { key: 'bundle', params: {} },
]

function TechniqueCard({ techniqueKey, params }) {
  const technique = MURRINI_TECHNIQUES[techniqueKey]
  if (!technique) return null

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-5">
      <div className="flex items-center gap-4">
        <TechniqueDiagram techniqueKey={techniqueKey} params={params} />
        <h2 className="text-base leading-snug font-semibold text-ink">{technique.title}</h2>
      </div>
      <p className="text-base leading-relaxed text-ink-soft">{technique.summary}</p>
      <ol className="flex flex-col gap-1.5 text-base leading-relaxed text-ink-soft">
        {technique.steps.map((step, index) => (
          <li key={step} className="grid grid-cols-[1.5rem_1fr] gap-1">
            <span className="pt-0.5 font-mono text-[0.8rem] font-semibold text-accent">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </article>
  )
}

export function TechniqueGuidePage() {
  return (
    <>
      <PageHeader
        title="Cane and murrini techniques"
        lede="The real glassblowing methods behind every tool in the editor, in the order you'd learn them: single canes first, bundles last."
      />
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 sm:px-8 lg:grid-cols-2">
        {TECHNIQUE_ORDER.map(({ key, params }) => (
          <TechniqueCard key={key} techniqueKey={key} params={params} />
        ))}
      </div>
    </>
  )
}
