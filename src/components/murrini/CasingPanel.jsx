import { findColorant, totalCasingMm } from '../../engine/murrini/rod'
import { Icon } from '../icons'
import { Panel } from './Panel'

export function CasingPanel({ casing, rod, selectedColorantId, onAdd, onRemove, onMove, onUpdate }) {
  const total = totalCasingMm(casing)
  const tooThick = total >= rod.gatherDiameterMm / 2 - 1
  const addable = findColorant(selectedColorantId)

  return (
    <Panel
      title="Casing, inside to out"
      action={
        <span className="font-mono text-xs text-mute">{total.toFixed(1)} mm</span>
      }
    >
      {casing.length === 0 ? (
        <p className="text-sm leading-relaxed text-mute">No casing. The canes are the outside of the rod.</p>
      ) : (
        <ol className="flex flex-col border-t border-line">
          {casing.map((layer, index) => {
            const colorant = findColorant(layer.colorantId)
            const name = colorant?.name ?? 'Unknown colour'
            return (
              <li
                key={`${layer.colorantId}-${index}`}
                className="grid min-h-12 grid-cols-[1.25rem_1.75rem_1fr_auto] items-center gap-2 border-b border-line text-sm"
              >
                <span className="font-mono text-xs text-mute">{index + 1}</span>
                <span
                  className="h-5 w-7 rounded shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)]"
                  style={{ background: colorant?.swatch }}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{name}</span>
                  <label className="flex items-center gap-1 font-mono text-xs text-mute">
                    <input
                      type="number"
                      min={0.5}
                      max={8}
                      step={0.5}
                      value={layer.thicknessMm}
                      onChange={(event) =>
                        onUpdate(index, { thicknessMm: Math.max(0.5, Number(event.target.value) || 0.5) })
                      }
                      aria-label={`${name} thickness in millimetres`}
                      className="w-12 rounded border border-line bg-ground px-1 text-ink"
                    />
                    mm
                  </label>
                </span>
                <span className="flex">
                  <IconButton
                    label={`Move ${name} inward`}
                    icon="chevronUp"
                    disabled={index === 0}
                    onClick={() => onMove(index, -1)}
                  />
                  <IconButton
                    label={`Move ${name} outward`}
                    icon="chevronDown"
                    disabled={index === casing.length - 1}
                    onClick={() => onMove(index, 1)}
                  />
                  <IconButton label={`Remove ${name}`} icon="close" onClick={() => onRemove(index)} />
                </span>
              </li>
            )
          })}
        </ol>
      )}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onAdd('clear')}
          className="flex items-center gap-1.5 rounded-md bg-raise px-2.5 py-1.5 text-sm text-ink hover:bg-line"
        >
          <Icon name="plus" size={14} /> Clear layer
        </button>
        {addable && addable.id !== 'clear' && (
          <button
            type="button"
            onClick={() => onAdd(addable.id)}
            className="flex items-center gap-1.5 rounded-md bg-raise px-2.5 py-1.5 text-sm text-ink hover:bg-line"
          >
            <Icon name="plus" size={14} /> {addable.name.split(' / ')[0]} layer
          </button>
        )}
      </div>
      {tooThick && (
        <p className="flex gap-2 text-sm text-amber-300" role="status">
          <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
          The casing fills the whole rod. Thin a layer or raise the gather diameter.
        </p>
      )}
    </Panel>
  )
}

function IconButton({ label, icon, onClick, disabled = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-md text-mute hover:bg-raise hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <Icon name={icon} size={16} />
    </button>
  )
}
