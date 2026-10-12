import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Mark } from './components/icons'
import { claimFirstTransition } from './components/fieldShared'
import { LoadingField } from './components/LoadingField'
import { ModeSwitch } from './components/ModeSwitch'
import { computeRepeatedElements } from './engine/murrini/pattern'
import { useMurriniDesign } from './hooks/useMurriniDesign'
import { useVessel } from './hooks/useVessel'
import { MURRINI_TECHNIQUES } from './content/murrineTechniques'
import { parsePath, pathFor, titleFor } from './routes'

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

// Saved needs online saving set up (Firebase). Without it the tab could only
// explain that it doesn't work, so it stays out of the nav until it does.
// Read straight from the env so the Firebase SDK still loads lazily.
const SAVING_ON = [
  import.meta.env.VITE_FIREBASE_API_KEY,
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  import.meta.env.VITE_FIREBASE_APP_ID,
].every(Boolean)

const TABS = [
  { key: 'murrini', label: 'Murrini' },
  { key: 'vessel', label: 'Vessel' },
  { key: 'plan', label: 'Plan' },
  { key: 'learn', label: 'Learn' },
  ...(SAVING_ON ? [{ key: 'vault', label: 'Saved' }] : []),
]

// Names what's on its way, so a slow connection doesn't look like a
// blank page.
const LOADING_LABELS = {
  murrini: 'Loading the cane editor…',
  vessel: 'Loading the vessel…',
  plan: 'Loading your plan…',
  learn: 'Loading Learn…',
  about: 'Loading About…',
  vault: 'Loading saved designs…',
}

function TabLoadingFallback({ tab }) {
  return (
    <div role="status" className="flex justify-center p-16 text-base text-mute">
      {LOADING_LABELS[tab] ?? 'Loading…'}
    </div>
  )
}

const MODE_KEY = 'before-the-heat:mode'

function readMode() {
  try {
    return window.localStorage.getItem(MODE_KEY) === 'advanced' ? 'advanced' : 'simple'
  } catch {
    return 'simple'
  }
}

// Switch the page's palette before the next section renders, so anything
// that reads a colour while rendering (the slice's mask) gets the new
// section's, not the one being left.
function paintSection(key) {
  document.documentElement.dataset.section = key
}

function App() {
  // Where the address bar says to start: a shared /learn/zanfirico link
  // opens on that technique, not on the editor.
  const [start] = useState(() => {
    const place = parsePath(window.location.pathname)
    paintSection(place.tab)
    return place
  })
  const [activeTab, setActiveTab] = useState(start.tab)
  const [learnSection, setLearnSection] = useState(start.section)
  const [technique, setTechnique] = useState(start.technique)
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

  // Which plan the Plan tab shows when the vessel has its own (reticello):
  // arriving from the cane editor means the cane plan, from Vessel the
  // vessel's. Neither ever silently replaces the other.
  const [planSource, setPlanSource] = useState('cane')

  const goTo = (key) => {
    if (key === activeTab) return
    if (key === 'plan' && activeTab === 'murrini') setPlanSource('cane')
    if (key === 'plan' && activeTab === 'vessel') setPlanSource('vessel')
    paintSection(key)
    setActiveTab(key)
    if (claimFirstTransition()) setTransition((t) => ({ count: t.count + 1, section: key }))
  }

  // The address bar follows the app, so every place can be linked to and
  // Back steps through them. Only a real change of place adds history.
  useEffect(() => {
    const place = { tab: activeTab, section: learnSection, technique }
    const path = pathFor(place)
    if (path && path !== window.location.pathname) window.history.pushState(null, '', path)
    document.title = titleFor(place, MURRINI_TECHNIQUES)
  }, [activeTab, learnSection, technique])

  // Back and Forward: go where the address now says, without a reload.
  useEffect(() => {
    const onPop = () => {
      const place = parsePath(window.location.pathname)
      paintSection(place.tab)
      setActiveTab(place.tab)
      setLearnSection(place.section)
      setTechnique(place.technique)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const openLearn = (section, key = null) => {
    setLearnSection(section)
    setTechnique(key)
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
        className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-panel px-3 sm:gap-6 sm:px-5"
      >
        <button
          type="button"
          onClick={() => goTo('about')}
          className="flex shrink-0 items-center gap-2.5 font-extrabold tracking-tight max-sm:min-h-[44px] max-sm:min-w-[44px] max-sm:justify-center"
          aria-label="Before The Heat, about this project"
        >
          <Mark />
          <span className="max-sm:hidden">Before The Heat</span>
        </button>
        <nav className="flex h-full min-w-0 overflow-x-auto [scrollbar-width:none]" aria-label="Sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-current={tab.key === activeTab ? 'page' : undefined}
              onClick={() => goTo(tab.key)}
              className={`relative shrink-0 px-1.5 text-sm font-semibold transition-colors sm:px-3.5 sm:text-base ${
                tab.key === activeTab ? 'text-ink' : 'text-mute hover:text-ink'
              } after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-accent ${
                tab.key === activeTab ? 'after:block' : 'after:hidden'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-6">
          {/* Simple and Advanced are two ways into the Murrini editor, so the
              switch only belongs there. */}
          {activeTab === 'murrini' && <ModeSwitch mode={mode} onChange={setMode} className="max-sm:hidden" />}
          <p className="flex shrink-0 items-center gap-2 text-sm text-mute" role="status">
            <span
              className={`h-2 w-2 rounded-full ${murriniHook.savedLocally ? 'bg-accent-2' : 'bg-faint'}`}
            />
            <span className="lg:hidden">{murriniHook.savedLocally ? 'Saved' : 'Not saved'}</span>
            <span className="max-lg:hidden">{murriniHook.savedLocally ? 'Saved in this browser' : 'Not saved yet'}</span>
          </p>
        </div>
      </header>
      <LoadingField trigger={transition.count} section={transition.section} design={design} />
      <main>
      <ErrorBoundary key={activeTab}>
        <Suspense fallback={<TabLoadingFallback tab={activeTab} />}>
          {activeTab === 'murrini' &&
            (mode === 'simple' ? (
              <SimpleBuilder design={design} onOpenPlan={openPlan} onMode={setMode} />
            ) : (
              <MurriniEditor design={design} onOpenPlan={() => goTo('plan')} onMode={setMode} />
            ))}
          {activeTab === 'vessel' && (
            <VesselEditor design={design} vesselState={vesselState} onEditDesign={() => goTo('murrini')} />
          )}
          {activeTab === 'plan' && <PlanPage design={design} vessel={vesselState.vessel} planSource={planSource} onPlanSource={setPlanSource} onEdit={() => goTo('murrini')} onEditVessel={() => goTo('vessel')} />}
          {activeTab === 'learn' && (
            <LearnPage section={learnSection} technique={technique} onOpen={openLearn} />
          )}
          {activeTab === 'about' && <AboutPage />}
          {activeTab === 'notfound' && (
            <div className="mx-auto flex max-w-lg flex-col items-start gap-4 px-6 py-20">
              <h1 className="text-3xl font-extrabold tracking-tight">There's no page at this address</h1>
              <p className="text-lg leading-relaxed text-mute">
                It may have been mistyped, or a link may be out of date. Your saved design is still here.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => goTo('murrini')} className="min-h-[44px] rounded-lg bg-accent px-5 py-2.5 font-bold text-accent-ink">
                  Plan a cane
                </button>
                <button type="button" onClick={() => goTo('learn')} className="min-h-[44px] rounded-lg bg-raise px-5 py-2.5 font-semibold text-ink">
                  Learn the techniques
                </button>
              </div>
            </div>
          )}
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
      </main>
    </div>
  )
}

export default App
