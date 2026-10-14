import { useEffect } from 'react'
import { PageHeader } from '../components/PageHeader'
import { TechniqueDiagram } from '../components/murrini/TechniqueDiagram'
import { MURRINI_TECHNIQUES } from '../content/murrineTechniques'
import { TECHNIQUE_ORDER, techniqueSlug } from '../routes'


function TechniqueCard({ techniqueKey, params, active = false }) {
  const technique = MURRINI_TECHNIQUES[techniqueKey]
  if (!technique) return null

  return (
    <article
      id={`technique-${techniqueKey}`}
      tabIndex={-1}
      aria-labelledby={`technique-${techniqueKey}-title`}
      className={`flex scroll-mt-24 flex-col gap-3 rounded-xl border bg-panel p-5 outline-none ${
        active ? 'border-accent shadow-[0_0_0_1px_var(--accent)]' : 'border-line'
      }`}
    >
      <div className="flex items-center gap-4">
        <TechniqueDiagram techniqueKey={techniqueKey} params={params} />
        <h2 id={`technique-${techniqueKey}-title`} className="text-base leading-snug font-semibold text-ink">
          {technique.title}
        </h2>
      </div>
      <p className="text-base leading-relaxed text-ink-soft">{technique.summary}</p>
      <ol className="flex flex-col gap-1.5 text-base leading-relaxed text-ink-soft">
        {technique.steps.map((step, index) => (
          <li key={step} className="grid grid-cols-[1.5rem_1fr] gap-1">
            <span className="pt-0.5 font-mono text-[0.8rem] font-semibold text-accent">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {technique.tips && (
        <section className="mt-1 border-t border-line pt-3" aria-labelledby={`${techniqueKey}-tips`}>
          <h3 id={`${techniqueKey}-tips`} className="text-base font-semibold text-ink">
            {technique.tips.title}
          </h3>
          <p className="mt-1 text-base leading-relaxed text-ink-soft">{technique.tips.intro}</p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-base leading-relaxed text-ink-soft marker:text-accent">
            {technique.tips.items.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}

export function TechniqueGuidePage({ focus = null, onOpenTechnique }) {
  // A technique's own address opens the page scrolled to it.
  useEffect(() => {
    if (!focus) return
    const card = document.getElementById(`technique-${focus}`)
    card?.scrollIntoView({ block: 'start' })
    card?.focus({ preventScroll: true })
  }, [focus])

  return (
    <>
      <PageHeader
        title="Cane and murrini techniques"
        lede="The real glassblowing methods behind every tool in the editor, in the order you'd learn them: single canes first, bundles last."
      />
      {/* Eighteen techniques is a long scroll on a phone: jump straight to one. */}
      <nav aria-label="Techniques on this page" className="mx-auto mb-6 w-full max-w-5xl px-4 sm:px-8">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {TECHNIQUE_ORDER.map(({ key }) =>
            MURRINI_TECHNIQUES[key] ? (
              <li key={key}>
                <a
                  href={`/learn/${techniqueSlug(key)}`}
                  onClick={(event) => {
                    // A plain click stays in the app; open-in-new-tab still works.
                    if (event.metaKey || event.ctrlKey || event.shiftKey || !onOpenTechnique) return
                    event.preventDefault()
                    onOpenTechnique(key)
                  }}
                  className="inline-flex min-h-[44px] items-center font-semibold text-accent underline decoration-accent/40 underline-offset-[3px] hover:decoration-accent sm:min-h-0 sm:py-1"
                >
                  {MURRINI_TECHNIQUES[key].title}
                </a>
              </li>
            ) : null,
          )}
        </ul>
      </nav>
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 sm:px-8 lg:grid-cols-2">
        {TECHNIQUE_ORDER.map(({ key, params }) => (
          <TechniqueCard key={key} techniqueKey={key} params={params} active={key === focus} />
        ))}
      </div>
    </>
  )
}
