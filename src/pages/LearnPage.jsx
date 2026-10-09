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
    <div className="flex flex-col items-center pt-4 sm:pt-8">
      <div className="flex gap-2">
        {SECTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSection(item.key)}
            className={`rounded px-3 py-1.5 text-base transition-colors ${
              item.key === section
                ? 'bg-neutral-100 text-neutral-900'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {section === 'techniques' ? <TechniqueGuidePage /> : <ColorIndexPage />}
    </div>
  )
}
