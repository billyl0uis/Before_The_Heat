import { MURRINI_TECHNIQUES, resolveTechniqueKey } from '../../content/murrineTechniques'
import { TechniqueDiagram } from './TechniqueDiagram'

export function TechniqueReference({ elements, shape, params }) {
  const techniqueKey = resolveTechniqueKey(elements, shape, params)
  const technique = MURRINI_TECHNIQUES[techniqueKey]
  if (!technique) return null

  return (
    <div className="flex w-64 flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-base font-medium text-neutral-100">How it's really made</h2>
      <TechniqueDiagram techniqueKey={techniqueKey} params={params} />
      <p className="text-base font-medium text-neutral-200">{technique.title}</p>
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
