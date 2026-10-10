import { DEFAULT_PATTERN } from '../../engine/murrini/pattern'

const REPEAT_TYPES = ['none', 'grid', 'radial']

export function PatternControls({ pattern, onChange }) {
  const setField = (key, value) => onChange({ ...pattern, [key]: value })

  // Switching on a repeat whose count still says "1" (older designs, or a
  // grid left at 1 × 1) jumps to a count that visibly repeats something.
  const chooseRepeat = (type) => {
    const next = { ...pattern, repeatType: type }
    if (type === 'radial' && pattern.radialCount < 2) next.radialCount = DEFAULT_PATTERN.radialCount
    if (type === 'grid' && pattern.rows * pattern.columns < 2) {
      next.rows = DEFAULT_PATTERN.rows
      next.columns = DEFAULT_PATTERN.columns
    }
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3 border-b border-line pb-5">
      <h2 className="text-sm font-bold tracking-[0.06em] text-mute uppercase">Pattern Repeat</h2>

      <div className="flex gap-2">
        {REPEAT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => chooseRepeat(type)}
            className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
              type === pattern.repeatType
                ? 'bg-accent text-accent-ink'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {pattern.repeatType === 'grid' && (
        <>
          <label className="flex flex-col gap-1 text-sm text-neutral-300">
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
          <label className="flex flex-col gap-1 text-sm text-neutral-300">
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
          <label className="flex flex-col gap-1 text-sm text-neutral-300">
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
          <label className="flex flex-col gap-1 text-sm text-neutral-300">
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
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
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
