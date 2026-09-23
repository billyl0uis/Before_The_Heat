const CONTROLS = [
  { key: 'length', label: 'Length', min: 20, max: 400, step: 10 },
  { key: 'twistDegrees', label: 'Twist', min: -720, max: 720, step: 10 },
  { key: 'taper', label: 'Taper (%)', min: 0, max: 90, step: 5 },
]

export function ExtrusionControls({ extrusion, onChange }) {
  const setField = (key, value) => onChange({ ...extrusion, [key]: value })

  return (
    <div className="flex w-64 flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-base font-medium text-neutral-100">Rod Extrusion</h2>
      {CONTROLS.map((control) => (
        <label
          key={control.key}
          className="flex flex-col gap-1 text-base text-neutral-300"
        >
          {control.label}: {extrusion[control.key]}
          <input
            type="range"
            min={control.min}
            max={control.max}
            step={control.step}
            value={extrusion[control.key]}
            onChange={(event) => setField(control.key, Number(event.target.value))}
          />
        </label>
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setField('sideways', false)}
          className={`flex-1 rounded px-3 py-1.5 text-base transition-colors ${
            !extrusion.sideways
              ? 'bg-purple-500 text-white'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          Lengthwise
        </button>
        <button
          type="button"
          onClick={() => setField('sideways', true)}
          className={`flex-1 rounded px-3 py-1.5 text-base transition-colors ${
            extrusion.sideways
              ? 'bg-purple-500 text-white'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          Sideways
        </button>
      </div>
      <p className="text-base leading-relaxed text-neutral-400">
        Twist spirals the whole bundle around its center as it's pulled —
        a helix along the rod's length, only visible from the side. It
        only shows up on shapes placed off-center — a single shape
        sitting dead-center in the pattern has nothing off-axis to
        spiral, so twisting it looks like nothing happened. Try the
        Zanfirico tool in the pattern toolbar for a ready-made off-center
        setup (it's the real technique this twist reproduces). This is
        different from the Spiral shape, which builds a jellyroll-style
        spiral into the cross-section itself instead. Taper narrows the
        rod toward the far end. Sideways flips the pulled rod 90° to run
        across the view instead of away from it.
      </p>
    </div>
  )
}
