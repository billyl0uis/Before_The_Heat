import { useState } from 'react'
import { Term } from './Term'

const fmt = (value) => value.toLocaleString('en', { maximumFractionDigits: 1 })

// The reasons either way, so the choice is an informed one.
function Reasons({ balance, rod }) {
  const { fillToMm, naturalMm } = balance
  return (
    <div className="mt-3 grid gap-4 text-sm leading-relaxed text-ink-soft sm:grid-cols-2">
      <div>
        <p className="font-semibold text-ink">Fill out with clear to Ø {fmt(fillToMm)} mm if you want</p>
        <ul className="mt-1 list-disc pl-5">
          <li>the cane to pull to Ø {fmt(rod.gatherDiameterMm / rod.pullRatio)} mm, the size you set</li>
          <li>
            more clear round the pattern, so <Term id="marver">marvering</Term> and reheats don't reach it
          </li>
          <li>slices with a clear border, which read cleanly laid edge to edge</li>
        </ul>
      </div>
      <div>
        <p className="font-semibold text-ink">Leave it out if you want</p>
        <ul className="mt-1 list-disc pl-5">
          <li>the pattern to fill more of each slice</li>
          <li>less glass to heat and pull, and one step fewer</li>
          <li>
            a thinner cane: Ø {fmt(naturalMm / rod.pullRatio)} mm at {rod.pullRatio} : 1
          </li>
        </ul>
      </div>
    </div>
  )
}

// A design rarely fills the gather exactly. Where the size is chosen (the
// Size step, the Rod panel) this asks whether to fill the gap with clear,
// so the size picked and the size pulled always agree. On the Plan it's a
// one-line summary that opens the same choice.
export function FillChoice({ balance, rod, onChange, variant = 'inline' }) {
  const [open, setOpen] = useState(variant === 'inline' ? false : null)
  const [showChoice, setShowChoice] = useState(false)
  if (!balance.hasGap) return null
  const { contentMm, filled } = balance
  const filledMm = rod.gatherDiameterMm / rod.pullRatio
  const leftOutMm = balance.naturalMm / rod.pullRatio

  const toggle = (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-raise p-1" role="group" aria-label="Clear fill">
      {[
        { value: true, label: 'Fill with clear', mm: filledMm },
        { value: false, label: 'Leave it out', mm: leftOutMm },
      ].map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={filled === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-[44px] rounded-lg px-2 py-2 text-sm font-semibold ${
            filled === option.value ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
          }`}
        >
          {option.label}
          <span className="block font-mono text-[0.8rem] font-normal opacity-80">pulls to Ø {fmt(option.mm)} mm</span>
        </button>
      ))}
    </div>
  )

  if (variant === 'summary' && !showChoice) {
    return (
      <p data-print-hide className="mx-auto mb-6 w-full max-w-[860px] text-sm text-mute">
        Clear fill: <span className="font-semibold text-ink">{filled ? 'added' : 'left out'}</span>, so it pulls to Ø{' '}
        {fmt(filled ? filledMm : leftOutMm)} mm.{' '}
        <button
          type="button"
          onClick={() => setShowChoice(true)}
          className="inline-flex min-h-[44px] items-center font-semibold text-accent underline underline-offset-[3px] sm:min-h-0"
        >
          Change
        </button>
      </p>
    )
  }

  return (
    <section
      data-print-hide
      aria-label="Clear fill"
      className={
        variant === 'summary'
          ? 'mx-auto mb-8 w-full max-w-[860px] rounded-xl border border-line bg-panel p-4 sm:p-5'
          : 'flex flex-col gap-2 rounded-xl border border-line p-3.5'
      }
    >
      <p className="text-sm leading-relaxed text-ink-soft">
        Your design is Ø {fmt(contentMm)} mm, smaller than the space inside the <Term id="casing">casing</Term>. Fill
        the gap with clear, or leave it out and pull a thinner cane?
      </p>
      {toggle}
      <details open={open ?? true} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-semibold text-accent sm:min-h-0">
          Why choose one or the other?
        </summary>
        <Reasons balance={balance} rod={rod} />
      </details>
      {variant === 'summary' && (
        <button
          type="button"
          onClick={() => setShowChoice(false)}
          className="self-start text-sm font-semibold text-mute underline underline-offset-[3px]"
        >
          Done
        </button>
      )}
    </section>
  )
}
