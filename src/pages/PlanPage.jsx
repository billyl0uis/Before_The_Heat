import { useMemo, useState } from 'react'
import { Icon } from '../components/icons'
import { FieldHeader } from '../components/plan/FieldHeader'
import { PlanSheet } from '../components/plan/PlanSheet'
import { ShopChecklist } from '../components/plan/ShopChecklist'
import { pulledDiameterMm, pulledLengthMm } from '../engine/murrini/rod'
import { buildShopPlan, shopPlanWarnings, turnsLabel, usedColorants } from '../engine/murrini/shopPlan'

const VIEW_KEY = 'before-the-heat:plan-view'

function readView() {
  try {
    return window.localStorage.getItem(VIEW_KEY) === 'checklist' ? 'checklist' : 'sheet'
  } catch {
    return 'sheet'
  }
}

export function PlanPage({ design, onEdit }) {
  const [view, setView] = useState(readView)
  const { elements, pattern, rod, casing, extrusion } = design
  const steps = useMemo(
    () => buildShopPlan({ elements, pattern, rod, casing, extrusion }),
    [elements, pattern, rod, casing, extrusion],
  )
  const warnings = useMemo(() => shopPlanWarnings({ elements, casing }), [elements, casing])
  const colorants = useMemo(() => usedColorants({ elements, casing }), [elements, casing])

  const choose = (next) => {
    setView(next)
    try {
      window.localStorage.setItem(VIEW_KEY, next)
    } catch {
      // The choice just won't be remembered.
    }
  }

  if (!steps.length) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-start gap-4 px-6 py-20">
        <h1 className="text-3xl font-extrabold tracking-tight">Nothing to plan yet</h1>
        <p className="text-lg leading-relaxed text-mute">
          Place at least one cane on the slice and the build order, casing and pull appear here.
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-bold text-accent-ink"
        >
          Go to the editor <Icon name="arrowRight" size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <FieldHeader design={design}>
        <h1 className="rounded-xl bg-ground px-4 py-3 text-[clamp(1.8rem,4.6vw,3.4rem)] leading-[0.98] font-extrabold tracking-tight shadow-[0_12px_40px_rgb(0_0_0/0.5)] sm:px-5">
          Ready to pull
        </h1>
        <p className="rounded-lg bg-ground px-3 py-2 font-mono text-sm shadow-[0_12px_40px_rgb(0_0_0/0.5)]">
          Ø {rod.gatherDiameterMm} → {pulledDiameterMm(rod).toFixed(1)} mm · {rod.pullRatio} : 1 · ≈{' '}
          {(pulledLengthMm(rod) / 1000).toFixed(1)} m
          {extrusion.twistDegrees ? ` · ${turnsLabel(extrusion.twistDegrees)}` : ''}
        </p>
      </FieldHeader>

      <div
        data-print-hide
        className="flex flex-wrap items-center gap-2 border-b border-line bg-panel px-4 py-3 sm:gap-3 sm:px-8"
      >
        <div className="inline-flex rounded-lg bg-raise p-0.5" role="group" aria-label="Plan view">
          {[
            { key: 'sheet', label: 'Print sheet' },
            { key: 'checklist', label: 'Shop checklist' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={view === option.key}
              onClick={() => choose(option.key)}
              className={`rounded-md px-2.5 py-2 text-sm font-semibold whitespace-nowrap sm:px-4 ${
                view === option.key ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg px-2 py-2 text-sm font-semibold whitespace-nowrap text-mute hover:text-ink sm:px-3"
        >
          Edit<span className="max-sm:hidden"> design</span>
        </button>
        {view === 'sheet' && (
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Print plan"
            className="ml-auto flex items-center gap-2 rounded-lg bg-accent px-3 py-2.5 font-bold text-accent-ink sm:px-4"
          >
            {/* On a phone this opens the share / save-as-PDF sheet. */}
            <Icon name="print" size={18} /> <span className="max-sm:sr-only">Print plan</span>
          </button>
        )}
      </div>

      <div className="px-4 py-8 sm:px-8 sm:py-10 print:p-0">
        {view === 'sheet' ? (
          <PlanSheet design={design} steps={steps} warnings={warnings} colorants={colorants} />
        ) : (
          <ShopChecklist design={design} steps={steps} warnings={warnings} />
        )}
      </div>
    </div>
  )
}
