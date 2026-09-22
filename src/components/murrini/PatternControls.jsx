const REPEAT_TYPES = ['none', 'grid', 'radial']

export function PatternControls({ pattern, onChange }) {
  const setField = (key, value) => onChange({ ...pattern, [key]: value })

  return (
    <div className="flex w-64 flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-base font-medium text-neutral-100">Pattern Repeat</h2>

      <div className="flex gap-2">
        {REPEAT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setField('repeatType', type)}
            className={`rounded px-3 py-1.5 text-base capitalize transition-colors ${
              type === pattern.repeatType
                ? 'bg-purple-500 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {pattern.repeatType === 'grid' && (
        <>
          <label className="flex flex-col gap-1 text-base text-neutral-300">
            Rows: {pattern.rows}
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={pattern.rows}
              onChange={(event) => setField('rows', Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-base text-neutral-300">
            Columns: {pattern.columns}
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={pattern.columns}
              onChange={(event) => setField('columns', Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-base text-neutral-300">
            Spacing X: {pattern.spacingX}
            <input
              type="range"
              min={20}
              max={150}
              step={5}
              value={pattern.spacingX}
              onChange={(event) => setField('spacingX', Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-base text-neutral-300">
            Spacing Y: {pattern.spacingY}
            <input
              type="range"
              min={20}
              max={150}
              step={5}
              value={pattern.spacingY}
              onChange={(event) => setField('spacingY', Number(event.target.value))}
            />
          </label>
        </>
      )}

      {pattern.repeatType === 'radial' && (
        <label className="flex flex-col gap-1 text-base text-neutral-300">
          Repeats: {pattern.radialCount}
          <input
            type="range"
            min={2}
            max={16}
            step={1}
            value={pattern.radialCount}
            onChange={(event) => setField('radialCount', Number(event.target.value))}
          />
        </label>
      )}
    </div>
  )
}
