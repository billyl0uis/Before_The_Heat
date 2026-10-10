import { useEffect, useState } from 'react'
import { findColorant } from '../../engine/murrini/rod'
import { Icon } from '../icons'
import { StepPlate } from './StepPlate'

const STEP_KEY = 'before-the-heat:checklist'

function readStep(signature) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STEP_KEY) ?? 'null')
    return saved?.signature === signature ? saved.step : 0
  } catch {
    return 0
  }
}

// One step at a time, big enough to read at arm's length in the shop.
// The current step survives a reload (mobile browsers evict background
// tabs), and the screen is asked to stay awake while this is open.
export function ShopChecklist({ design, steps, warnings = [] }) {
  const signature = steps.map((step) => step.title).join('|')
  const [step, setStep] = useState(() => readStep(signature))
  const [awake, setAwake] = useState('unknown')
  const current = Math.min(step, steps.length - 1)
  const done = step >= steps.length


  useEffect(() => {
    try {
      window.localStorage.setItem(STEP_KEY, JSON.stringify({ signature, step }))
    } catch {
      // Storage blocked: the checklist still works, it just won't resume.
    }
  }, [signature, step])

  useEffect(() => {
    let lock = null
    let cancelled = false
    const request = async () => {
      try {
        if (!('wakeLock' in navigator)) return setAwake('unsupported')
        lock = await navigator.wakeLock.request('screen')
        if (cancelled) lock.release()
        else setAwake('on')
      } catch {
        setAwake('unsupported')
      }
    }
    request()
    const onVisible = () => document.visibilityState === 'visible' && request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [])

  const item = steps[current]

  return (
    <section
      aria-label="Shop checklist"
      className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-panel shadow-[0_0_0_1px_var(--line),0_30px_70px_rgb(0_0_0/0.45)]"
    >
      <div className="flex gap-1 px-5 pt-5" aria-hidden="true">
        {steps.map((s, i) => (
          <span
            key={s.key}
            className={`h-1 flex-1 rounded-full ${i < step ? 'bg-accent' : i === current && !done ? 'bg-accent-2' : 'bg-line'}`}
          />
        ))}
      </div>

      {done ? (
        <div className="flex flex-col items-start gap-3 px-6 py-8">
          <p className="text-6xl leading-none font-extrabold tracking-tight text-accent">Done</p>
          <p className="text-lg text-mute">Slice the cane and check a piece against the plan.</p>
          <div className="mt-2 flex flex-col gap-2 rounded-xl bg-raise p-4 text-sm leading-relaxed">
            <p className="font-bold">Before you slice the whole cane</p>
            {warnings.length ? (
              warnings.map((warning) => (
                <p key={warning.id}>
                  <span className="font-semibold">{warning.title}.</span> {warning.body}
                </p>
              ))
            ) : (
              <p>Nothing flagged in the documented colorant properties. Still pull a test strip first: this plan doesn't assume a COE.</p>
            )}
          </div>
          <button type="button" onClick={() => setStep(0)} className="mt-2 rounded-lg bg-raise px-4 py-2.5 font-semibold">
            Start again
          </button>
        </div>
      ) : (
        <div className="px-6 pt-6 pb-4">
          <p className="flex items-baseline gap-2 text-accent" aria-live="polite">
            <span className="text-[4.5rem] leading-none font-extrabold tracking-tight">{current + 1}</span>
            <span className="text-xl font-semibold text-mute">of {steps.length}</span>
          </p>
          <h3 className="mt-3 text-[1.6rem] leading-tight font-bold tracking-tight text-balance">{item.title}</h3>
          <p className="mt-2 text-[1.05rem] leading-relaxed text-mute">{item.detail}</p>
          {item.colorantIds.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {item.colorantIds.map((id) => (
                <li key={id} className="flex items-center gap-2 rounded-full bg-raise py-1 pr-3 pl-1 text-sm">
                  <span
                    className="h-5 w-5 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3)]"
                    style={{ background: findColorant(id)?.swatch }}
                  />
                  {findColorant(id)?.name}
                </li>
              ))}
            </ul>
          )}
          <StepPlate plate={item.plate} design={design} size={112} className="mx-auto mt-5" />
        </div>
      )}

      {!done && (
        <div className="grid grid-cols-[1fr_2fr] gap-2 px-5 pb-4">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setStep(current - 1)}
            className="rounded-xl bg-raise py-4 text-lg font-semibold disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep(current + 1)}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent py-4 text-lg font-bold text-accent-ink"
          >
            {current === steps.length - 1 ? 'Finish' : 'Done, next'} <Icon name="arrowRight" size={20} />
          </button>
        </div>
      )}
      <p className="flex items-center gap-2 px-5 pb-5 text-sm text-mute">
        <Icon name="sun" size={16} />
        {awake === 'on' ? 'Screen stays on while this is open' : "This browser can't keep the screen on"}
      </p>
    </section>
  )
}
