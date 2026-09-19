const SEVERITY_STYLES = {
  safety: 'border-red-900/50 bg-red-950/30 text-red-300',
  caution: 'border-amber-900/50 bg-amber-950/30 text-amber-300',
  info: 'border-neutral-700 bg-neutral-800/50 text-neutral-300',
}

export function CompatibilityCheck({ warnings }) {
  return (
    <div className="flex w-64 flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-sm font-medium text-neutral-100">Compatibility Check</h2>

      {warnings.length === 0 ? (
        <p className="text-xs text-neutral-500">
          No flags for the real colorants placed so far. This only checks
          what's documented in the Color Index — not a full safety or
          chemistry review.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {warnings.map((warning) => (
            <li
              key={warning.id}
              className={`rounded border p-2 text-xs leading-relaxed ${SEVERITY_STYLES[warning.severity]}`}
            >
              <p className="font-medium">{warning.title}</p>
              <p className="mt-1 opacity-90">{warning.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
