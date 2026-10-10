import { useId } from 'react'
import { ribTwistLabel } from '../../engine/vessel/pickup'
import { computeProfileRadius, VESSEL_FORM_PRESETS } from '../../engine/vessel/profile'
import { ProfileCurveEditor } from './ProfileCurveEditor'
import { RangeField, Segmented } from './controls'

const fmt = (value, digits = 0) => value.toLocaleString('en', { maximumFractionDigits: digits })
const mm = (value) => `${fmt(value)} mm`
// Stored as radii (what the geometry uses); shown as diameters, which is
// what you measure a piece by.
const dia = (value) => `Ø ${fmt(value * 2)} mm`

const SHAPE_FIELDS = [
  { key: 'baseRadius', label: 'Base', min: 4, max: 100, step: 1, show: dia },
  { key: 'topRadius', label: 'Rim', min: 5, max: 100, step: 1, show: dia },
  {
    key: 'bulge',
    label: 'Belly or waist',
    min: -60,
    max: 60,
    step: 1,
    show: (v) => (v === 0 ? 'Straight' : `${v > 0 ? '+' : '−'}${fmt(Math.abs(v * 2))} mm Ø`),
  },
  { key: 'sphereBlend', label: 'Roundness', min: 0, max: 1, step: 0.05, show: (v) => `${fmt(v * 100)}%` },
]

const RIPPLE_FIELDS = [
  { key: 'waveAmplitude', label: 'Ripple depth', min: 0, max: 15, step: 0.5, show: (v) => (v ? `${fmt(v, 1)} mm` : 'None') },
  { key: 'waveFrequency', label: 'Ripples, base to rim', min: 1, max: 24, step: 1, show: (v) => fmt(v) },
]

const RIB_FIELDS = [
  { key: 'ribAmplitude', label: 'Optic rib depth', min: 0, max: 12, step: 0.5, show: (v) => (v ? `${fmt(v, 1)} mm` : 'None') },
  { key: 'ribCount', label: 'Ribs around', min: 3, max: 24, step: 1, show: (v) => fmt(v) },
  { key: 'ribTwist', label: 'Rib twist', min: -720, max: 720, step: 90, show: ribTwistLabel },
]

// Each preset's real outline, drawn from the same maths as the vessel.
function Silhouette({ params }) {
  const size = 38
  const pad = 3
  const radii = Array.from({ length: 25 }, (_, j) => computeProfileRadius(params, j / 24))
  const maxR = Math.max(...radii, params.height * 0.5)
  const sx = (size / 2 - pad) / maxR
  const sy = (size - pad * 2) / params.height
  const right = radii.map((r, j) => [size / 2 + r * sx, size - pad - (j / 24) * params.height * sy])
  const left = right.map(([x, y]) => [size - x, y]).reverse()
  const d = `M${[...left, ...right].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')} Z`
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-[38px] w-[38px]" aria-hidden="true">
      <path d={d} strokeWidth="1.4" className="fill-line stroke-ink-soft group-aria-pressed:fill-accent/20 group-aria-pressed:stroke-accent" />
    </svg>
  )
}

export function VesselControls({ vessel, setParam, applyPreset, enterFreeform, exitFreeform, setControlRadius }) {
  const { params, freeform, presetKey } = vessel
  const moreId = useId()
  const field = (control, disabled = false) => (
    <RangeField
      key={control.key}
      label={control.label}
      value={params[control.key]}
      display={control.show(params[control.key])}
      min={control.min}
      max={control.max}
      step={control.step}
      disabled={disabled}
      onChange={(value) => setParam(control.key, value)}
    />
  )

  return (
    <>
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Starting forms">
        {Object.entries(VESSEL_FORM_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            aria-pressed={!freeform && presetKey === key}
            onClick={() => applyPreset(key)}
            className="group flex flex-col items-center gap-1 rounded-[10px] border-[1.5px] border-transparent bg-raise px-0.5 pt-2 pb-1.5 text-[0.8rem] font-semibold text-mute transition-colors hover:text-ink aria-pressed:border-accent aria-pressed:text-ink"
          >
            <Silhouette params={{ ...params, ...preset.params, waveAmplitude: 0 }} />
            {preset.label}
          </button>
        ))}
      </div>

      <Segmented
        label="How to shape it"
        className="mt-3"
        value={freeform ? 'draw' : 'sliders'}
        onChange={(value) => (value === 'draw' ? enterFreeform() : exitFreeform())}
        options={[
          { value: 'sliders', label: 'Sliders' },
          { value: 'draw', label: 'Draw the outline' },
        ]}
      />

      {freeform && (
        <div className="mt-3.5 flex items-start gap-3.5">
          <ProfileCurveEditor controlRadii={vessel.controlRadii} onChangeRadius={setControlRadius} />
          <p className="text-[0.8rem] leading-relaxed text-mute">
            Drag the points to change the width at each height. Height stays on its slider.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3.5">
        {field({ key: 'height', label: 'Height', min: 20, max: 320, step: 5, show: mm })}
        {SHAPE_FIELDS.map((control) => field(control, freeform))}
      </div>

      <details className="group/more mt-[18px] rounded-[10px] bg-raise">
        <summary
          id={moreId}
          className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 font-semibold text-ink-soft [&::-webkit-details-marker]:hidden"
        >
          Ripples and optic ribs
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="transition-transform duration-200 group-open/more:rotate-180">
            <path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <div className="flex flex-col gap-3.5 px-3 pt-1 pb-3.5">
          {RIPPLE_FIELDS.map((control) => field(control, freeform))}
          {freeform && <p className="-mt-1 text-[0.8rem] text-mute">Ripples follow the sliders, not a drawn outline.</p>}
          {RIB_FIELDS.map((control) => field(control))}
        </div>
      </details>
    </>
  )
}
