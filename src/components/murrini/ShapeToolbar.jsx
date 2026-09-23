import { GLASS_COLOR_INDEX } from '../../content/glassColorIndex'
import { COMPOUND_SHAPE_ORDER, COMPOUND_SHAPE_TYPES } from '../../engine/murrini/compoundShapes'
import { SHAPE_ORDER, SHAPE_TYPES } from '../../engine/murrini/shapes'

const ALL_SHAPE_KEYS = [...SHAPE_ORDER, ...COMPOUND_SHAPE_ORDER]

function shapeDefinition(key) {
  return SHAPE_TYPES[key] ?? COMPOUND_SHAPE_TYPES[key]
}

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
  selectMode,
  onToggleSelectMode,
  canSelect,
  selectedElement,
  onEditParamChange,
  onBeginEdit,
  onCommitEdit,
  onDeleteSelected,
  accentColorantId,
  onSelectAccentColorant,
}) {
  const definition = shapeDefinition(selectedShape)
  const isCompound = Boolean(COMPOUND_SHAPE_TYPES[selectedShape])
  const selectedDefinition = selectedElement ? SHAPE_TYPES[selectedElement.shape] : null

  return (
    <div className="flex w-64 flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex flex-wrap gap-2">
        {ALL_SHAPE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelectShape(key)}
            className={`rounded px-3 py-1.5 text-base transition-colors ${
              key === selectedShape && !selectMode
                ? 'bg-purple-500 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {shapeDefinition(key).label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onToggleSelectMode}
          disabled={!canSelect}
          className={`rounded px-3 py-1.5 text-base transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            selectMode
              ? 'bg-purple-500 text-white'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          {selectMode ? 'Done selecting' : 'Select & resize a placed shape'}
        </button>
        {!canSelect && (
          <p className="text-sm leading-relaxed text-neutral-500">
            Turn off Pattern Repeat to select and resize an individual
            shape.
          </p>
        )}
      </div>

      {selectMode ? (
        selectedElement && selectedDefinition ? (
          <>
            <p className="text-base font-medium text-neutral-200">
              Editing: {selectedDefinition.label}
            </p>
            {selectedDefinition.controls.map((control) => (
              <label
                key={control.key}
                className="flex flex-col gap-1 text-base text-neutral-300"
              >
                {control.label}: {selectedElement.params[control.key]}
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={selectedElement.params[control.key]}
                  onPointerDown={onBeginEdit}
                  onFocus={onBeginEdit}
                  onChange={(event) =>
                    onEditParamChange(control.key, Number(event.target.value))
                  }
                  onPointerUp={onCommitEdit}
                  onBlur={onCommitEdit}
                />
              </label>
            ))}
            <button
              type="button"
              onClick={onDeleteSelected}
              className="rounded bg-red-950/50 px-3 py-1.5 text-base text-red-300 hover:bg-red-950"
            >
              Delete shape
            </button>
          </>
        ) : (
          <p className="text-base leading-relaxed text-neutral-400">
            Click any placed shape on the canvas to select and resize it.
          </p>
        )
      ) : (
        <>
          {definition.controls.map((control) => (
            <label
              key={control.key}
              className="flex flex-col gap-1 text-base text-neutral-300"
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

          {isCompound && (
            <>
              <p className="text-base leading-relaxed text-neutral-400">
                Uses your selected color below as the main color. Pick a
                second color here for the accent, or leave it on Auto —
                change either color, then click the canvas again to place
                another one with a different look.
              </p>
              <div className="flex flex-col gap-2">
                <p className="text-base text-neutral-300">Second color</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectAccentColorant(null)}
                    className={`rounded px-2 py-1 text-sm transition-colors ${
                      accentColorantId === null
                        ? 'bg-purple-500 text-white'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    Auto
                  </button>
                  {GLASS_COLOR_INDEX.map((colorant) => (
                    <button
                      key={colorant.id}
                      type="button"
                      title={colorant.name}
                      aria-label={colorant.name}
                      onClick={() => onSelectAccentColorant(colorant.id)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        accentColorantId === colorant.id ? 'border-white' : 'border-neutral-700'
                      }`}
                      style={{ backgroundColor: colorant.swatch }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

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
        onClick={onClear}
        className="rounded bg-neutral-800 px-3 py-1.5 text-base text-neutral-300 hover:bg-neutral-700"
      >
        Clear canvas
      </button>
    </div>
  )
}
