import { useMemo, useState } from 'react'
import { ColourChip, RailSection, RangeField, Segmented } from '../components/vessel/controls'
import { PickupReadout } from '../components/vessel/PickupReadout'
import { PickupStepCard } from '../components/vessel/PickupStepCard'
import { VesselCanvas } from '../components/vessel/VesselCanvas'
import { VesselControls } from '../components/vessel/VesselControls'
import { GLASS_COLOR_INDEX } from '../content/glassColorIndex'
import { findColorant, pulledDiameterMm, pulledLengthMm } from '../engine/murrini/rod'
import { renderSlicePlate } from '../engine/murrini/slicePlate'
import { measureWall, metres, murriniLayout, planPickup, planReticello, vesselName } from '../engine/vessel/pickup'
import { vesselRadiusFunction } from '../engine/vessel/profile'

// The gather under the pattern. Transparent colours only, so the pattern
// still shows through.
const BODY_GLASS = ['clear', 'cobalt-blue', 'copper-turquoise', 'sulfur-carbon-amber', 'erbium-pink', 'praseodymium-green']
const CLEAR_SWATCH = '#dcebf0'

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
  const sliceDiameterMm = pulledDiameterMm(design.rod)
  const layout = useMemo(() => murriniLayout(wall, sliceDiameterMm), [wall, sliceDiameterMm])
  const pickup = useMemo(() => planPickup(vessel, design), [vessel, design])
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
  const hint = placing
    ? coarse
      ? 'Tap to place · drag to turn · pinch to zoom'
      : 'Click to place · drag to turn · scroll to zoom'
    : coarse
      ? 'Drag to turn · pinch to zoom'
      : 'Drag to turn · scroll to zoom'

  const planMessage =
    vessel.pattern === 'reticello'
      ? 'Reticello isn’t added to the plan yet.'
      : vessel.pattern === 'murrini'
        ? hasDesign
          ? 'Place some slices and the pick-up step appears here.'
          : 'Make a cane in the Murrini tab first.'
        : 'Nothing to add yet. With a murrini pattern, a pick-up step goes here, after the pull.'

  return (
    <div className="grid lg:h-[calc(100svh-3.5rem)] lg:grid-cols-[minmax(0,1fr)_384px]">
      <section
        aria-label="Vessel"
        className="flex min-h-0 min-w-0 flex-col bg-ground max-lg:sticky max-lg:top-14 max-lg:z-10 max-lg:h-[58svh] max-lg:border-b max-lg:border-line"
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
        <PickupReadout vessel={vessel} pickup={pickup} hasDesign={hasDesign} />
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
                  swatch={colorant ? colorant.swatch : `linear-gradient(135deg, ${CLEAR_SWATCH} 45%, #9fb7c2)`}
                  name={colorant ? shortName(colorant) : 'Clear'}
                  pressed={vessel.glassId === id}
                  onClick={() => update({ glassId: id })}
                />
              )
            })}
          </div>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-mute">
            The gather your pattern goes onto. Transparent colours only, so the pattern still shows.
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
              { value: 'reticello', label: 'Reticello' },
            ]}
          />

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
                        { label: 'Clear', onClick: clearPlacements },
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
                    <p className="text-[0.8rem] text-mute">
                      {coarse ? 'Tap' : 'Click'} the vessel to place a slice. Each one is drawn at its real size.
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
              <div className="grid grid-cols-2 gap-[3px] rounded-[10px] bg-raise p-[3px]" role="group" aria-label="Rib to colour">
                {[
                  { key: 'a', label: 'Rib A', id: vessel.ribA },
                  { key: 'b', label: 'Rib B', id: vessel.ribB },
                ].map((rib) => (
                  <button
                    key={rib.key}
                    type="button"
                    aria-pressed={ribTarget === rib.key}
                    onClick={() => setRibTarget(rib.key)}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[0.8rem] font-semibold ${
                      ribTarget === rib.key ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.35)]"
                      style={{ background: findColorant(rib.id)?.swatch }}
                    />
                    <span className="truncate">
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
