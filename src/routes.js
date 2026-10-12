// Every page has its own address, so a technique or the glossary can be
// linked to, bookmarked, and found by search engines on its own. Pure
// data and string work, no React: the build uses it too, to write a real
// HTML page for each Learn address (see vite.config.js).

// The techniques in Learn, in reading order: single canes first, bundles
// last. `params` is what each diagram needs to draw a representative case.
export const TECHNIQUE_ORDER = [
  { key: 'circle', params: {} },
  { key: 'ring', params: {} },
  { key: 'multiCasing', params: {} },
  { key: 'embeddedThread', params: {} },
  { key: 'zanfirico', params: { threadCount: 6 } },
  { key: 'marver', params: { sides: 4 } },
  { key: 'opticMold', params: {} },
  { key: 'star', params: {} },
  { key: 'spiral', params: {} },
  { key: 'jellyroll', params: {} },
  { key: 'pinwheel', params: { blades: 6 } },
  { key: 'line', params: {} },
  { key: 'tripod', params: {} },
  { key: 'cross', params: {} },
  { key: 'row', params: {} },
  { key: 'grid', params: {} },
  { key: 'frame', params: {} },
  { key: 'bundle', params: {} },
]

// multiCasing → multi-casing: what goes in the address bar.
export const techniqueSlug = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
const KEY_BY_SLUG = new Map(TECHNIQUE_ORDER.map(({ key }) => [techniqueSlug(key), key]))

const LEARN_SECTIONS = ['techniques', 'colors', 'glossary', 'about']
const TAB_PATHS = { murrini: '/', vessel: '/vessel', plan: '/plan', vault: '/saved', about: '/about' }

// The address for a place in the app.
export function pathFor({ tab, section = 'techniques', technique = null }) {
  // A mistyped address stays in the address bar, so it can be corrected.
  if (tab === 'notfound') return null
  if (tab !== 'learn') return TAB_PATHS[tab] ?? '/'
  if (section === 'techniques') return technique ? `/learn/${techniqueSlug(technique)}` : '/learn'
  return `/learn/${section}`
}

// The place in the app for an address. Anything unknown says so, rather
// than quietly opening somewhere else.
export function parsePath(pathname) {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  const home = { tab: 'murrini', section: 'techniques', technique: null }
  if (!parts.length) return home
  if (parts[0] === 'learn') {
    const sub = parts[1]
    if (!sub) return { tab: 'learn', section: 'techniques', technique: null }
    if (LEARN_SECTIONS.includes(sub)) return { tab: 'learn', section: sub, technique: null }
    if (KEY_BY_SLUG.has(sub)) return { tab: 'learn', section: 'techniques', technique: KEY_BY_SLUG.get(sub) }
    return { ...home, tab: 'notfound' }
  }
  const tab = parts.length === 1 && Object.keys(TAB_PATHS).find((key) => TAB_PATHS[key] === `/${parts[0]}`)
  return tab ? { ...home, tab } : { ...home, tab: 'notfound' }
}

const SITE = 'Before The Heat'

// The browser tab's title for a place in the app.
export function titleFor({ tab, section, technique }, techniques = {}) {
  if (tab === 'learn') {
    if (section === 'techniques' && technique && techniques[technique]) return `${techniques[technique].title} · ${SITE}`
    if (section === 'colors') return `Glass color index · ${SITE}`
    if (section === 'glossary') return `Glassblowing glossary · ${SITE}`
    if (section === 'about') return `About · ${SITE}`
    return `Cane and murrini techniques · ${SITE}`
  }
  if (tab === 'notfound') return `Page not found · ${SITE}`
  const names = { vessel: 'Vessel', plan: 'Shop plan', vault: 'Saved designs', about: 'About' }
  return names[tab] ? `${names[tab]} · ${SITE}` : `${SITE} · Murrini and cane planner for glassblowers`
}
