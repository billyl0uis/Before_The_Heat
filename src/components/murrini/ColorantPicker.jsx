import { GLASS_COLOR_INDEX } from '../../content/glassColorIndex'

export function ColorantPicker({
  colorantId,
  onSelectColorant,
  useCustom,
  onToggleCustom,
  customColor,
  onCustomColorChange,
}) {
  const selected = GLASS_COLOR_INDEX.find((colorant) => colorant.id === colorantId)

  return (
    <div className="flex w-64 flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-sm font-medium text-neutral-100">Glass Color</h2>

      <div className="grid grid-cols-6 gap-2">
        {GLASS_COLOR_INDEX.map((colorant) => (
          <button
            key={colorant.id}
            type="button"
            title={colorant.name}
            aria-label={colorant.name}
            onClick={() => {
              onToggleCustom(false)
              onSelectColorant(colorant.id)
            }}
            className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
              !useCustom && colorantId === colorant.id
                ? 'border-white'
                : 'border-neutral-700'
            }`}
            style={{ backgroundColor: colorant.swatch }}
          />
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs text-neutral-400">
        <input
          type="checkbox"
          checked={useCustom}
          onChange={(event) => onToggleCustom(event.target.checked)}
        />
        Custom color (not tied to a real colorant)
      </label>

      {useCustom ? (
        <input
          type="color"
          value={customColor}
          onChange={(event) => onCustomColorChange(event.target.value)}
          className="h-8 w-14 cursor-pointer rounded border border-neutral-700 bg-transparent"
        />
      ) : (
        selected && (
          <div className="flex flex-col gap-1 border-t border-neutral-800 pt-2 text-xs">
            <p className="font-medium text-neutral-200">{selected.name}</p>
            <p className="text-neutral-500">{selected.colorant}</p>
            {selected.strikes && (
              <p className="text-amber-400">
                Strikes — needs a controlled reheat to show full color.
              </p>
            )}
            {selected.devitrifies === true && (
              <p className="text-amber-400">Documented as prone to devitrification.</p>
            )}
            {selected.devitrifies === 'some' && (
              <p className="text-amber-400">Some commercial SKUs of this family devitrify.</p>
            )}
            {selected.caution && <p className="text-red-400">{selected.caution}</p>}
          </div>
        )
      )}
    </div>
  )
}
