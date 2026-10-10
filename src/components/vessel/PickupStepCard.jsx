import { StepPlate } from '../plan/StepPlate'

// The pick-up step exactly as it prints in the plan, on paper.
export function PickupStepCard({ pickup, design, emptyMessage }) {
  return (
    <div className="rounded-md bg-[#fbfbf8] px-4 pt-4 pb-3.5 text-[#0b0e2e] shadow-[0_10px_30px_-12px_rgb(0_0_0/0.65)]">
      {pickup ? (
        <>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <p className="mb-1 font-mono text-[0.8rem] text-[#454a72]">{pickup.step.after}</p>
              <h3 className="text-base leading-snug font-bold tracking-tight text-balance">{pickup.step.title}</h3>
            </div>
            <StepPlate plate={pickup.step.plate} design={design} size={48} />
          </div>
          <ol className="mt-2.5 list-decimal pl-[1.1rem] text-[0.8rem] leading-relaxed marker:font-mono marker:text-[#1430d8]">
            {pickup.step.lines.map((line) => (
              <li key={line} className="not-first:mt-1.5">
                {line}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="text-[0.8rem] text-[#454a72]">{emptyMessage}</p>
      )}
    </div>
  )
}
