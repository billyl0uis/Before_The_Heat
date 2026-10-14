import { AboutPage } from './AboutPage'
import { ColorIndexPage } from './ColorIndexPage'
import { GlossaryPage } from './GlossaryPage'
import { TechniqueGuidePage } from './TechniqueGuidePage'
import { pathFor } from '../routes'

const SECTIONS = [
  { key: 'techniques', label: 'Techniques' },
  { key: 'colors', label: 'Colors' },
  { key: 'glossary', label: 'Glossary' },
  { key: 'about', label: 'About' },
]

// Reference material lives under one tab so the main nav stays short.
// Which section and technique are open lives in App, so each has its own
// address (see routes.js).
export function LearnPage({ section = 'techniques', technique = null, onOpen }) {
  const setSection = (next) => onOpen?.(next)

  return (
    <div className="flex flex-col pb-16">
      <div className="border-b border-line bg-panel px-4 py-3 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <nav className="inline-flex max-w-full overflow-x-auto rounded-lg bg-raise p-0.5 [scrollbar-width:none]" aria-label="Learn section">
            {SECTIONS.map((item) => (
              <a
                key={item.key}
                href={pathFor({ tab: 'learn', section: item.key })}
                aria-current={item.key === section ? 'page' : undefined}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
                  event.preventDefault()
                  setSection(item.key)
                }}
                className={`flex min-h-[44px] shrink-0 items-center rounded-md px-3 py-2 text-sm font-semibold sm:px-4 ${
                  item.key === section ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
      {section === 'techniques' && (
        <TechniqueGuidePage focus={technique} onOpenTechnique={(key) => onOpen?.('techniques', key)} />
      )}
      {section === 'colors' && <ColorIndexPage />}
      {section === 'glossary' && <GlossaryPage />}
      {section === 'about' && <AboutPage />}
    </div>
  )
}
