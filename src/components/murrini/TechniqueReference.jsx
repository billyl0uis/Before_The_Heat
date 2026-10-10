import { MURRINI_TECHNIQUES, resolveTechniqueKey } from '../../content/murrineTechniques'
import { TechniqueDiagram } from './TechniqueDiagram'

export function TechniqueReference({ elements, shape, params }) {
  const techniqueKey = resolveTechniqueKey(elements, shape, params)
  const technique = MURRINI_TECHNIQUES[techniqueKey]
  if (!technique) return null

  return (
    <details className="flex flex-col gap-3 [&[open]>summary]:mb-3">
      <summary className="cursor-pointer text-sm font-bold tracking-[0.06em] text-mute uppercase">
        How it's made: {technique.title}
      </summary>
      <TechniqueDiagram techniqueKey={techniqueKey} params={params} />
      <p className="text-sm leading-relaxed text-neutral-300">{technique.summary}</p>
      <ol className="flex flex-col gap-1 text-sm text-neutral-300">
        {technique.steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="text-neutral-400">{index + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </details>
  )
}
