// Small shared controls for the Vessel tool rail.

export function Segmented({ label, options, value, onChange, className = '' }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`grid auto-cols-fr grid-flow-col gap-[3px] rounded-[10px] bg-raise p-[3px] ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-2 py-[7px] text-sm font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            value === option.value ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function RangeField({ label, value, display, min, max, step, onChange, disabled }) {
  return (
    <label className={`flex flex-col gap-1.5 ${disabled ? 'opacity-40' : ''}`}>
      <span className="flex justify-between gap-2.5 text-sm text-ink-soft">
        <span>{label}</span>
        <output className="font-mono text-[0.8rem] whitespace-nowrap text-ink">{display}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full disabled:cursor-not-allowed"
      />
    </label>
  )
}

export function RailSection({ title, children }) {
  return (
    <section className="border-line not-first:mt-7 not-first:border-t not-first:pt-6">
      <h2 className="mb-3.5 text-[0.8rem] font-bold tracking-[0.08em] text-faint uppercase">{title}</h2>
      {children}
    </section>
  )
}

export function ColourChip({ swatch, name, pressed, badge, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex min-h-10 items-center gap-2 rounded-lg border-[1.5px] bg-raise px-2 py-1 text-left text-[0.8rem] leading-tight text-ink-soft ${
        pressed ? 'border-ink' : 'border-transparent hover:border-line'
      }`}
    >
      <span
        className="h-5 w-5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3)]"
        style={{ background: swatch }}
      />
      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{name}</span>
      {badge && <span className="font-mono text-[0.8rem] font-semibold text-accent">{badge}</span>}
    </button>
  )
}
