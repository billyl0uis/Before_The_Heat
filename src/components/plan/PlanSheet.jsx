import { useMemo } from 'react'
import { findColorant, pulledDiameterMm, pulledLengthMm } from '../../engine/murrini/rod'
import { turnsLabel } from '../../engine/murrini/shopPlan'
import { renderSlicePlate } from '../../engine/murrini/slicePlate'
import { Icon } from '../icons'
import { StepPlate } from './StepPlate'

const fmt = (value) => value.toLocaleString('en', { maximumFractionDigits: 1 })
const PAPER_CLEAR_BACKDROP = '#3a3d45'

export function ColorantDots({ ids, size = 14 }) {
  if (!ids.length) return null
  return (
    <span className="flex -space-x-1">
      {ids.map((id) => (
        <span
          key={id}
          title={findColorant(id)?.name}
          className="rounded-full shadow-[0_0_0_1.5px_#fbfbf8,inset_0_0_0_1px_rgb(0_0_0/0.2)]"
          style={{ width: size, height: size, background: findColorant(id)?.swatch }}
        />
      ))}
    </span>
  )
}

// The printable shop plan: paper-white, Primary-navy ink, one page.
export function PlanSheet({ design, steps, warnings, colorants }) {
  const { rod, casing } = design
  const plate = useMemo(
    () =>
      renderSlicePlate({
        elements: design.repeatedElements,
        rod,
        casing,
        backdrop: PAPER_CLEAR_BACKDROP,
        size: 640,
      }).toDataURL('image/png'),
    [design.repeatedElements, rod, casing],
  )
  const today = new Date().toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <article className="mx-auto grid w-full max-w-[860px] gap-x-10 gap-y-7 rounded bg-[#fbfbf8] px-6 py-8 text-[#0b0e2e] shadow-[0_30px_80px_rgb(0_0_0/0.5),0_2px_6px_rgb(0_0_0/0.3)] sm:px-12 sm:py-11 md:grid-cols-[17rem_1fr] print:max-w-none print:px-0 print:py-0 print:shadow-none">
      <header className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#0b0e2e] pb-3 md:col-span-2">
        <h2 className="text-[1.6rem] leading-none font-extrabold tracking-tight">Shop plan</h2>
        <p className="text-sm text-[#454a72]">Before The Heat · {today}</p>
      </header>

      <div className="flex flex-col gap-5">
        <img
          src={plate}
          alt={`Cross-section at true scale: ${rod.gatherDiameterMm} mm gather with ${casing.length} casing layer${casing.length === 1 ? '' : 's'}`}
          className="aspect-square w-full max-w-72 self-center"
        />
        <p className="-mt-3 text-xs leading-snug text-[#454a72]">
          Drawn at true scale. Clear glass, in the core and in any clear casing, is shaded dark grey
          so opal and white canes stay visible on paper.
        </p>
        <section>
          <h3 className="mb-2 text-xs font-bold tracking-[0.08em] text-[#454a72] uppercase">Pull</h3>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 font-mono text-base font-semibold">
            <p>
              Ø {rod.gatherDiameterMm} mm
              <span className="block font-sans text-xs font-normal text-[#454a72]">{rod.gatherLengthMm} mm gather</span>
            </p>
            <Icon name="arrowRight" size={18} className="text-[#1430d8]" />
            <p>
              Ø {fmt(pulledDiameterMm(rod))} mm
              <span className="block font-sans text-xs font-normal text-[#454a72]">
                ≈ {fmt(pulledLengthMm(rod) / 1000)} m at {rod.pullRatio} : 1
              </span>
            </p>
          </div>
          {design.extrusion?.twistDegrees ? (
            <p className="mt-2 text-sm">
              <span className="font-semibold">Twist:</span> {turnsLabel(design.extrusion.twistDegrees)}, the
              same way throughout the pull
            </p>
          ) : null}
        </section>
        <section>
          <h3 className="mb-2 text-xs font-bold tracking-[0.08em] text-[#454a72] uppercase">Casing, inside to out</h3>
          {casing.length ? (
            <table className="w-full text-sm">
              <tbody>
                {casing.map((layer, index) => (
                  <tr key={index} className="border-b border-[#d9dae6]">
                    <td className="py-1.5">
                      <span
                        className="mr-2 inline-block h-3.5 w-5 rounded-sm align-[-2px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)]"
                        style={{
                          background:
                            layer.colorantId === 'clear'
                              ? `linear-gradient(rgb(207 220 216 / 0.28), rgb(207 220 216 / 0.28)), ${PAPER_CLEAR_BACKDROP}`
                              : findColorant(layer.colorantId)?.swatch,
                        }}
                      />
                      {index + 1}. {findColorant(layer.colorantId)?.name}
                    </td>
                    <td className="py-1.5 text-right font-mono">{fmt(layer.thicknessMm)} mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-[#454a72]">No casing.</p>
          )}
        </section>
      </div>

      <section>
        <h3 className="mb-1 text-xs font-bold tracking-[0.08em] text-[#454a72] uppercase">Build order</h3>
        <ol>
          {steps.map((step, index) => (
            <li
              key={step.key}
              className="grid grid-cols-[1.5rem_3rem_1fr_auto] items-start gap-3 border-b border-[#d9dae6] py-2.5 break-inside-avoid"
            >
              <span className="pt-0.5 text-sm font-bold text-[#1430d8]">{index + 1}</span>
              <StepPlate plate={step.plate} design={design} size={48} />
              <div>
                <p className="font-semibold text-balance">{step.title}</p>
                <p className="text-sm leading-snug text-[#454a72]">{step.detail}</p>
              </div>
              <ColorantDots ids={step.colorantIds} />
            </li>
          ))}
        </ol>
      </section>
      <section className="grid gap-6 border-t-2 border-[#0b0e2e] pt-4 text-sm leading-relaxed md:col-span-2 md:grid-cols-2">
        <div>
          <p className="font-bold text-[#1f6b3a]">Colors used</p>
          <p>
            {colorants.map((colorant) => colorant.name).join(', ') || 'None yet'}. This plan doesn't assume
            a COE: use rods from one compatible system and pull a test strip first.
          </p>
        </div>
        <div>
          <p className="font-bold text-[#b3261e]">Watch for</p>
          {warnings.length ? (
            <ul className="flex flex-col gap-1">
              {warnings.map((warning) => (
                <li key={warning.id}>
                  <span className="font-semibold">{warning.title}.</span> {warning.body}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nothing flagged in the documented colorant properties.</p>
          )}
        </div>
      </section>
    </article>
  )
}
