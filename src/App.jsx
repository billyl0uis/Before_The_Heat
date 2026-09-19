import { useState } from 'react'
import { MurriniEditor } from './pages/MurriniEditor'
import { VesselEditor } from './pages/VesselEditor'

const TABS = {
  murrini: { label: 'Murrini Pattern', Component: MurriniEditor },
  vessel: { label: 'Vessel Morphograph', Component: VesselEditor },
}

function App() {
  const [activeTab, setActiveTab] = useState('murrini')
  const { Component } = TABS[activeTab]

  return (
    <div className="min-h-svh">
      <nav className="flex justify-center gap-2 border-b border-neutral-800 bg-neutral-900 p-3">
        {Object.entries(TABS).map(([key, tab]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`rounded px-4 py-1.5 text-sm transition-colors ${
              key === activeTab
                ? 'bg-purple-500 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <Component />
    </div>
  )
}

export default App
