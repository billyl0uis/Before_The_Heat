const SEVERITY_STYLES = {
  safety: 'border-red-900/50 bg-red-950/30 text-red-300',
  caution: 'border-amber-900/50 bg-amber-950/30 text-amber-300',
  info: 'border-neutral-700 bg-neutral-800/50 text-neutral-300',
}

export function CompatibilityCheck({ warnings }) {
  if (warnings.length === 0) return null

  return (
    <div className="flex w-64 flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-base font-medium text-neutral-100">Compatibility Check</h2>

      <ul className="flex flex-col gap-2">
          {warnings.map((warning) => (
            <li
              key={warning.id}
              className={`rounded border p-2 text-base leading-relaxed ${SEVERITY_STYLES[warning.severity]}`}
            >
              <p className="font-medium">{warning.title}</p>
              <p className="mt-1 leading-relaxed opacity-90">{warning.body}</p>
            </li>
          ))}
      </ul>
    </div>
  )
}
