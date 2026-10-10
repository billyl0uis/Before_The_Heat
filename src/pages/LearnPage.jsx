import { useState } from 'react'
import { ColorIndexPage } from './ColorIndexPage'
import { TechniqueGuidePage } from './TechniqueGuidePage'

const SECTIONS = [
  { key: 'techniques', label: 'Techniques' },
  { key: 'colors', label: 'Colors' },
]

// Reference material lives under one tab so the main nav stays short.
export function LearnPage() {
  const [section, setSection] = useState('techniques')

  return (
    <div className="flex flex-col pb-16">
      <div className="border-b border-line bg-panel px-4 py-3 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="inline-flex rounded-lg bg-raise p-0.5" role="group" aria-label="Learn section">
            {SECTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={item.key === section}
                onClick={() => setSection(item.key)}
                className={`rounded-md px-4 py-2 text-sm font-semibold ${
                  item.key === section ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {section === 'techniques' ? <TechniqueGuidePage /> : <ColorIndexPage />}
    </div>
  )
}
