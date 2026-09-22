function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-neutral-800 text-neutral-300',
    amber: 'bg-amber-900/40 text-amber-300',
    red: 'bg-red-900/40 text-red-300',
  }
  return (
    <span className={`rounded px-2 py-0.5 text-sm ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function ColorSwatchCard({ color }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 shrink-0 rounded-full border border-neutral-700"
          style={{ backgroundColor: color.swatch }}
        />
        <div>
          <p className="text-base font-medium text-neutral-100">{color.name}</p>
          <p className="text-base leading-relaxed text-neutral-400">{color.colorant}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge>{color.family === 'opaque' ? 'Opacifier' : 'Transparent'}</Badge>
        {color.strikes && <Badge tone="amber">Strikes on reheat</Badge>}
        {color.devitrifies === true && <Badge tone="amber">Devitrifies</Badge>}
        {color.devitrifies === 'some' && (
          <Badge tone="amber">Devitrifies (some SKUs)</Badge>
        )}
      </div>

      <p className="text-base leading-relaxed text-neutral-300">{color.notes}</p>

      {color.caution && (
        <p className="rounded border border-red-900/50 bg-red-950/30 p-2 text-base leading-relaxed text-red-300">
          {color.caution}
        </p>
      )}
    </div>
  )
}
