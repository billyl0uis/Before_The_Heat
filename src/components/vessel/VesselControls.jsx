import { VESSEL_FORM_PRESETS } from '../../engine/vessel/profile'

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

// Optic ribs: radius varies by angle as well as height, which a lathe
// can't produce (see engine/vessel/profile.js) -- ribTwist=0 is straight
// vertical ribs (a real "optic mold" vessel), nonzero spirals them, the
// classic "barley twist" look. VirtualGlass's own blown-piece model
// (Piece, piece.h) has a twist_ field for exactly this, distinct from its
// Cane class's twist -- confirmed real, not invented for this app.
const RIB_CONTROLS = [
  { key: 'ribAmplitude', label: 'Rib depth', min: 0, max: 12, step: 0.5 },
  { key: 'ribCount', label: 'Rib count', min: 3, max: 24, step: 1 },
  { key: 'ribTwist', label: 'Twist (degrees)', min: -720, max: 720, step: 15 },
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
  onApplyPreset,
  onReset,
  freeform,
  onEnterFreeform,
  onExitFreeform,
}) {
  return (
    <div className="flex w-64 flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex flex-col gap-2">
        <p className="text-base text-neutral-300">Vessel Form</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(VESSEL_FORM_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => onApplyPreset(preset.params)}
              className="rounded bg-neutral-800 px-3 py-1.5 text-base text-neutral-300 hover:bg-neutral-700"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-neutral-500">
          Standard vessel archetypes, also cataloged by name in glass-cane
          design software (VirtualGlass) — a starting point for the sliders
          below, not a locked shape.
        </p>
      </div>

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

      <h2 className="mt-2 text-base font-medium text-neutral-100">Optic Ribs</h2>
      <div className="flex flex-col gap-4">
        {RIB_CONTROLS.map((control) => (
          <ControlSlider
            key={control.key}
            control={control}
            value={params[control.key]}
            onChange={onParamChange}
          />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-neutral-500">
        Works in both Parametric and Free-form — a real vessel-wall
        technique (angle-dependent radius), not a texture trick, so it
        applies on top of whatever silhouette is active.
      </p>

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
