import { useMemo, useState } from 'react'
import { computeRepeatedElements } from './engine/murrini/pattern'
import { useMurriniDesign } from './hooks/useMurriniDesign'
import { useVesselShape } from './hooks/useVesselShape'
import { MurriniEditor } from './pages/MurriniEditor'
import { VesselEditor } from './pages/VesselEditor'

const TABS = [
  { key: 'murrini', label: 'Murrini Pattern' },
  { key: 'vessel', label: 'Vessel Morphograph' },
]

function App() {
  const [activeTab, setActiveTab] = useState('murrini')

  // Lifted up here (rather than owned by MurriniEditor) so the pattern
  // survives switching tabs and the Vessel Morphograph can preview it.
  const murriniHook = useMurriniDesign()
  const repeatedElements = useMemo(
    () => computeRepeatedElements(murriniHook.elements, murriniHook.pattern),
    [murriniHook.elements, murriniHook.pattern],
  )
  const design = { ...murriniHook, repeatedElements }

  // Same reasoning as the murrini hook above: owned here, not inside
  // VesselEditor, so sculpting isn't lost when you switch tabs to check
  // the pattern and come back.
  const vessel = useVesselShape()

  return (
    <div className="min-h-svh">
      <nav className="flex justify-center gap-2 border-b border-neutral-800 bg-neutral-900 p-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded px-4 py-1.5 text-sm transition-colors ${
              tab.key === activeTab
                ? 'bg-purple-500 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {activeTab === 'murrini' ? (
        <MurriniEditor design={design} />
      ) : (
        <VesselEditor design={design} vessel={vessel} />
      )}
    </div>
  )
}

export default App
