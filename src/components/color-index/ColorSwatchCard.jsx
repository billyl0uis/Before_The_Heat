import { Icon } from '../icons'

function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-raise text-ink-soft',
    amber: 'bg-amber-900/40 text-amber-200',
  }
  return <span className={`rounded-md px-2 py-0.5 text-[0.8rem] font-semibold ${tones[tone]}`}>{children}</span>
}

export function ColorSwatchCard({ color }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4">
      <div className="flex items-center gap-3">
        <span
          className="h-11 w-11 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25),0_2px_8px_rgb(0_0_0/0.4)]"
          style={{ backgroundColor: color.swatch }}
        />
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-semibold text-ink">{color.name}</h3>
          <p className="text-sm leading-snug text-mute">{color.colorant}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge>{color.family === 'opaque' ? 'Opacifier' : 'Transparent'}</Badge>
        {color.strikes && <Badge tone="amber">Strikes on reheat</Badge>}
        {color.devitrifies === true && <Badge tone="amber">Devitrifies</Badge>}
        {color.devitrifies === 'some' && <Badge tone="amber">Devitrifies (some SKUs)</Badge>}
      </div>

      <p className="text-sm leading-relaxed text-ink-soft">{color.notes}</p>

      {color.caution && (
        <p className="flex gap-2 border-t border-line pt-3 text-sm leading-relaxed text-red-300">
          <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
          <span>{color.caution}</span>
        </p>
      )}
    </article>
  )
}
