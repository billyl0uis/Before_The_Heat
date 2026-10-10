import { GLASS_COLOR_INDEX } from '../../content/glassColorIndex'
import { Panel } from './Panel'

function shortName(name) {
  return name.split(' / ')[0].replace(/ \(.*\)$/, '')
}

function noteFor(colorant) {
  if (colorant.hazard === 'cadmium') return 'toxic'
  if (colorant.hazard === 'radioactive') return 'radioactive'
  if (colorant.strikes) return 'strikes'
  return colorant.family === 'opaque' ? 'opaque' : 'transparent'
}

// Every colour shows its name and its working behaviour on the chip
// itself, so choosing never depends on telling swatches apart by eye.
export function ColorChart({
  colorantId,
  onSelectColorant,
  useCustom,
  onToggleCustom,
  customColor,
  onCustomColorChange,
}) {
  const selected = GLASS_COLOR_INDEX.find((colorant) => colorant.id === colorantId)

  return (
    <Panel title="Colour">
      <div className="grid grid-cols-3 gap-1.5">
        {GLASS_COLOR_INDEX.map((colorant) => {
          const active = !useCustom && colorant.id === colorantId
          const flagged = colorant.hazard !== null
          return (
            <button
              key={colorant.id}
              type="button"
              aria-pressed={active}
              title={colorant.name}
              onClick={() => {
                onToggleCustom(false)
                onSelectColorant(colorant.id)
              }}
              className={`flex flex-col overflow-hidden rounded-lg border bg-raise text-left transition-colors ${
                active ? 'border-ink' : 'border-transparent hover:border-line'
              }`}
            >
              <span className="block h-7" style={{ background: colorant.swatch }} />
              <span className="px-1.5 pt-1 pb-1.5 text-[0.7rem] leading-tight">
                {shortName(colorant.name)}
                <span className={`block font-mono text-[0.65rem] ${flagged ? 'text-red-300' : 'text-mute'}`}>
                  {noteFor(colorant)}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {selected && !useCustom && (
        <div className="flex flex-col gap-1 text-sm">
          <p className="font-semibold">{selected.name}</p>
          <p className="text-mute">{selected.colorant}</p>
          {selected.strikes && <p className="text-amber-300">Strikes: needs a controlled reheat to show full colour.</p>}
          {selected.devitrifies === true && <p className="text-amber-300">Documented as prone to devitrification.</p>}
          {selected.devitrifies === 'some' && <p className="text-amber-300">Some commercial versions devitrify.</p>}
          {selected.caution && <p className="text-red-300">{selected.caution}</p>}
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-mute">
        <input
          type="checkbox"
          checked={useCustom}
          onChange={(event) => onToggleCustom(event.target.checked)}
        />
        Custom colour (not a real colorant)
      </label>
      {useCustom && (
        <input
          type="color"
          value={customColor}
          onChange={(event) => onCustomColorChange(event.target.value)}
          aria-label="Custom colour"
          className="h-9 w-16 cursor-pointer rounded border border-line bg-transparent"
        />
      )}
    </Panel>
  )
}
