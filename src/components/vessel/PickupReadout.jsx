import { metres, SAW_KERF_MM } from '../../engine/vessel/pickup'

const fmt = (value, digits = 1) => value.toLocaleString('en', { maximumFractionDigits: digits })
const Num = ({ children }) => <b className="font-mono text-[1.05em] font-semibold text-ink">{children}</b>

// The answer the page exists for: how many slices, how much cane, how many
// pulls. Sits under the vessel so it changes as you shape it.
export function PickupReadout({ vessel, pickup, hasDesign }) {
  let sentence
  if (vessel.pattern === 'reticello') {
    sentence = (
      <>
        Reticello, <Num>{vessel.ribsAround / 2}</Num> rib canes each way, twisted in opposite directions. It goes in
        your plan as its own step.
      </>
    )
  } else if (vessel.pattern !== 'murrini') {
    sentence = hasDesign
      ? 'Plain glass. Choose Murrini to see how many slices of your cane this form takes.'
      : 'Plain glass. Make a cane in the Murrini tab, then choose Murrini here to see how many slices this form takes.'
  } else if (!pickup) {
    sentence = hasDesign
      ? 'Tap the vessel to place a slice. Each one is drawn at its real size.'
      : 'Make a cane in the Murrini tab first: its slice is what goes on here.'
  } else {
    const { count, totals, byHand, sliceDiameterMm, pullLengthMm } = pickup
    sentence = (
      <>
        {byHand ? '' : 'Up to '}
        <Num>{count.toLocaleString('en')}</Num> slices of your Ø {fmt(sliceDiameterMm)} mm cane, {fmt(vessel.thicknessMm)} mm
        thick. That’s <Num>{metres(totals.caneMm)} m</Num> of cane:{' '}
        <Num>
          {totals.pulls} {totals.pulls === 1 ? 'pull' : 'pulls'}
        </Num>{' '}
        of {metres(pullLengthMm)} m.
      </>
    )
  }

  const pulls = pickup && pickup.totals.pulls <= 16 ? pickup.totals.pulls : 0
  return (
    <div className="border-t border-line bg-panel px-4 pt-2.5 pb-3 lg:px-6 lg:pt-4 lg:pb-[18px]" aria-live="polite">
      <p className="max-w-[44rem] text-sm leading-normal text-pretty text-ink-soft lg:text-base">{sentence}</p>
      {pulls > 0 && (
        <>
          <div className="mt-2 flex max-w-[44rem] gap-1 lg:mt-3" aria-hidden="true">
            {Array.from({ length: pulls }, (_, i) => {
              const used = Math.min(1, (pickup.totals.caneMm - i * pickup.pullLengthMm) / pickup.pullLengthMm)
              return (
                <span key={i} className="relative h-[7px] flex-1 overflow-hidden rounded-[3px] bg-raise lg:h-2.5">
                  <i
                    className="absolute inset-y-0 left-0 rounded-[3px] bg-accent transition-[width] duration-400 ease-[cubic-bezier(.16,1,.3,1)]"
                    style={{ width: `${used * 100}%` }}
                  />
                </span>
              )
            })}
          </div>
          <p className="mt-1.5 flex max-w-[44rem] justify-between gap-3 font-mono text-[0.8rem] text-faint max-lg:hidden">
            <span>each bar is one {metres(pickup.pullLengthMm)} m pull</span>
            <span>{metres(pickup.totals.spareMm)} m spare</span>
          </p>
        </>
      )}
      {pickup && !pickup.byHand && (
        <p className="mt-2 max-w-[44rem] text-[0.8rem] text-faint max-lg:hidden">
          “Up to”, because blowing out after the pick-up stretches the slices, so the real piece takes fewer. Counted
          with {SAW_KERF_MM} mm lost per saw cut.
        </p>
      )}
    </div>
  )
}
