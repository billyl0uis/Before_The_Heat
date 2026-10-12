import { useMemo } from 'react'
import { findColorant, pulledDiameterMm, pulledLengthMm } from '../../engine/murrini/rod'
import { innerCasingOf, twistLabel } from '../../engine/murrini/shopPlan'
import { renderSlicePlate } from '../../engine/murrini/slicePlate'
import { Icon } from '../icons'
import { StepPlate } from './StepPlate'

const fmt = (value) => value.toLocaleString('en', { maximumFractionDigits: 1 })
const PAPER_CLEAR_BACKDROP = '#3a3d45'

// A casing layer's swatch on paper: clear is tinted over the dark backdrop
// so it reads as glass rather than as blank paper.
const layerSwatch = (colorantId) =>
  colorantId === 'clear'
    ? `linear-gradient(rgb(207 220 216 / 0.28), rgb(207 220 216 / 0.28)), ${PAPER_CLEAR_BACKDROP}`
    : findColorant(colorantId)?.swatch

export function ColorantDots({ ids, size = 14 }) {
  if (!ids.length) return null
  return (
    <span className="flex -space-x-1" role="list" aria-label="Colors in this step">
      {ids.map((id) => (
        <span
          key={id}
          role="listitem"
          aria-label={findColorant(id)?.name}
          title={findColorant(id)?.name}
          className="rounded-full shadow-[0_0_0_1.5px_#fbfbf8,inset_0_0_0_1px_rgb(0_0_0/0.2)]"
          style={{ width: size, height: size, background: findColorant(id)?.swatch }}
        />
      ))}
    </span>
  )
}

// The sheet's left column for a reticello vessel: the piece and the two
// sets of rib canes, in place of the cane's slice, pull and casing.
function ReticelloSide({ reticello, design }) {
  const { perSide, ribMm, twist, names, colorantIds, wall, form } = reticello
  return (
    <div className="flex flex-col gap-5">
      <StepPlate
        plate={reticello.step.plate}
        design={design}
        size={240}
        className="self-center"
      />
      <section>
        <h3 className="mb-2 text-xs font-bold tracking-[0.08em] text-[#454a72] uppercase">Rib canes</h3>
        <table className="w-full text-sm">
          <tbody>
            {names.map((name, index) => (
              <tr key={name + index} className="border-b border-[#d9dae6]">
                <td className="py-1.5">
                  <span
                    className="mr-2 inline-block h-3.5 w-5 rounded-sm align-[-2px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)]"
                    style={{ background: findColorant(colorantIds[index])?.swatch }}
                  />
                  {perSide} {name}, Ø {fmt(ribMm)} mm
                </td>
                <td className="py-1.5 text-right">{twist}, {index === 0 ? 'one way' : 'the other way'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3 className="mb-2 text-xs font-bold tracking-[0.08em] text-[#454a72] uppercase">Finished piece</h3>
        <p className="font-mono text-base font-semibold">
          {fmt(wall.height)} mm tall · Ø {fmt(wall.rimRadius * 2)} mm rim
        </p>
        <p className="text-xs text-[#454a72]">Blown out to {form}.</p>
      </section>
    </div>
  )
}

// Hand-placed slices on the wall unrolled flat, base at the bottom, so
// they can be laid out on the kiln shelf the same way. Drawn in mm: the
// front of the piece (the side facing you in the Vessel view) is the
// centre line, so a design laid on the front stays in one piece, and the
// seam where the patch closes is at both edges, round the back.
const GRID_MM = 10

function PlacementMap({ map, sliceDiameterMm }) {
  const w = map.widthMm
  const h = map.heightMm
  // Room round the drawing for its labels, in the same mm units.
  const pad = { top: 9, side: 4, bottom: 15 }
  const vw = w + pad.side * 2
  const vh = h + pad.top + pad.bottom
  const label = { fontSize: 5, fill: '#454a72', fontFamily: 'Hanken Grotesk, ui-sans-serif, sans-serif' }
  const scaleMm = w >= 150 ? 50 : 20
  const lines = []
  for (let x = GRID_MM; x < w; x += GRID_MM) lines.push(<line key={`x${x}`} x1={x} y1={0} x2={x} y2={h} />)
  for (let y = GRID_MM; y < h; y += GRID_MM) lines.push(<line key={`y${y}`} x1={0} y1={h - y} x2={w} y2={h - y} />)

  return (
    <section className="md:col-span-2 break-inside-avoid">
      <h3 className="mb-2 text-xs font-bold tracking-[0.08em] text-[#454a72] uppercase">Placement map</h3>
      <svg
        viewBox={`${-pad.side} ${-pad.top} ${vw} ${vh}`}
        className="max-h-[22rem] w-full max-w-2xl"
        role="img"
        aria-label={`${map.placements.length} slices on the vessel wall, unrolled flat: ${Math.round(w)} by ${Math.round(h)} mm, front in the middle, seam at both edges, base at the bottom, ${GRID_MM} mm grid.`}
      >
        <rect x={0} y={0} width={w} height={h} fill="none" stroke="#454a72" strokeWidth={0.5} />
        <g stroke="#d9dae6" strokeWidth={0.3}>{lines}</g>
        <line x1={w / 2} y1={0} x2={w / 2} y2={h} stroke="#454a72" strokeWidth={0.4} strokeDasharray="2 1.5" />
        {map.placements.map((p, i) => (
          <circle
            key={i}
            cx={(((p.u + 0.5) % 1) + 1) % 1 * w}
            cy={(1 - p.v) * h}
            r={sliceDiameterMm / 2}
            fill="#1430d8"
          />
        ))}
        <text x={w / 2} y={-3} textAnchor="middle" {...label}>Rim · front</text>
        <text x={0} y={-3} {...label}>Seam</text>
        <text x={w} y={-3} textAnchor="end" {...label}>Seam</text>
        <text x={w / 2} y={h + 6} textAnchor="middle" {...label}>Base</text>
        <g transform={`translate(0 ${h + 9})`}>
          <line x1={0} y1={0} x2={scaleMm} y2={0} stroke="#0b0e2e" strokeWidth={0.6} />
          <line x1={0} y1={-1.2} x2={0} y2={1.2} stroke="#0b0e2e" strokeWidth={0.6} />
          <line x1={scaleMm} y1={-1.2} x2={scaleMm} y2={1.2} stroke="#0b0e2e" strokeWidth={0.6} />
          <text x={scaleMm + 2} y={1.7} {...label} fill="#0b0e2e">{scaleMm} mm</text>
        </g>
      </svg>
      <p className="mt-1 text-xs text-[#454a72]">
        The wall unrolled, about {Math.round(w)} × {Math.round(h)} mm, on a {GRID_MM} mm grid. Lay the patch out the
        same way: its two ends meet at the seam, round the back.
      </p>
    </section>
  )
}

// The printable shop plan: paper-white, Primary-navy ink, one page.
export function PlanSheet({ design, steps, warnings, colorants, reticello = null, pickup = null, title = 'Shop plan' }) {
  const { rod, casing } = design
  const inner = innerCasingOf(design.elements, rod)
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
        <h2 className="text-[1.6rem] leading-none font-extrabold tracking-tight">{title}</h2>
        <p className="text-sm text-[#454a72]">Shop plan · Before The Heat · {today}</p>
      </header>

      {reticello ? (
        <ReticelloSide reticello={reticello} design={design} />
      ) : (
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
              <span className="font-semibold">Twist:</span> {twistLabel(rod, design.extrusion.twistDegrees)} of pulled cane, the
              same way throughout the pull
            </p>
          ) : null}
        </section>
        <section>
          <h3 className="mb-2 text-xs font-bold tracking-[0.08em] text-[#454a72] uppercase">Casing, inside to out</h3>
          {casing.length || inner ? (
            <table className="w-full text-sm">
              <tbody>
                {/* A zanfirico's own casing goes on first, round the threads. */}
                {inner && (
                  <tr className="border-b border-[#d9dae6]">
                    <td className="py-1.5">
                      <span
                        className="mr-2 inline-block h-3.5 w-5 rounded-sm align-[-2px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)]"
                        style={{ background: layerSwatch(inner.colorantId) }}
                      />
                      1. {inner.name}, round the threads
                    </td>
                    <td className="py-1.5 text-right font-mono">to Ø {fmt(inner.diameterMm)} mm</td>
                  </tr>
                )}
                {casing.map((layer, index) => (
                  <tr key={index} className="border-b border-[#d9dae6]">
                    <td className="py-1.5">
                      <span
                        className="mr-2 inline-block h-3.5 w-5 rounded-sm align-[-2px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)]"
                        style={{ background: layerSwatch(layer.colorantId) }}
                      />
                      {index + 1 + (inner ? 1 : 0)}. {findColorant(layer.colorantId)?.name}
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
      )}

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
      {pickup?.map && <PlacementMap map={pickup.map} sliceDiameterMm={pickup.sliceDiameterMm} />}
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
      <section className="md:col-span-2 break-inside-avoid">
        <h3 className="mb-1 text-xs font-bold tracking-[0.08em] text-[#454a72] uppercase">Notes</h3>
        {/* Ruled lines to write on at the bench. */}
        {[0, 1, 2, 3].map((line) => (
          <div key={line} className="h-8 border-b border-[#d9dae6]" />
        ))}
      </section>
    </article>
  )
}
