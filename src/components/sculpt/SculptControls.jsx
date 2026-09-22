export function SculptControls({
  brushRadius,
  onBrushRadiusChange,
  brushStrength,
  onBrushStrengthChange,
  brushMode,
  onBrushModeChange,
  onUndo,
  onRedo,
  onReset,
  canUndo,
  canRedo,
}) {
  return (
    <div className="flex w-64 flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-base font-medium text-neutral-100">Brush</h2>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onBrushModeChange('push')}
          className={`flex-1 rounded px-3 py-1.5 text-base transition-colors ${
            brushMode === 'push'
              ? 'bg-purple-500 text-white'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          Push out
        </button>
        <button
          type="button"
          onClick={() => onBrushModeChange('pull')}
          className={`flex-1 rounded px-3 py-1.5 text-base transition-colors ${
            brushMode === 'pull'
              ? 'bg-purple-500 text-white'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          Pull in
        </button>
      </div>

      <label className="flex flex-col gap-1 text-base text-neutral-300">
        Brush size: {brushRadius}
        <input
          type="range"
          min={8}
          max={60}
          step={1}
          value={brushRadius}
          onChange={(event) => onBrushRadiusChange(Number(event.target.value))}
        />
      </label>

      <label className="flex flex-col gap-1 text-base text-neutral-300">
        Strength: {brushStrength}
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={brushStrength}
          onChange={(event) => onBrushStrengthChange(Number(event.target.value))}
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-base text-neutral-300 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-base text-neutral-300 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Redo
        </button>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="rounded bg-neutral-800 px-3 py-1.5 text-base text-neutral-300 hover:bg-neutral-700"
      >
        Reset to gather
      </button>

      <p className="text-base leading-relaxed text-neutral-400">
        Left-drag on the glass to sculpt. Right-drag to orbit, scroll to
        zoom — left is reserved for the brush so the two never fight.
      </p>
    </div>
  )
}
