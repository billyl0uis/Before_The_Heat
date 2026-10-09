import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Mark } from './components/icons'
import { LoadingField } from './components/LoadingField'
import { computeRepeatedElements } from './engine/murrini/pattern'
import { useMurriniDesign } from './hooks/useMurriniDesign'
import { useVesselPattern } from './hooks/useVesselPattern'
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
const PlanPage = lazy(() => import('./pages/PlanPage').then((m) => ({ default: m.PlanPage })))
const LearnPage = lazy(() =>
  import('./pages/LearnPage').then((m) => ({ default: m.LearnPage })),
)
const DesignVaultPage = lazy(() =>
  import('./pages/DesignVaultPage').then((m) => ({ default: m.DesignVaultPage })),
)
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })),
)

const TABS = [
  { key: 'murrini', label: 'Murrini' },
  { key: 'vessel', label: 'Vessel' },
  { key: 'plan', label: 'Plan' },
  { key: 'learn', label: 'Learn' },
  { key: 'vault', label: 'Saved' },
]

function TabLoadingFallback() {
  return <div className="flex justify-center p-16 text-base text-mute">Loading…</div>
}

function App() {
  const [activeTab, setActiveTab] = useState('murrini')
  // Bumped on every tab change so the loading field rolls a fresh hand.
  const [transition, setTransition] = useState(0)

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
  const vesselPattern = useVesselPattern()

  const goTo = (key) => {
    if (key === activeTab) return
    setActiveTab(key)
    setTransition((n) => n + 1)
  }

  // Each section paints the whole page in its own Vortex Garden palette.
  useEffect(() => {
    document.documentElement.dataset.section = activeTab
  }, [activeTab])

  // P jumps between the editor and its plan from anywhere.
  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'p' || event.key === 'P') {
        goTo(activeTab === 'plan' ? 'murrini' : 'plan')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="min-h-svh">
      <header
        data-print-hide
        className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-panel px-3 sm:gap-6 sm:px-5"
      >
        <button
          type="button"
          onClick={() => goTo('about')}
          className="flex shrink-0 items-center gap-2.5 font-extrabold tracking-tight"
          aria-label="Before The Heat, about this project"
        >
          <Mark />
          <span className="max-sm:hidden">Before The Heat</span>
        </button>
        <nav className="flex h-full min-w-0 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={tab.key === activeTab}
              onClick={() => goTo(tab.key)}
              className={`relative shrink-0 px-2 text-[0.85rem] font-semibold transition-colors sm:px-3.5 sm:text-[0.95rem] ${
                tab.key === activeTab ? 'text-ink' : 'text-mute hover:text-ink'
              } after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-accent ${
                tab.key === activeTab ? 'after:block' : 'after:hidden'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <p className="ml-auto hidden shrink-0 items-center gap-2 text-sm text-mute md:flex" role="status">
          <span
            className={`h-2 w-2 rounded-full ${murriniHook.savedLocally ? 'bg-accent-2' : 'bg-faint'}`}
          />
          {murriniHook.savedLocally ? 'Saved in this browser' : 'Not saved yet'}
        </p>
      </header>
      <LoadingField trigger={transition} section={activeTab} design={design} />
      <ErrorBoundary key={activeTab}>
        <Suspense fallback={<TabLoadingFallback />}>
          {activeTab === 'murrini' && (
            <MurriniEditor design={design} onOpenPlan={() => goTo('plan')} />
          )}
          {activeTab === 'vessel' && (
            <VesselEditor design={design} vessel={vessel} vesselPattern={vesselPattern} />
          )}
          {activeTab === 'plan' && <PlanPage design={design} onEdit={() => goTo('murrini')} />}
          {activeTab === 'learn' && <LearnPage />}
          {activeTab === 'about' && <AboutPage />}
          {activeTab === 'vault' && (
            <DesignVaultPage
              design={design}
              onLoadDesign={(saved) => {
                murriniHook.loadDesign(saved)
                goTo('murrini')
              }}
            />
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

export default App
