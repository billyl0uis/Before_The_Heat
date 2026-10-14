import { TermText } from '../Term'
import { Icon } from '../icons'

function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-raise text-ink-soft',
    amber: 'bg-amber-900/40 text-amber-200',
  }
  return <span className={`rounded-md px-2 py-0.5 text-[0.8rem] font-semibold ${tones[tone]}`}>{children}</span>
}

export function ColorSwatchCard({ color, active = false, onOpen }) {
  return (
    <article
      id={`color-${color.id}`}
      tabIndex={-1}
      className={`flex scroll-mt-24 flex-col gap-3 rounded-xl border bg-panel p-4 outline-none ${
        active ? 'border-accent shadow-[0_0_0_1px_var(--accent)]' : 'border-line'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className="h-11 w-11 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25),0_2px_8px_rgb(0_0_0/0.4)]"
          style={{ backgroundColor: color.swatch }}
        />
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-semibold text-ink">
            {/* Each color has its own page, so it can be linked to and found. */}
            <a
              href={`/learn/colors/${color.id}`}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0 || !onOpen) return
                event.preventDefault()
                onOpen(color.id)
              }}
              className="hover:underline hover:underline-offset-[3px]"
            >
              {color.name}
            </a>
          </h3>
          <p className="text-sm leading-snug text-mute">{color.colorant}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge>{color.family === 'opaque' ? 'Opacifier' : 'Transparent'}</Badge>
        {color.strikes && <Badge tone="amber">Strikes on reheat</Badge>}
        {color.devitrifies === true && <Badge tone="amber">Devitrifies</Badge>}
        {color.devitrifies === 'some' && <Badge tone="amber">Devitrifies (some SKUs)</Badge>}
      </div>

      <p className="text-sm leading-relaxed text-ink-soft"><TermText>{color.notes}</TermText></p>

      {color.caution && (
        <p className="flex gap-2 border-t border-line pt-3 text-sm leading-relaxed text-red-300">
          <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
          <span>
            <TermText>{color.caution}</TermText>
          </span>
        </p>
      )}
    </article>
  )
}
