import { MURRINI_TECHNIQUES } from '../../content/murrineTechniques'
import { TechniqueDiagram } from './TechniqueDiagram'

export function TechniqueReference({ shape }) {
  const technique = MURRINI_TECHNIQUES[shape]
  if (!technique) return null

  return (
    <div className="flex w-64 flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-sm font-medium text-neutral-100">How it's really made</h2>
      <TechniqueDiagram shape={shape} />
      <p className="text-sm font-medium text-neutral-200">{technique.title}</p>
      <p className="text-xs text-neutral-400">{technique.summary}</p>
      <ol className="flex flex-col gap-1 text-xs text-neutral-400">
        {technique.steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="text-neutral-600">{index + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
