import { SHAPE_ORDER, SHAPE_TYPES } from '../../engine/murrini/shapes'

export function ShapeToolbar({
  selectedShape,
  onSelectShape,
  params,
  onParamChange,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const definition = SHAPE_TYPES[selectedShape]

  return (
    <div className="flex w-64 flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex flex-wrap gap-2">
        {SHAPE_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelectShape(key)}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              key === selectedShape
                ? 'bg-purple-500 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {SHAPE_TYPES[key].label}
          </button>
        ))}
      </div>

      {definition.controls.map((control) => (
        <label
          key={control.key}
          className="flex flex-col gap-1 text-sm text-neutral-300"
        >
          {control.label}: {params[control.key]}
          <input
            type="range"
            min={control.min}
            max={control.max}
            step={control.step}
            value={params[control.key]}
            onChange={(event) =>
              onParamChange(control.key, Number(event.target.value))
            }
          />
        </label>
      ))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Redo
        </button>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="rounded bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700"
      >
        Clear canvas
      </button>
    </div>
  )
}
