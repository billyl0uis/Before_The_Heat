// The one panel treatment for the editor's rails: a heading and its
// content, separated by space and a hairline, never a card inside a card.
export function Panel({ title, children, className = '', action = null }) {
  return (
    <section className={`flex flex-col gap-3 border-b border-line pb-5 last:border-b-0 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold tracking-[0.06em] text-mute uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Slider({ id, label, value, display, min, max, step = 1, onChange, ...rest }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm text-mute">
        {label}
        <output htmlFor={id} className="font-mono text-[0.8rem] text-ink">
          {display ?? value}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-7 w-full cursor-pointer"
        {...rest}
      />
    </div>
  )
}
