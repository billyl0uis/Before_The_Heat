// Simple is the guided recipe flow; Advanced is the full editor. Both edit
// the same design, so switching never loses anything.
export function ModeSwitch({ mode, onChange, className = '' }) {
  return (
    <div className={`inline-flex shrink-0 rounded-lg bg-raise p-0.5 ${className}`} role="group" aria-label="Editor mode">
      {[
        { key: 'simple', label: 'Simple' },
        { key: 'advanced', label: 'Advanced' },
      ].map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={mode === option.key}
          onClick={() => onChange(option.key)}
          className={`rounded-md px-2.5 py-1 text-xs font-bold max-sm:min-h-[44px] sm:px-3 sm:text-sm ${
            mode === option.key ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
