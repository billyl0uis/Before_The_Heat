import { PageHeader } from '../components/PageHeader'
import { GLOSSARY, GLOSSARY_ORDER } from '../content/glossary'

// Every shop word the app uses, in one place. The same definitions open
// inline wherever a dotted-underlined word appears.
export function GlossaryPage() {
  return (
    <>
      <PageHeader
        title="Glossary"
        lede="The shop words this app uses, in plain language. Wherever one has a dotted underline, tap it to see its meaning in place."
      />
      <dl className="mx-auto grid w-full max-w-5xl gap-x-12 px-4 sm:px-8 md:grid-cols-2">
        {GLOSSARY_ORDER.map((id) => (
          <div key={id} id={`term-${id}`} className="scroll-mt-20 border-t border-line py-4">
            <dt className="text-base font-semibold text-ink">{GLOSSARY[id].term}</dt>
            <dd className="mt-1 max-w-[62ch] text-base leading-relaxed text-ink-soft">{GLOSSARY[id].definition}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}
