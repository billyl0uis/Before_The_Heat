import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../components/icons'
import { ModeSwitch } from '../components/ModeSwitch'
import { CaneView } from '../components/murrini/CaneView'
import { RodSlice } from '../components/murrini/RodSlice'
import { GLASS_COLOR_INDEX } from '../content/glassColorIndex'
import {
  buildRecipe,
  defaultColours,
  defaultTwist,
  designSignature,
  RECIPE_ORDER,
  RECIPES,
} from '../engine/murrini/recipes'
import { CLEAR_GLASS, DEFAULT_ROD, findColorant, pulledLengthMm, twistPitchMm, colourNote } from '../engine/murrini/rod'
import { CURRENT_SCHEMA_VERSION } from '../engine/murrini/migrate'
import { computeRepeatedElements } from '../engine/murrini/pattern'
import { buildShopPlan, describeSlice, gatherBalance } from '../engine/murrini/shopPlan'
import { renderSlicePlate } from '../engine/murrini/slicePlate'
import { useResponsiveCanvasSize } from '../hooks/useResponsiveCanvasSize'
import { useSliceGeometry } from '../hooks/useSliceGeometry'
import { Term } from '../components/Term'
import { FillChoice } from '../components/FillChoice'
import { growToFill } from '../engine/murrini/fit'

const STORE_KEY = 'before-the-heat:simple'
const STEPS = ['Recipe', 'Colors', 'Size', 'Plan']
const TWISTS = [
  { degrees: 0, label: 'None' },
  { degrees: 180, label: 'Loose' },
  { degrees: 360, label: 'Medium' },
  { degrees: 720, label: 'Tight' },
]
const MIN_GATHER = 12
const MAX_GATHER = 60

function readStore() {
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) ?? 'null')
  } catch {
    return null
  }
}

// The Advanced design a recipe replaced, kept so it can be brought back.
const SET_ASIDE_KEY = 'before-the-heat:set-aside-design'

function readSetAside() {
  try {
    return JSON.parse(window.localStorage.getItem(SET_ASIDE_KEY) ?? 'null')
  } catch {
    return null
  }
}

function writeSetAside(value) {
  try {
    if (value) window.localStorage.setItem(SET_ASIDE_KEY, JSON.stringify(value))
    else window.localStorage.removeItem(SET_ASIDE_KEY)
  } catch {
    // It can still be brought back until the page is closed.
  }
}

function writeStore(value) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(value))
  } catch {
    // Simple mode still works; it just won't remember its place.
  }
}

const fmt = (value) => value.toLocaleString('en', { maximumFractionDigits: 1 })
const shortName = (name) => name.split(' / ')[0].replace(/ \(.*\)$/, '').replace(/\//g, '/\u200b')


// Guided mode: pick a real recipe, colour its parts, choose a size, get
// the plan. Every choice rebuilds the same design data the full editor
// uses, so the Plan tab, autosave and Advanced mode follow along.
export function SimpleBuilder({ design, onOpenPlan, onMode }) {
  const [stored] = useState(readStore)
  // Where you were, kept across tabs and reloads: coming back from the
  // Plan shouldn't mean clicking through Recipe and Colors again.
  const [step, setStep] = useState(() => {
    const saved = readStore()?.step
    return Number.isInteger(saved) && saved >= 0 && saved <= 3 ? saved : 0
  })
  useEffect(() => {
    const store = readStore()
    if (store && store.step !== step) writeStore({ ...store, step })
  }, [step])
  const [openSlot, setOpenSlot] = useState(null)
  const [showRatio, setShowRatio] = useState(false)
  // Slice: the cross-section, end-on. Cane: the pulled cane from the side,
  // where twisted patterns like a zanfirico actually show.
  const [view, setView] = useState('slice')
  const stepHeading = useRef(null)
  const firstStep = useRef(true)
  useEffect(() => {
    // Not on arrival: only when the user moves between steps.
    if (firstStep.current) {
      firstStep.current = false
      return
    }
    stepHeading.current?.focus({ preventScroll: true })
  }, [step])
  // Saved choices are checked before use: a recipe that no longer exists
  // or a damaged value falls back to the default rather than breaking.
  const [choice, setChoice] = useState(() => {
    const object = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {})
    const number = (value, fallback) => (Number.isFinite(value) && value > 0 ? value : fallback)
    return {
      recipe: RECIPES[stored?.recipe] ? stored.recipe : 'flower',
      colours: object(stored?.colours),
      finishedMm: number(stored?.finishedMm, DEFAULT_ROD.gatherDiameterMm / DEFAULT_ROD.pullRatio),
      ratio: number(stored?.ratio, DEFAULT_ROD.pullRatio),
      // Without this a reload forgot the twist you'd picked, and the next
      // color change rebuilt the cane untwisted.
      twist: object(stored?.twist),
      // Kept across reloads, or a chosen clear border would be grown away.
      ...(stored?.fill === 'clear' || stored?.fill === 'grow' ? { fill: stored.fill } : {}),
    }
  })

  // Is the current design still the one Simple mode made? If it was changed
  // in Advanced, nothing here overwrites it until a recipe is picked.
  const currentSignature = designSignature(design)
  const empty = design.elements.length === 0
  const [customised, setCustomised] = useState(
    () => !empty && stored?.signature !== currentSignature,
  )
  const [setAside, setSetAside] = useState(readSetAside)

  // The recipe as drawn, at the gather the chosen size needs.
  const buildFrom = (next) => {
    const colours = { ...defaultColours(next.recipe), ...next.colours[next.recipe] }
    const rod = {
      ...design.rod,
      gatherDiameterMm: next.finishedMm * next.ratio,
      pullRatio: next.ratio,
    }
    const twistDegrees = next.twist?.[next.recipe] ?? defaultTwist(next.recipe)
    return buildRecipe(next.recipe, colours, rod, { twistDegrees })
  }

  const apply = (next) => {
    const drawn = buildFrom(next)
    // Unless a clear border was chosen, the pattern grows to fill the
    // gather, so the cane pulls to the size on the slider either way.
    const grown = (next.fill ?? 'grow') === 'grow' ? growToFill(drawn) : null
    const built = grown ? { ...drawn, elements: grown.elements, pattern: grown.pattern } : drawn
    // Replacing work done in Advanced: keep it, so it's one tap to undo.
    if (customised) {
      const { canvas, elements, pattern, extrusion, rod: oldRod, casing } = design
      const kept = { schemaVersion: CURRENT_SCHEMA_VERSION, canvas, elements, pattern, extrusion, rod: oldRod, casing }
      writeSetAside(kept)
      setSetAside(kept)
    }
    design.loadDesign(built)
    writeStore({ ...next, signature: designSignature(built), step })
    setChoice(next)
    setCustomised(false)
  }

  // A first visit starts from a real recipe rather than an empty rod; a
  // recipe saved before the fill choice existed is grown to fill, the
  // default, so the size on the slider is the size it pulls to.
  useEffect(() => {
    // The grow is saved as a choice, so it happens once, not on every load.
    if ((empty && !customised) || (!customised && choice.fill === undefined && drawnBalance.hasGap)) {
      apply({ ...choice, fill: choice.fill ?? 'grow' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const recipe = RECIPES[choice.recipe]
  const colours = { ...defaultColours(choice.recipe), ...choice.colours[choice.recipe] }
  const setColour = (slot, id) =>
    apply({
      ...choice,
      colours: { ...choice.colours, [choice.recipe]: { ...choice.colours[choice.recipe], [slot]: id } },
    })

  const ratioMin = Math.max(2, Math.ceil(MIN_GATHER / choice.finishedMm))
  const ratioMax = Math.max(ratioMin, Math.min(12, Math.floor(MAX_GATHER / choice.finishedMm)))
  const setFinished = (finishedMm) => {
    const ratio = Math.min(Math.max(choice.ratio, Math.ceil(MIN_GATHER / finishedMm)), Math.floor(MAX_GATHER / finishedMm))
    apply({ ...choice, finishedMm, ratio })
  }

  const slice = useSliceGeometry(design.rod, design.casing)
  const { containerRef, size } = useResponsiveCanvasSize(460, 1)
  const plan = useMemo(() => buildShopPlan(design), [design])
  // Whether the recipe fills the gather; the Size step asks about the gap
  // so the size picked and the size pulled always agree.
  // The recipe as drawn, before any growing: whether it leaves a gap
  // inside the casing for the Size step to ask about.
  const drawnBalance = useMemo(() => {
    const drawn = buildFrom(choice)
    return gatherBalance({
      repeatedElements: computeRepeatedElements(drawn.elements, drawn.pattern),
      rod: drawn.rod,
      casing: drawn.casing,
    })
    // buildFrom reads only `choice` and the rod's other settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, design.rod.gatherLengthMm])
  const pullRod = design.rod

  const thumbs = useMemo(
    () =>
      Object.fromEntries(
        RECIPE_ORDER.map((key) => {
          const built = buildRecipe(key, defaultColours(key), DEFAULT_ROD)
          return [
            key,
            renderSlicePlate({
              ...built,
              // the repeated cross-section, not just the drawn base cell
              elements: computeRepeatedElements(built.elements, built.pattern),
              size: 168,
            }).toDataURL('image/png'),
          ]
        }),
      ),
    [],
  )

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] lg:h-[calc(100svh-3.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section
        aria-label="Your murrine"
        data-sticky-preview
        className="max-lg:sticky max-lg:top-14 max-lg:z-10 flex flex-col items-center justify-center gap-2 border-b border-line bg-ground px-4 py-3 lg:order-2 lg:border-b-0 lg:py-6"
      >
        <div className="flex w-full max-w-[460px] items-center justify-between gap-2">
          <div className="inline-flex rounded-lg bg-raise p-0.5" role="group" aria-label="View">
            {[
              { key: 'slice', label: 'Slice' },
              { key: 'cane', label: 'Cane' },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={view === option.key}
                onClick={() => setView(option.key)}
                className={`rounded-md px-3 py-1 text-sm font-semibold max-sm:min-h-[44px] ${
                  view === option.key ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <ModeSwitch mode="simple" onChange={onMode} className="sm:hidden" />
        </div>
        <div
          ref={containerRef}
          className={`flex w-full max-w-[min(460px,calc(100svh-15rem))] justify-center ${
            // While choosing colors and size on a phone, the preview gives up
            // room to the choices; it's full size again for recipe and plan.
            step === 1 || step === 2 ? 'max-lg:max-w-[min(120px,15svh)]' : 'max-lg:max-w-[min(190px,22svh)]'
          }`}
        >
          {view === 'slice' ? (
            <RodSlice
              canvas={design.canvas}
              elements={design.repeatedElements}
              slice={slice}
              rod={design.rod}
              pullRod={pullRod}
              description={describeSlice({ repeatedElements: design.repeatedElements, casing: design.casing })}
              onPlace={() => {}}
              preview={NO_PREVIEW}
              size={size.width}
              // Picking colors doesn't change the numbers, so on a phone they
              // step aside to give the choices room.
              readoutsClassName={step === 1 ? 'max-lg:hidden' : ''}
            />
          ) : (
            <CaneView
              elements={design.repeatedElements}
              rod={design.rod}
              casing={design.casing}
              twistDegrees={design.extrusion.twistDegrees}
              width={size.width}
              height={Math.round(size.width * 0.72)}
            />
          )}
        </div>
        <p className="text-sm text-mute max-lg:hidden">
          {view === 'cane'
            ? 'Side view of the pulled cane · a short stretch, twist to scale'
            : customised
              ? 'Your edited design'
              : `${recipe.name}, drawn to scale`}
        </p>
      </section>

      <section className="flex min-h-0 flex-col border-line bg-panel lg:order-1 lg:border-r">
        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-6 sm:px-8 sm:pt-7">
          <nav aria-label="Steps" className="mb-6 flex gap-1.5">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-current={index === step ? 'step' : undefined}
                onClick={() => setStep(index)}
                className={`flex flex-1 flex-col gap-1.5 text-left text-xs font-semibold max-sm:min-h-[44px] sm:text-sm ${
                  index === step ? 'text-ink' : index < step ? 'text-mute' : 'text-faint'
                }`}
              >
                <span
                  className={`h-1 rounded-full ${
                    index === step ? 'bg-accent-2' : index < step ? 'bg-accent' : 'bg-line'
                  }`}
                />
                {index + 1}. {label}
              </button>
            ))}
          </nav>

          {customised && (
            <p role="status" className="mb-5 flex gap-2 rounded-xl border border-amber-400/40 bg-amber-950/30 p-3 text-sm text-amber-100">
              <Icon name="warning" size={18} className="mt-0.5 shrink-0" />
              <span>
                You changed this design in Advanced. Picking a recipe replaces it, but it's kept: you can
                bring it back straight after.
              </span>
            </p>
          )}
          {!customised && setAside && (
            <div role="status" className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-raise p-3 text-sm">
              <span className="min-w-0 flex-1">Your Advanced design was replaced by this recipe. It's kept for you.</span>
              <span className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    design.loadDesign(setAside)
                    writeSetAside(null)
                    setSetAside(null)
                    onMode('advanced')
                  }}
                  className="rounded-lg bg-accent px-3 py-1.5 font-bold text-accent-ink"
                >
                  Bring it back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    writeSetAside(null)
                    setSetAside(null)
                  }}
                  className="font-semibold text-mute hover:text-ink"
                >
                  Discard it
                </button>
              </span>
            </div>
          )}

          {step === 0 && (
            <>
              <h1 ref={stepHeading} tabIndex={-1} className="text-[1.6rem] leading-tight font-extrabold tracking-tight outline-none">
                What are you making?
              </h1>
              <p className="mt-1.5 text-mute">Start from a real murrine recipe. You can change everything after.</p>
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {RECIPE_ORDER.map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={!customised && key === choice.recipe}
                    onClick={() => {
                      apply({ ...choice, recipe: key })
                      // Twisted recipes are seen best from the side.
                      setView((choice.twist?.[key] ?? defaultTwist(key)) ? 'cane' : 'slice')
                    }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 bg-raise px-2 pt-3.5 pb-3 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 ${
                      !customised && key === choice.recipe ? 'border-accent' : 'border-transparent'
                    }`}
                  >
                    <img src={thumbs[key]} alt="" width={84} height={84} />
                    <span className="font-bold">{RECIPES[key].name}</span>
                    <span className="text-center text-xs leading-snug text-mute">{RECIPES[key].blurb}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 ref={stepHeading} tabIndex={-1} className="text-[1.6rem] leading-tight font-extrabold tracking-tight outline-none">
                Choose the colors
              </h1>
              <p className="mt-1.5 text-mute">
                One color for each part of the {recipe.name.toLowerCase()}. Choose a part to change it. Under each
                color is how it behaves: whether it <Term id="strike">strikes</Term>, is toxic, or is opaque.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                {Object.entries(recipe.slots).map(([key, slot]) => {
                  const current = findColorant(colours[key]) ?? CLEAR_GLASS
                  const open = openSlot === key
                  const options = slot.allowClear ? [CLEAR_GLASS, ...GLASS_COLOR_INDEX] : GLASS_COLOR_INDEX
                  return (
                    <div key={key} className="overflow-hidden rounded-2xl bg-raise">
                      <button
                        type="button"
                        aria-expanded={open}
                        disabled={customised}
                        onClick={(event) => {
                          setOpenSlot(open ? null : key)
                          // On a phone, bring the slot up under the pinned preview so
                          // its name stays in view while you pick.
                          const head = event.currentTarget
                          if (open || window.innerWidth >= 1024) return
                          requestAnimationFrame(() => {
                            const pinned = document.querySelector('[data-sticky-preview]')?.offsetHeight ?? 0
                            window.scrollBy({ top: head.getBoundingClientRect().top - 56 - pinned - 8 })
                          })
                        }}
                        className="flex w-full items-center gap-3.5 px-3.5 py-3 text-left disabled:opacity-50"
                      >
                        <span
                          className="h-10 w-10 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)]"
                          style={{ background: current.swatch }}
                        />
                        <span className="flex flex-col">
                          <span className="text-xs font-bold tracking-[0.07em] text-mute uppercase">{slot.label}</span>
                          <span className="font-semibold">{shortName(current.name)}</span>
                        </span>
                        <Icon
                          name="chevronDown"
                          size={18}
                          className={`ml-auto text-mute transition-transform ${open ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {open && (
                        <div className="grid grid-cols-2 gap-1.5 px-3.5 pb-3.5 sm:grid-cols-3">
                          {options.map((colorant) => (
                            <button
                              key={colorant.id}
                              type="button"
                              aria-pressed={colours[key] === colorant.id}
                              onClick={() => {
                                setColour(key, colorant.id)
                                setOpenSlot(null)
                              }}
                              className={`flex items-center gap-2 rounded-lg border bg-panel px-2 py-1.5 text-left text-[0.8rem] leading-tight ${
                                colours[key] === colorant.id ? 'border-ink' : 'border-transparent hover:border-line'
                              }`}
                            >
                              <span
                                className="h-5 w-5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)]"
                                style={{ background: colorant.swatch }}
                              />
                              <span className="min-w-0 break-words">
                                {shortName(colorant.name)}
                                <span className={`block text-[0.8rem] ${colorant.hazard ? 'text-red-300' : 'text-faint'}`}>
                                  {colourNote(colorant)}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 ref={stepHeading} tabIndex={-1} className="text-[1.6rem] leading-tight font-extrabold tracking-tight outline-none">
                How big a cane?
              </h1>
              <p className="mt-1.5 text-mute">The diameter of the finished cane you'll slice. The rest follows from it.</p>
              <div className="mt-6 flex flex-col gap-3">
                <label htmlFor="simple-finished" className="flex items-baseline justify-between font-semibold text-mute">
                  Finished diameter
                  <output htmlFor="simple-finished" className="font-mono text-2xl text-ink">
                    {fmt(choice.finishedMm)} mm
                  </output>
                </label>
                <input
                  id="simple-finished"
                  type="range"
                  min={3}
                  max={15}
                  step={0.5}
                  value={choice.finishedMm}
                  disabled={customised}
                  onChange={(event) => setFinished(Number(event.target.value))}
                  className="h-8 w-full cursor-pointer"
                />
                {drawnBalance.hasGap && (
                  <FillChoice
                    contentMm={drawnBalance.contentMm}
                    fillToMm={drawnBalance.fillToMm}
                    finishedMm={choice.finishedMm}
                    choice={choice.fill ?? 'grow'}
                    onChoose={(fill) => apply({ ...choice, fill })}
                  />
                )}
                <p className="text-mute">
                  From a <span className="font-mono text-ink">{fmt(pullRod.gatherDiameterMm)} mm</span>{' '}
                  <Term id="gather">gather</Term> <Term id="pull">pulled</Term>{' '}
                  <Term id="pullRatio">
                    <span className="font-mono text-ink">{choice.ratio} : 1</span>
                  </Term>
                  , about{' '}
                  <span className="font-mono text-ink">{fmt(pulledLengthMm(design.rod) / 1000)} m</span> of cane.{' '}
                  <button
                    type="button"
                    onClick={() => setShowRatio(!showRatio)}
                    className="font-bold text-accent underline underline-offset-4"
                  >
                    {showRatio ? 'Hide' : 'Change pull ratio'}
                  </button>
                </p>
                {showRatio && (
                  <div className="flex flex-col gap-2 rounded-xl bg-raise p-3.5">
                    <label htmlFor="simple-ratio" className="flex items-baseline justify-between font-semibold text-mute">
                      Pull ratio
                      <output htmlFor="simple-ratio" className="font-mono text-ink">{choice.ratio} : 1</output>
                    </label>
                    <input
                      id="simple-ratio"
                      type="range"
                      min={ratioMin}
                      max={ratioMax}
                      value={choice.ratio}
                      disabled={customised}
                      onChange={(event) => apply({ ...choice, ratio: Number(event.target.value) })}
                      className="h-8 w-full cursor-pointer"
                    />
                    <p className="text-sm text-mute">A higher ratio starts from a bigger gather and gives more cane.</p>
                  </div>
                )}

                <div className="mt-3 flex flex-col gap-2">
                  <p className="font-semibold text-mute">Twist while pulling</p>
                  <div className="grid grid-cols-4 gap-1 rounded-xl bg-raise p-1" role="group" aria-label="Twist while pulling">
                    {TWISTS.map((option) => {
                      const current = choice.twist?.[choice.recipe] ?? defaultTwist(choice.recipe)
                      return (
                        <button
                          key={option.degrees}
                          type="button"
                          aria-pressed={current === option.degrees}
                          disabled={customised}
                          onClick={() => {
                            apply({ ...choice, twist: { ...choice.twist, [choice.recipe]: option.degrees } })
                            // A twist only shows from the side: switch the view to it.
                            if (option.degrees) setView('cane')
                          }}
                          className={`rounded-lg py-2 text-sm font-semibold disabled:opacity-50 ${
                            current === option.degrees ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
                          }`}
                        >
                          {option.label}
                          {option.degrees ? (
                            <span className="block font-mono text-[0.8rem] font-normal opacity-80">
                              {fmt(twistPitchMm(design.rod, option.degrees))} mm
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-sm text-mute">
                    Twisting the cane as it's pulled winds anything off-center into a spiral, like a
                    zanfirico. The number is how far along the pulled cane one full turn takes. See it with{' '}
                    <span className="font-semibold text-ink">Cane</span> above the slice.
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 ref={stepHeading} tabIndex={-1} className="text-[1.6rem] leading-tight font-extrabold tracking-tight outline-none">
                Your shop plan
              </h1>
              <p className="mt-1.5 text-mute">
                {plan.length} steps, read straight from your {customised ? 'design' : recipe.name.toLowerCase()}.
              </p>
              <ol className="mt-4">
                {plan.map((item, index) => (
                  <li key={item.key} className="grid grid-cols-[1.5rem_1fr] gap-2.5 border-b border-line py-2.5">
                    <span className="font-extrabold text-accent">{index + 1}</span>
                    <span className="font-semibold text-balance">{item.title}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenPlan('sheet')}
                  className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-extrabold text-accent-ink"
                >
                  <Icon name="print" size={18} /> See the sheet to print
                </button>
                <button type="button" onClick={() => onOpenPlan('checklist')} className="rounded-xl bg-raise px-5 py-3 font-bold">
                  Checklist for the shop
                </button>
                <button type="button" onClick={() => onMode('advanced')} className="rounded-xl bg-raise px-5 py-3 font-bold">
                  Fine-tune in Advanced
                </button>
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-2.5 border-t border-line bg-panel px-4 py-3 sm:px-8">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
            className="rounded-xl bg-raise px-5 py-3 font-bold disabled:opacity-40"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-extrabold text-accent-ink"
            >
              Next: {STEPS[step + 1]} <Icon name="arrowRight" size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex-1 rounded-xl bg-raise px-5 py-3 font-bold"
            >
              Choose another recipe
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

const NO_PREVIEW = { shape: null, params: {}, color: '#ffffff' }
