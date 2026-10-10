import { Icon } from '../icons'
import { Panel } from './Panel'

const SEVERITY_STYLES = {
  safety: 'border-red-400/40 bg-red-950/30 text-red-200',
  caution: 'border-amber-400/40 bg-amber-950/30 text-amber-200',
  info: 'border-line bg-raise/50 text-ink',
}

// Always says something: "checked, nothing flagged" is different from
// "not checked", and a silent panel can't tell the two apart.
export function CompatibilityCheck({ warnings, colorantCount = 0 }) {
  const flagged = warnings.filter((warning) => warning.severity !== 'info')

  return (
    <Panel title="Compatibility">
      {colorantCount === 0 ? (
        <p className="text-sm text-mute">Pick real colorants to check them against each other.</p>
      ) : flagged.length === 0 ? (
        <p className="flex items-start gap-2 text-sm">
          <Icon name="check" size={18} className="mt-0.5 shrink-0 text-accent-2" />
          {colorantCount} colorant{colorantCount === 1 ? '' : 's'} checked: nothing flagged in the
          documented properties.
        </p>
      ) : null}
      {warnings.length > 0 && (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {warnings.map((warning) => (
            <li
              key={warning.id}
              className={`rounded-md border p-2.5 text-sm leading-relaxed ${SEVERITY_STYLES[warning.severity]}`}
            >
              <p className="font-semibold">{warning.title}</p>
              <p className="mt-1 opacity-90">{warning.body}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
