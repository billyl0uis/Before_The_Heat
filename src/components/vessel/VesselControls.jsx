const PROFILE_CONTROLS = [
  { key: 'height', label: 'Height', min: 80, max: 320, step: 5 },
  { key: 'baseRadius', label: 'Base radius', min: 5, max: 100, step: 1 },
  { key: 'topRadius', label: 'Rim radius', min: 5, max: 100, step: 1 },
  { key: 'bulge', label: 'Bulge (belly / waist)', min: -60, max: 60, step: 1 },
  { key: 'sphereBlend', label: 'Sphere blend', min: 0, max: 1, step: 0.05 },
]

const WAVE_CONTROLS = [
  { key: 'waveAmplitude', label: 'Ripple depth', min: 0, max: 15, step: 0.5 },
  { key: 'waveFrequency', label: 'Ripple count', min: 0, max: 24, step: 1 },
]

function ControlSlider({ control, value, onChange }) {
  return (
    <label className="flex flex-col gap-1 text-base text-neutral-300">
      {control.label}: {value}
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        onChange={(event) => onChange(control.key, Number(event.target.value))}
      />
    </label>
  )
}

export function VesselControls({
  params,
  onParamChange,
  onReset,
  freeform,
  onEnterFreeform,
  onExitFreeform,
}) {
  return (
    <div className="flex w-64 flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onExitFreeform}
          className={`flex-1 rounded px-3 py-1.5 text-base transition-colors ${
            !freeform
              ? 'bg-purple-500 text-white'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          Parametric
        </button>
        <button
          type="button"
          onClick={onEnterFreeform}
          className={`flex-1 rounded px-3 py-1.5 text-base transition-colors ${
            freeform
              ? 'bg-purple-500 text-white'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          Free-form
        </button>
      </div>

      <h2 className="text-base font-medium text-neutral-100">Vessel Profile</h2>
      <fieldset disabled={freeform} className="flex flex-col gap-4 disabled:opacity-40">
        {PROFILE_CONTROLS.map((control) => (
          <ControlSlider
            key={control.key}
            control={control}
            value={params[control.key]}
            onChange={onParamChange}
          />
        ))}

        <h2 className="mt-2 text-base font-medium text-neutral-100">Surface Ripple</h2>
        {WAVE_CONTROLS.map((control) => (
          <ControlSlider
            key={control.key}
            control={control}
            value={params[control.key]}
            onChange={onParamChange}
          />
        ))}
      </fieldset>

      {freeform && (
        <p className="text-base leading-relaxed text-neutral-400">
          Drag the points on the silhouette to reshape the wall by hand.
          Switch back to Parametric to use these sliders again.
        </p>
      )}

      <button
        type="button"
        onClick={onReset}
        className="rounded bg-neutral-800 px-3 py-1.5 text-base text-neutral-300 hover:bg-neutral-700"
      >
        Reset shape
      </button>
    </div>
  )
}
