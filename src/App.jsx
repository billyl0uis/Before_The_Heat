import { lazy, Suspense, useMemo, useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { computeRepeatedElements } from './engine/murrini/pattern'
import { useMurriniDesign } from './hooks/useMurriniDesign'
import { useVesselShape } from './hooks/useVesselShape'

// Lazy-loaded so each tab's code (and its dependencies) only download when
// actually visited. The biggest win is Design Vault: it's the only tab
// that pulls in the Firebase SDK, which was otherwise sitting in every
// visitor's initial bundle even if they never touch the Vault. Murrini
// and Vessel still share Three.js eagerly through the design/vessel hooks
// below (needed for cross-tab state persistence — see their comments),
// so splitting their page components saves less, but costs nothing to do
// consistently across all four tabs.
const MurriniEditor = lazy(() =>
  import('./pages/MurriniEditor').then((m) => ({ default: m.MurriniEditor })),
)
const VesselEditor = lazy(() =>
  import('./pages/VesselEditor').then((m) => ({ default: m.VesselEditor })),
)
const ColorIndexPage = lazy(() =>
  import('./pages/ColorIndexPage').then((m) => ({ default: m.ColorIndexPage })),
)
const DesignVaultPage = lazy(() =>
  import('./pages/DesignVaultPage').then((m) => ({ default: m.DesignVaultPage })),
)
const InspirationPage = lazy(() =>
  import('./pages/InspirationPage').then((m) => ({ default: m.InspirationPage })),
)

const TABS = [
  { key: 'murrini', label: 'Murrini Pattern' },
  { key: 'vessel', label: 'Vessel Morphograph' },
  { key: 'colors', label: 'Color Index' },
  { key: 'vault', label: 'Design Vault' },
  { key: 'inspiration', label: 'Inspiration' },
]

function TabLoadingFallback() {
  return (
    <div className="flex justify-center p-16 text-sm text-neutral-500">Loading…</div>
  )
}

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
      <ErrorBoundary key={activeTab}>
        <Suspense fallback={<TabLoadingFallback />}>
          {activeTab === 'murrini' && <MurriniEditor design={design} />}
          {activeTab === 'vessel' && <VesselEditor design={design} vessel={vessel} />}
          {activeTab === 'colors' && <ColorIndexPage />}
          {activeTab === 'inspiration' && <InspirationPage />}
          {activeTab === 'vault' && (
            <DesignVaultPage
              design={design}
              onLoadDesign={(saved) => {
                murriniHook.loadDesign(saved)
                setActiveTab('murrini')
              }}
            />
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

export default App
