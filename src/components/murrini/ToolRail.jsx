import { GLASS_COLOR_INDEX } from '../../content/glassColorIndex'
import { COMPOUND_SHAPE_ORDER, COMPOUND_SHAPE_TYPES } from '../../engine/murrini/compoundShapes'
import { SHAPE_ORDER, SHAPE_TYPES } from '../../engine/murrini/shapes'
import { Icon, ShapeGlyph } from '../icons'
import { Panel, Slider } from './Panel'
import { TOOL_KEYS } from './toolKeys'

function shapeDefinition(key) {
  return SHAPE_TYPES[key] ?? COMPOUND_SHAPE_TYPES[key]
}

function ToolButton({ shapeKey, active, shortcut, onSelect }) {
  const { label } = shapeDefinition(shapeKey)
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(shapeKey)}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border px-1 py-2 text-[0.8rem] leading-tight transition-colors ${
        active
          ? 'border-accent bg-raise text-ink'
          : 'border-transparent bg-raise/60 text-mute hover:bg-raise hover:text-ink'
      }`}
    >
      <ShapeGlyph shapeKey={shapeKey} size={24} />
      {label}
    </button>
  )
}

export function ToolRail({
  selectedShape,
  onSelectShape,
  params,
  onParamChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClear,
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
  const shortcutFor = (key) => {
    const index = TOOL_KEYS.indexOf(key)
    return index < 9 ? String(index + 1) : null
  }

  return (
    <>
      <Panel title="Single cane">
        <div className="grid grid-cols-2 gap-1.5">
          {SHAPE_ORDER.map((key) => (
            <ToolButton
              key={key}
              shapeKey={key}
              active={key === selectedShape && !selectMode}
              shortcut={shortcutFor(key)}
              onSelect={onSelectShape}
            />
          ))}
        </div>
      </Panel>

      <Panel title="Bundles">
        <div className="grid grid-cols-2 gap-1.5">
          {COMPOUND_SHAPE_ORDER.map((key) => (
            <ToolButton
              key={key}
              shapeKey={key}
              active={key === selectedShape && !selectMode}
              shortcut={shortcutFor(key)}
              onSelect={onSelectShape}
            />
          ))}
        </div>
      </Panel>

      <Panel
        title={selectMode ? 'Edit a placed shape' : definition.label}
        action={
          <button
            type="button"
            aria-pressed={selectMode}
            onClick={onToggleSelectMode}
            disabled={!canSelect}
            title={canSelect ? 'Select a placed shape (Esc to exit)' : 'Turn repeat off to select a shape'}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              selectMode ? 'bg-accent text-accent-ink' : 'bg-raise text-mute hover:text-ink'
            }`}
          >
            <Icon name="select" size={14} />
            {selectMode ? 'Done' : 'Select'}
          </button>
        }
      >
        {selectMode ? (
          selectedElement && selectedDefinition ? (
            <>
              {selectedDefinition.controls.map((control) => (
                <Slider
                  key={control.key}
                  id={`edit-${control.key}`}
                  label={control.label}
                  value={selectedElement.params[control.key]}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  onChange={(value) => onEditParamChange(control.key, value)}
                  onPointerDown={onBeginEdit}
                  onFocus={onBeginEdit}
                  onPointerUp={onCommitEdit}
                  onBlur={onCommitEdit}
                />
              ))}
              <button
                type="button"
                onClick={onDeleteSelected}
                className="mt-2 flex items-center justify-center gap-2 rounded-md border border-red-400/40 px-3 py-2 text-sm text-red-300 hover:bg-red-950/40"
              >
                <Icon name="trash" size={16} />
                Delete shape
              </button>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-mute">
              Click a placed shape on the slice to resize it.
            </p>
          )
        ) : (
          <>
            {definition.controls.map((control) => (
              <Slider
                key={control.key}
                id={`tool-${control.key}`}
                label={control.label}
                value={params[control.key]}
                min={control.min}
                max={control.max}
                step={control.step}
                onChange={(value) => onParamChange(control.key, value)}
              />
            ))}
            {isCompound && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-mute">Second colour</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    aria-pressed={accentColorantId === null}
                    onClick={() => onSelectAccentColorant(null)}
                    className={`rounded-md px-2 text-xs font-semibold ${
                      accentColorantId === null ? 'bg-accent text-accent-ink' : 'bg-raise text-mute'
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
                      aria-pressed={accentColorantId === colorant.id}
                      onClick={() => onSelectAccentColorant(colorant.id)}
                      className={`h-6 w-6 rounded-full border-2 ${
                        accentColorantId === colorant.id ? 'border-ink' : 'border-line'
                      }`}
                      style={{ backgroundColor: colorant.swatch }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Panel>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (⌘Z)"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-raise py-2 text-sm text-ink disabled:opacity-40"
        >
          <Icon name="undo" size={16} /> Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (⇧⌘Z)"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-raise py-2 text-sm text-ink disabled:opacity-40"
        >
          <Icon name="redo" size={16} /> Redo
        </button>
      </div>
      {/* Set apart from Undo/Redo on purpose, so a slip can't clear the slice. */}
      <button
        type="button"
        onClick={onClear}
        className="mt-6 rounded-md border border-line py-2 text-sm text-mute hover:border-red-400/50 hover:text-red-300"
      >
        Clear slice
      </button>
    </>
  )
}
