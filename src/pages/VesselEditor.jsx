import { useEffect, useMemo, useState } from 'react'
import { ColourChip, RailSection, RangeField, Segmented } from '../components/vessel/controls'
import { PickupReadout } from '../components/vessel/PickupReadout'
import { PickupStepCard } from '../components/vessel/PickupStepCard'
import { VesselCanvas } from '../components/vessel/VesselCanvas'
import { VesselControls } from '../components/vessel/VesselControls'
import { GLASS_COLOR_INDEX } from '../content/glassColorIndex'
import { findColorant, pulledDiameterMm, pulledLengthMm } from '../engine/murrini/rod'
import { pullRodOf, twistLabel } from '../engine/murrini/shopPlan'
import { renderSlicePlate } from '../engine/murrini/slicePlate'
import { caneShowColour, measureWall, metres, murriniLayout, planPickup, planReticello, vesselName } from '../engine/vessel/pickup'
import { isFiligreeCane } from '../engine/murrini/shopPlan'
import { vesselRadiusFunction } from '../engine/vessel/profile'
import { Term } from '../components/Term'

// The gather under the pattern. Transparent colors only, so the pattern
// still shows through.
const BODY_GLASS = ['clear', 'cobalt-blue', 'copper-turquoise', 'sulfur-carbon-amber', 'erbium-pink', 'praseodymium-green']
const CLEAR_SWATCH = '#dcebf0'
// The darker edge of clear glass, so the Clear chip reads as glass, not white.
const CLEAR_SWATCH_EDGE = '#9fb7c2'

const shortName = (colorant) => colorant?.name.split(' / ')[0].replace(/ \(.*\)$/, '') ?? ''
const fmt = (value, digits = 0) => value.toLocaleString('en', { maximumFractionDigits: digits })

export function VesselEditor({ design, vesselState, onEditDesign }) {
  const { vessel, morph, update, addPlacement, undoPlacement, clearPlacements } = vesselState
  const { params, freeform, controlRadii } = vessel
  const hasDesign = design.elements.length > 0
  const [ribTarget, setRibTarget] = useState('a')
  const [coarse] = useState(() => window.matchMedia('(pointer: coarse)').matches)

  const wall = useMemo(
    () => measureWall(vesselRadiusFunction({ params, freeform, controlRadii }), params.height),
    [params, freeform, controlRadii],
  )
  const sliceDiameterMm = pulledDiameterMm(pullRodOf(design))
  const layout = useMemo(() => murriniLayout(wall, sliceDiameterMm), [wall, sliceDiameterMm])
  const pickup = useMemo(() => planPickup(vessel, design), [vessel, design])
  // Lengths of the cane picked up straight: what the 3D view paints.
  const canePickup = useMemo(
    () =>
      pickup?.canes
        ? { count: pickup.count, color: caneShowColour(design), twisted: Boolean(design.extrusion?.twistDegrees) }
        : null,
    [pickup, design],
  )
  const reticello = useMemo(() => planReticello(vessel), [vessel])

  // A slice of the real cane, the same image the plan prints.
  const sliceImage = useMemo(
    () =>
      hasDesign
        ? renderSlicePlate({ elements: design.repeatedElements, rod: design.rod, casing: design.casing, size: 160 })
        : null,
    [hasDesign, design.repeatedElements, design.rod, design.casing],
  )
  const sliceThumb = useMemo(() => sliceImage?.toDataURL('image/png'), [sliceImage])

  const glassColorant = vessel.glassId === 'clear' ? null : findColorant(vessel.glassId)
  const glass = useMemo(
    () => ({ swatch: glassColorant?.swatch ?? CLEAR_SWATCH, clear: !glassColorant }),
    [glassColorant],
  )
  const ribColors = useMemo(
    () => ({ a: findColorant(vessel.ribA)?.swatch ?? '#f5f5f4', b: findColorant(vessel.ribB)?.swatch ?? '#1e3a8a' }),
    [vessel.ribA, vessel.ribB],
  )

  const placing = vessel.pattern === 'murrini' && vessel.place === 'hand' && hasDesign
  const [confirmClear, setConfirmClear] = useState(false)
  useEffect(() => {
    if (!confirmClear) return
    const timer = setTimeout(() => setConfirmClear(false), 4000)
    return () => clearTimeout(timer)
  }, [confirmClear])
  const addSliceAtFront = () => {
    // The front of the piece is u = 0. Alternate right and left of it, one
    // slice width apart, so repeated presses make a row, not a stack.
    const k = vessel.placements.length
    const step = sliceDiameterMm / (2 * Math.PI * wall.meanRadius)
    const offset = (k % 2 ? -1 : 1) * Math.ceil(k / 2) * step
    addPlacement(((offset % 1) + 1) % 1, 0.5)
  }
  const hint = placing
    ? coarse
      ? 'Tap to place · drag to turn · pinch to zoom'
      : 'Click to place · drag to turn · scroll to zoom'
    : coarse
      ? 'Drag to turn · pinch to zoom'
      : 'Drag to turn · scroll to zoom'

  const planMessage =
    vessel.pattern === 'canes'
      ? 'Make a cane in the Murrini tab first: lengths of it are what go on here.'
      : vessel.pattern === 'murrini'
        ? hasDesign
          ? 'Place some slices and the pick-up step appears here.'
          : 'Make a cane in the Murrini tab first.'
        : 'Nothing to add yet. With a Murrini or Canes pattern, a pick-up step goes here, after the pull; Reticello gets its own plan.'

  return (
    <div className="grid lg:h-[calc(100svh-3.5rem)] lg:grid-cols-[minmax(0,1fr)_384px]">
      <section
        aria-label="Vessel"
        className="flex min-h-0 min-w-0 flex-col bg-ground max-lg:sticky max-lg:top-14 max-lg:z-10 max-lg:h-[44svh] max-lg:border-b max-lg:border-line"
      >
        <div className="relative min-h-0 flex-1">
          <VesselCanvas
            vessel={vessel}
            morph={morph}
            wall={wall}
            layout={layout}
            sliceImage={sliceImage}
            sliceDiameterMm={sliceDiameterMm}
            glass={glass}
            ribColors={ribColors}
            canePickup={canePickup}
            onPlace={placing ? addPlacement : null}
            label={`${vesselName(vessel)}, ${fmt(wall.height)} mm tall. Drag to turn it.`}
          />
          <div className="pointer-events-none absolute top-3 right-4 left-4 flex flex-wrap items-baseline gap-x-3.5 gap-y-1 lg:top-[18px] lg:right-6 lg:left-6">
            <h1 className="text-xl leading-tight font-bold tracking-tight lg:text-[1.6rem]">{vesselName(vessel)}</h1>
            <p className="font-mono text-[0.8rem] text-mute">
              {fmt(wall.height)} mm tall · Ø {fmt(wall.rimRadius * 2)} mm rim
              <span className="max-lg:hidden"> · Ø {fmt(wall.maxRadius * 2)} mm at the widest</span>
            </p>
          </div>
          <p className="pointer-events-none absolute right-4 bottom-2 text-[0.8rem] text-faint lg:right-6 lg:bottom-3.5">
            {hint}
          </p>
        </div>
        <PickupReadout vessel={vessel} pickup={pickup} hasDesign={hasDesign} coarse={coarse} />
      </section>

      <aside
        aria-label="Vessel tools"
        className="border-line bg-panel px-4 pt-5 pb-16 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:px-[22px] lg:pt-[22px]"
      >
        <RailSection title="Form">
          <VesselControls
            vessel={vessel}
            setParam={vesselState.setParam}
            applyPreset={vesselState.applyPreset}
            enterFreeform={vesselState.enterFreeform}
            exitFreeform={vesselState.exitFreeform}
            setControlRadius={vesselState.setControlRadius}
          />
        </RailSection>

        <RailSection title="Glass">
          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Body glass">
            {BODY_GLASS.map((id) => {
              const colorant = id === 'clear' ? null : findColorant(id)
              return (
                <ColourChip
                  key={id}
                  swatch={colorant ? colorant.swatch : `linear-gradient(135deg, ${CLEAR_SWATCH} 45%, ${CLEAR_SWATCH_EDGE})`}
                  name={colorant ? shortName(colorant) : 'Clear'}
                  pressed={vessel.glassId === id}
                  onClick={() => update({ glassId: id })}
                />
              )
            })}
          </div>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-mute">
            The <Term id="gather">gather</Term> your pattern goes onto. Transparent colors only, so the pattern still
            shows.
          </p>
        </RailSection>

        <RailSection title="Pattern">
          <Segmented
            label="Pattern"
            value={vessel.pattern}
            onChange={(pattern) => update({ pattern })}
            options={[
              { value: 'none', label: 'None' },
              { value: 'murrini', label: 'Murrini' },
              { value: 'canes', label: 'Canes' },
              { value: 'reticello', label: 'Reticello' },
            ]}
          />

          {vessel.pattern === 'murrini' && hasDesign && isFiligreeCane(design.elements) && (
            <p className="mt-3.5 rounded-[10px] border border-line px-3 py-2.5 text-[0.8rem] leading-relaxed text-ink-soft">
              Your cane is a <Term id="zanfirico">zanfirico</Term>. Filigree like this is usually{' '}
              <Term id="pickup">picked up</Term> as lengths, not sliced:{' '}
              <button
                type="button"
                onClick={() => update({ pattern: 'canes' })}
                className="font-semibold text-accent underline underline-offset-[3px]"
              >
                plan it as Canes
              </button>
              .
            </p>
          )}

          {vessel.pattern === 'canes' &&
            (hasDesign ? (
              <p className="mt-3.5 rounded-[10px] border border-line px-3 py-2.5 text-[0.8rem] leading-relaxed text-ink-soft">
                Lengths of your Ø {fmt(sliceDiameterMm, 1)} mm cane, laid side by side and{' '}
                <Term id="pickup">picked up</Term> on the gather: how filigree cane like a{' '}
                <Term id="zanfirico">zanfirico</Term> is used. The count is how many close round the first cup.
              </p>
            ) : (
              <div className="mt-3.5 flex flex-col items-start gap-2 rounded-[10px] border border-line px-3 py-2.5">
                <p className="text-[0.8rem] leading-relaxed text-ink-soft">
                  Make a cane in the Murrini tab first: lengths of it are what go on here.
                </p>
                <button type="button" onClick={onEditDesign} className="text-sm font-semibold text-accent underline underline-offset-[3px]">
                  Go to Murrini
                </button>
              </div>
            ))}

          {vessel.pattern === 'murrini' &&
            (hasDesign ? (
              <div className="mt-3.5 flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-[10px] bg-raise px-3 py-2.5">
                  <img src={sliceThumb} alt="" width={52} height={52} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Your cane</p>
                    <p className="font-mono text-[0.8rem] whitespace-nowrap text-mute">
                      Ø {fmt(sliceDiameterMm, 1)} mm · {metres(pulledLengthMm(design.rod))} m a pull
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onEditDesign}
                    className="self-start text-[0.8rem] font-semibold text-accent underline underline-offset-[3px]"
                  >
                    Edit
                  </button>
                </div>
                {design.extrusion?.twistDegrees ? (
                  <p className="rounded-[10px] border border-line px-3 py-2.5 text-[0.8rem] leading-relaxed text-ink-soft">
                    Your cane is twisted, {twistLabel(pullRodOf(design), design.extrusion.twistDegrees)}. Murrini are thin slices cut across
                    it, so the twist won’t show: each slice is your pattern, just turned a little.
                  </p>
                ) : null}
                <Segmented
                  label="How slices go on"
                  value={vessel.place}
                  onChange={(place) => update({ place })}
                  options={[
                    { value: 'fill', label: 'Cover the piece' },
                    { value: 'hand', label: 'Place by hand' },
                  ]}
                />
                <RangeField
                  label="Slice thickness"
                  value={vessel.thicknessMm}
                  display={`${fmt(vessel.thicknessMm, 1)} mm`}
                  min={3}
                  max={8}
                  step={0.5}
                  onChange={(thicknessMm) => update({ thicknessMm })}
                />
                {vessel.place === 'hand' && (
                  <>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: 'Undo', onClick: undoPlacement },
                        // Clearing can't be undone, so it asks once: a second
                        // press within a few seconds clears.
                        confirmClear
                          ? { label: `Clear all ${vessel.placements.length}?`, onClick: () => { clearPlacements(); setConfirmClear(false) } }
                          : { label: 'Clear slices', onClick: () => setConfirmClear(true) },
                      ].map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={action.onClick}
                          disabled={!vessel.placements.length}
                          className="rounded-lg bg-raise p-2 font-semibold text-ink-soft enabled:hover:bg-line disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                    {/* Without a pointer: slices go on at the front, half way up,
                        working outward one slice width each side. */}
                    <button
                      type="button"
                      onClick={addSliceAtFront}
                      className="min-h-[44px] rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-raise"
                    >
                      Add a slice at the front
                    </button>
                    <p className="text-[0.8rem] text-mute">
                      {coarse ? 'Tap' : 'Click'} the vessel to place a slice, or add one at the front. Each is drawn at its
                      real size.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-3.5 flex flex-col items-start gap-2.5 rounded-[10px] bg-raise px-3 py-3">
                <p className="text-sm text-ink-soft">
                  Make a cane in the Murrini tab first: its slice is what goes on the vessel.
                </p>
                <button type="button" onClick={onEditDesign} className="text-sm font-semibold text-accent underline underline-offset-[3px]">
                  Go to Murrini
                </button>
              </div>
            ))}

          {vessel.pattern === 'reticello' && (
            <div className="mt-3.5 flex flex-col gap-3">
              <p className="rounded-[10px] border border-line px-3 py-2.5 text-[0.8rem] leading-relaxed text-ink-soft">
                <Term id="reticello">Reticello</Term> gets its own plan, built from plain rib canes. Your cane plan stays as it is: switch between the
                two at the top of the Plan tab.
              </p>
              <RangeField
                label="Rib canes around"
                value={vessel.ribsAround}
                display={`${vessel.ribsAround / 2} + ${vessel.ribsAround / 2}`}
                min={16}
                max={80}
                step={4}
                onChange={(ribsAround) => update({ ribsAround })}
              />
              {/* Pick which rib you're colouring, then a named colour: works by
                  tap and keyboard alike. */}
              <div className="grid grid-cols-2 gap-[3px] rounded-[10px] bg-raise p-[3px]" role="group" aria-label="Rib to color">
                {[
                  { key: 'a', label: 'Rib A', id: vessel.ribA },
                  { key: 'b', label: 'Rib B', id: vessel.ribB },
                ].map((rib) => (
                  <button
                    key={rib.key}
                    type="button"
                    aria-pressed={ribTarget === rib.key}
                    onClick={() => setRibTarget(rib.key)}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[0.8rem] font-semibold max-sm:min-h-[44px] ${
                      ribTarget === rib.key ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.35)]"
                      style={{ background: findColorant(rib.id)?.swatch }}
                    />
                    <span className="min-w-0 leading-tight [overflow-wrap:anywhere]">
                      {rib.label}: {shortName(findColorant(rib.id))}
                    </span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {GLASS_COLOR_INDEX.map((colorant) => {
                  const current = ribTarget === 'a' ? vessel.ribA : vessel.ribB
                  const badge = [colorant.id === vessel.ribA && 'A', colorant.id === vessel.ribB && 'B']
                    .filter(Boolean)
                    .join('+')
                  return (
                    <ColourChip
                      key={colorant.id}
                      swatch={colorant.swatch}
                      name={shortName(colorant)}
                      pressed={current === colorant.id}
                      badge={badge}
                      onClick={() => update(ribTarget === 'a' ? { ribA: colorant.id } : { ribB: colorant.id })}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </RailSection>

        <RailSection title="In your plan">
          <PickupStepCard pickup={pickup ?? reticello} design={design} emptyMessage={planMessage} />
        </RailSection>
      </aside>
    </div>
  )
}
