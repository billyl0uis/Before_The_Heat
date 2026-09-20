import { computeBuildPlan, MURRINI_TECHNIQUES } from '../../content/murrineTechniques'

// The "figure out how it's really made" readout: turns whatever's
// currently placed into an ordered, real build sequence — one step per
// individual cane (grounded in the same geometry check that drives
// Casing vs. Bundling elsewhere), then a final assembly step if there's
// more than one. Always describes what's actually on the canvas, never a
// guess at what you might have meant.
export function BuildPlan({ elements }) {
  const plan = computeBuildPlan(elements)
  // A single cane is already fully covered by the technique panel above —
  // this readout earns its place once there's an actual sequence to show.
  if (plan.length <= 1) return null

  return (
    <div className="flex w-64 flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-sm font-medium text-neutral-100">Build Order</h2>
      <ol className="flex flex-col gap-3">
        {plan.map((step, index) => {
          const technique = MURRINI_TECHNIQUES[step.techniqueKey]
          if (!technique) return null
          const isFinalAssembly = step.techniqueKey === 'bundle'
          return (
            <li key={index} className="flex gap-2 text-sm">
              <span className="text-neutral-400">{index + 1}.</span>
              <div>
                <p className="font-medium text-neutral-200">
                  {isFinalAssembly
                    ? `Bundle all ${step.caneCount} canes and pull as one`
                    : `${technique.title}${step.caneCount > 1 ? ` (${step.caneCount} colors)` : ''}`}
                </p>
                <p className="text-neutral-400">{technique.summary}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
