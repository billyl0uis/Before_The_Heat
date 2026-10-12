import { useMemo, useState } from 'react'
import { Icon } from '../components/icons'
import { FieldHeader } from '../components/plan/FieldHeader'
import { PlanSheet } from '../components/plan/PlanSheet'
import { ShopChecklist } from '../components/plan/ShopChecklist'
import { pulledDiameterMm, pulledLengthMm } from '../engine/murrini/rod'
import { buildShopPlan, gatherBalance, isFiligreeCane, shopPlanWarnings, twistLabel, usedColorants } from '../engine/murrini/shopPlan'
import { designSignature, RECIPES } from '../engine/murrini/recipes'
import { planPickup, planReticello } from '../engine/vessel/pickup'

const VIEW_KEY = 'before-the-heat:plan-view'

function readView() {
  try {
    return window.localStorage.getItem(VIEW_KEY) === 'checklist' ? 'checklist' : 'sheet'
  } catch {
    return 'sheet'
  }
}

// What the sheet is for, in a line you could write on a jar of cane: the
// recipe's name while the design is still Simple's, then the finished Ø.
function planTitle(design, reticello) {
  if (reticello) return `Reticello ${reticello.form.replace(/^the /, '').replace('your form', 'vessel')}`
  // A zanfirico is a cane you pick up in lengths, not a murrine you slice,
  // and the design itself says so: no need to remember the recipe.
  const filigree = isFiligreeCane(design.elements)
  const kind = filigree ? 'cane' : 'murrine'
  let name = filigree ? 'Zanfirico cane' : `Your ${kind}`
  try {
    const simple = JSON.parse(window.localStorage.getItem('before-the-heat:simple'))
    if (simple?.signature === designSignature(design) && RECIPES[simple.recipe]) name = `${RECIPES[simple.recipe].name} ${kind}`
  } catch {
    // Keep the plain name.
  }
  return `${name} · Ø ${pulledDiameterMm(design.rod).toLocaleString('en', { maximumFractionDigits: 1 })} mm`
}

// Same number format as the sheet: "8 mm", "6.9 mm".
const fmtNum = (value) => value.toLocaleString('en', { maximumFractionDigits: 1 })

export function PlanPage({ design, vessel, planSource = 'cane', onPlanSource, onEdit, onEditVessel }) {
  const [view, setView] = useState(readView)
  const { elements, pattern, rod, casing, extrusion } = design
  // Whether the layers fill the gather that was set, and the rod as it
  // will really be pulled given the user's choice about the gap.
  const balance = useMemo(
    () => gatherBalance({ repeatedElements: design.repeatedElements, rod, casing }),
    [design.repeatedElements, rod, casing],
  )
  const pullRod = balance.pullRod
  // A murrini pick-up chosen on the Vessel page ends the plan.
  const pickup = useMemo(() => planPickup(vessel, design), [vessel, design])
  // A reticello vessel has its own plan, separate from the cane's: show
  // whichever was asked for, and offer the other one by name.
  const reticelloPlan = useMemo(() => planReticello(vessel), [vessel])
  const reticello = planSource === 'vessel' ? reticelloPlan : null
  const steps = useMemo(() => {
    const cane = buildShopPlan({ elements, pattern, rod, casing, extrusion, balance })
    // Reticello doesn't use the cane at all: the plan is the reticello.
    if (reticello) return reticello.steps
    if (!pickup || !cane.length) return cane
    // The pull is where the work happens, so the number of pulls the
    // vessel needs is said there too, not only in the pick-up step.
    const pulls = pickup.totals.pulls
    const withPulls = cane.map((step) => {
      if (pulls < 2) return step
      if (step.key === 'pull') {
        return { ...step, detail: `${step.detail} The vessel pick-up needs ${pulls} of these: build and pull this cane ${pulls} times.` }
      }
      // Every part is needed once per build, so say the total too.
      if (step.count) return { ...step, detail: `${step.detail} For the vessel: ${step.count * pulls} in all, across ${pulls} builds.` }
      return step
    })
    return [...withPulls, pickup.step]
  }, [elements, pattern, rod, casing, extrusion, balance, pickup, reticello])
  // Colors and warnings come from whatever the plan actually uses.
  const used = useMemo(
    () => (reticello ? { elements: reticello.colorantIds.map((colorantId) => ({ colorantId })), casing: [] } : { elements, casing }),
    [reticello, elements, casing],
  )
  const warnings = useMemo(() => shopPlanWarnings(used), [used])
  const colorants = useMemo(() => usedColorants(used), [used])
  const finish = reticello || pickup
    ? { title: 'Before you start', line: 'Into the annealer, then check the piece against the plan.' }
    : isFiligreeCane(elements)
      ? { title: 'Before you use the cane', line: 'Cut a short length and check the threads and twist against the plan.' }
      : { title: 'Before you slice the whole cane', line: 'Slice the cane and check a piece against the plan.' }

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
      {/* At the furnace (the checklist, or any phone) the field shrinks to a
          strip, so the step itself starts near the top of the screen. */}
      <FieldHeader design={design} compact={view === 'checklist'}>
        <h1
          className={`rounded-xl bg-ground px-4 py-3 leading-[0.98] font-extrabold tracking-tight shadow-[0_12px_40px_rgb(0_0_0/0.5)] sm:px-5 ${
            view === 'checklist' ? 'text-[1.6rem] max-sm:py-2' : 'text-[clamp(1.8rem,4.6vw,3.4rem)]'
          }`}
        >
          {reticello ? 'Ready for the reticello' : 'Ready to pull'}
        </h1>
        <p
          className={`rounded-lg bg-ground px-3 py-2 font-mono text-sm shadow-[0_12px_40px_rgb(0_0_0/0.5)] ${
            view === 'checklist' ? 'max-sm:hidden' : ''
          }`}
        >
          {reticello ? (
            `${reticello.perSide} + ${reticello.perSide} rib canes · ${reticello.form} · from the Vessel tab`
          ) : (
            <>
              Ø {fmtNum(pullRod.gatherDiameterMm)} → {fmtNum(pulledDiameterMm(pullRod))} mm · {pullRod.pullRatio} : 1 · ≈{' '}
              {(pulledLengthMm(pullRod) / 1000).toFixed(1)} m
              {extrusion.twistDegrees ? ` · twist ${twistLabel(pullRod, extrusion.twistDegrees)}` : ''}
            </>
          )}
        </p>
      </FieldHeader>

      <div
        data-print-hide
        className="flex flex-wrap items-center gap-2 border-b border-line bg-panel px-4 py-3 sm:gap-3 sm:px-8"
      >
        {reticelloPlan && onPlanSource && (
          <div className="inline-flex rounded-lg bg-raise p-0.5" role="group" aria-label="Which plan">
            {[
              { key: 'cane', label: 'Cane plan' },
              { key: 'vessel', label: 'Reticello plan' },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={planSource === option.key}
                onClick={() => onPlanSource(option.key)}
                className={`min-h-[44px] rounded-md px-2.5 py-2 text-sm font-semibold whitespace-nowrap sm:px-4 ${
                  planSource === option.key ? 'bg-ink text-ground' : 'text-mute hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        <div className="inline-flex rounded-lg bg-raise p-0.5" role="group" aria-label="Plan view">
          {[
            { key: 'sheet', label: 'Sheet' },
            { key: 'checklist', label: 'Checklist' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={view === option.key}
              onClick={() => choose(option.key)}
              className={`rounded-md px-2.5 py-2 text-sm font-semibold whitespace-nowrap max-sm:min-h-[44px] sm:px-4 ${
                view === option.key ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={reticello ? onEditVessel : onEdit}
          className="rounded-lg px-2 py-2 text-sm font-semibold whitespace-nowrap text-mute hover:text-ink max-sm:min-h-[44px] sm:px-3"
        >
          Edit<span className="max-sm:hidden"> {reticello ? 'vessel' : 'design'}</span>
        </button>
        {view === 'sheet' && (
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Print plan"
            className="ml-auto flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-3 py-2.5 font-bold text-accent-ink sm:px-4"
          >
            {/* On a phone this opens the share / save-as-PDF sheet. */}
            <Icon name="print" size={18} /> <span className="max-sm:sr-only">Print plan</span>
          </button>
        )}
      </div>

      <div className="px-4 py-8 sm:px-8 sm:py-10 print:p-0">
        {/* Chosen where the size is set; here just a line to check or change
            it, and never in the furnace checklist. */}
        {!reticello && view === 'sheet' && balance.hasGap && (
          <p data-print-hide className="mx-auto mb-6 w-full max-w-[860px] text-sm text-mute">
            Your design is Ø {fmtNum(balance.contentMm)} mm, so the plan fills out to Ø {fmtNum(balance.fillToMm)} mm with
            clear and the cane pulls to Ø {fmtNum(pulledDiameterMm(rod))} mm.{' '}
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-[44px] items-center font-semibold text-accent underline underline-offset-[3px] sm:min-h-0"
            >
              Grow the design instead
            </button>
          </p>
        )}
        {view === 'sheet' ? (
          <PlanSheet
            design={design}
            steps={steps}
            warnings={warnings}
            colorants={colorants}
            reticello={reticello}
            pickup={reticello ? null : pickup}
            balance={balance}
            title={planTitle({ ...design, rod: pullRod }, reticello)}
          />
        ) : (
          <ShopChecklist
            design={design}
            // At the furnace, checking the colors comes first, not last.
            steps={[
              {
                key: 'test-strip',
                title: 'Pull a test strip first',
                detail:
                  'This plan doesn’t assume a COE. Pull a short strip of these colors together and let it cool: if it cracks or crazes, they don’t match.',
                colorantIds: colorants.map((colorant) => colorant.id),
                plate: { kind: 'slice', casingUpTo: casing.length - 1 },
              },
              ...steps,
            ]}
            warnings={warnings}
            finish={finish}
          />
        )}
      </div>
    </div>
  )
}
