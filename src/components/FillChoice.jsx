import { useState } from 'react'
import { Term } from './Term'

const fmt = (value) => value.toLocaleString('en', { maximumFractionDigits: 1 })

// A design rarely fills the space inside the casing exactly. Either way
// the cane pulls to the size that was set: the gap is filled with clear,
// or the design grows to fill it. Both are real choices; these are the
// reasons, in shop terms.
function Reasons() {
  return (
    <div className="mt-2 grid gap-4 text-sm leading-relaxed text-ink-soft sm:grid-cols-2">
      <div>
        <p className="font-semibold text-ink">A clear border, if you want</p>
        <ul className="mt-1 list-disc pl-5">
          <li>
            more clear round the pattern, so <Term id="marver">marvering</Term> and reheats don't reach it
          </li>
          <li>slices with a clear edge, which read cleanly laid edge to edge</li>
          <li>the recipe's proportions exactly as drawn</li>
        </ul>
      </div>
      <div>
        <p className="font-semibold text-ink">The pattern grown to fill it, if you want</p>
        <ul className="mt-1 list-disc pl-5">
          <li>the pattern to fill the whole slice</li>
          <li>one gather fewer: no clear layer to put on</li>
          <li>bigger parts in the bundle, which are easier to pull and place</li>
        </ul>
      </div>
    </div>
  )
}

const optionClass = (active) =>
  `min-h-[44px] rounded-lg px-2 py-2 text-sm font-semibold ${active ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'}`

// Where the size is chosen (Simple's Size step): pick clear or grow, and
// the recipe is rebuilt to match. Both pull to the size on the slider.
export function FillChoice({ contentMm, fillToMm, finishedMm, choice, onChoose }) {
  return (
    <section aria-label="What fills the gather" className="flex flex-col gap-2 rounded-xl border border-line p-3.5">
      <p className="text-sm leading-relaxed text-ink-soft">
        This recipe is Ø {fmt(contentMm)} mm across, smaller than the Ø {fmt(fillToMm)} mm inside the{' '}
        <Term id="casing">casing</Term>. Either way it pulls to Ø {fmt(finishedMm)} mm:
      </p>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-raise p-1" role="group" aria-label="What fills the gather">
        <button type="button" aria-pressed={choice === 'clear'} onClick={() => onChoose('clear')} className={optionClass(choice === 'clear')}>
          Clear border
        </button>
        <button type="button" aria-pressed={choice === 'grow'} onClick={() => onChoose('grow')} className={optionClass(choice === 'grow')}>
          Grow the pattern
        </button>
      </div>
      <details>
        <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-semibold text-accent sm:min-h-0">
          Why choose one or the other?
        </summary>
        <Reasons />
      </details>
    </section>
  )
}

// In the full editor the design is drawn by hand, so growing it is a
// one-off, undoable change; until then the plan fills the gap with clear.
export function FillGap({ balance, onGrow }) {
  const [why, setWhy] = useState(false)
  if (!balance.hasGap) return null
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line p-3 text-sm leading-relaxed text-ink-soft">
      <p>
        Your design is Ø {fmt(balance.contentMm)} mm; the plan fills out to Ø {fmt(balance.fillToMm)} mm with clear so it
        pulls to size.
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={onGrow}
          className="min-h-[44px] rounded-lg bg-raise px-3 py-2 font-semibold text-ink hover:bg-line sm:min-h-0"
        >
          Grow the design to fill
        </button>
        <button type="button" onClick={() => setWhy(!why)} className="font-semibold text-accent underline underline-offset-[3px]">
          {why ? 'Hide' : 'Why?'}
        </button>
      </div>
      {why && <Reasons />}
    </div>
  )
}
