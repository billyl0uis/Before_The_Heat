import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Mark } from './components/icons'
import { claimFirstTransition } from './components/fieldShared'
import { LoadingField } from './components/LoadingField'
import { ModeSwitch } from './components/ModeSwitch'
import { computeRepeatedElements } from './engine/murrini/pattern'
import { useMurriniDesign } from './hooks/useMurriniDesign'
import { useVessel } from './hooks/useVessel'

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
const SimpleBuilder = lazy(() =>
  import('./pages/SimpleBuilder').then((m) => ({ default: m.SimpleBuilder })),
)
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

const MODE_KEY = 'before-the-heat:mode'

function readMode() {
  try {
    return window.localStorage.getItem(MODE_KEY) === 'advanced' ? 'advanced' : 'simple'
  } catch {
    return 'simple'
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('murrini')
  // Simple is the guided recipe flow; Advanced is the full editor. Both
  // edit the same design, so switching never loses anything.
  const [mode, setModeState] = useState(readMode)
  const setMode = (next) => {
    setModeState(next)
    try {
      window.localStorage.setItem(MODE_KEY, next)
    } catch {
      // The choice just won't be remembered.
    }
    if (activeTab !== 'murrini') goTo('murrini')
  }
  const openPlan = (view) => {
    try {
      window.localStorage.setItem('before-the-heat:plan-view', view)
    } catch {
      // PlanPage falls back to the print sheet.
    }
    goTo('plan')
  }
  // Set once, on the first section change of a session: the loading field
  // plays for this transition only. The section travels with it so a later
  // tab change can't re-trigger the field on its own.
  const [transition, setTransition] = useState({ count: 0, section: 'murrini' })

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
  const vesselState = useVessel()

  const goTo = (key) => {
    if (key === activeTab) return
    setActiveTab(key)
    if (claimFirstTransition()) setTransition((t) => ({ count: t.count + 1, section: key }))
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
        <ModeSwitch mode={mode} onChange={setMode} className="ml-auto max-sm:hidden" />
        <p className="hidden shrink-0 items-center gap-2 text-sm text-mute lg:flex" role="status">
          <span
            className={`h-2 w-2 rounded-full ${murriniHook.savedLocally ? 'bg-accent-2' : 'bg-faint'}`}
          />
          {murriniHook.savedLocally ? 'Saved in this browser' : 'Not saved yet'}
        </p>
      </header>
      <LoadingField trigger={transition.count} section={transition.section} design={design} />
      <ErrorBoundary key={activeTab}>
        <Suspense fallback={<TabLoadingFallback />}>
          {activeTab === 'murrini' &&
            (mode === 'simple' ? (
              <SimpleBuilder design={design} onOpenPlan={openPlan} onMode={setMode} />
            ) : (
              <MurriniEditor design={design} onOpenPlan={() => goTo('plan')} onMode={setMode} />
            ))}
          {activeTab === 'vessel' && (
            <VesselEditor design={design} vesselState={vesselState} onEditDesign={() => goTo('murrini')} />
          )}
          {activeTab === 'plan' && <PlanPage design={design} vessel={vesselState.vessel} onEdit={() => goTo('murrini')} />}
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
