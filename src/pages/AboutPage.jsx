const HUNTING_LINKS = [
  { label: 'Hunting Studio Glass', url: 'http://weshuntingglass.com/wes-hunting' },
  { label: 'Philabaum Glass: Wes Hunting', url: 'https://philabaumglass.com/product-category/wes-hunting' },
  { label: 'Corning Museum of Glass Shop: Wes Hunting', url: 'https://shops.cmog.org/artists/glass-artists/wes-hunting' },
]

// Every reference actually consulted while correcting or adding a
// technique in this app — not a generic bibliography. Each entry maps to
// a real change: VirtualGlass's own cane.cpp is where the Zanfirico
// thread-packing formula and the Tripod/Cross/Row/Grid/Frame geometry
// came from; the reticello construction account (how the trapped-air
// bubble actually forms) came from Conciatore, corroborated against
// Corning Museum of Glass and Wikipedia's Caneworking article. Kept
// current as new sources get used, so this list only ever names things
// this app was actually checked against.
const RESEARCH_SOURCES = [
  {
    label: 'VirtualGlass (github.com/edemaine/virtualglass)',
    url: 'https://github.com/edemaine/virtualglass',
    note:
      "An academic glass-cane CAD tool by Erik Demaine (MIT) and collaborators. Its actual C++ source, not just its docs, is where this app's Zanfirico thread-packing math and the Tripod, Cross, Row, Cane Grid, and Frame bundle tools came from, cross-checked against the real geometry rather than guessed.",
  },
  {
    label: 'Corning Museum of Glass: Cane/Murrine research guide',
    url: 'https://libguides.cmog.org/murrine',
    note: 'General cane and murrine technique and history reference.',
  },
  {
    label: 'Wikipedia: Caneworking',
    url: 'https://en.wikipedia.org/wiki/Caneworking',
    note: 'Background on cane construction techniques and terminology.',
  },
  {
    label: 'Conciatore: Reticello Glass',
    url: 'https://www.conciatore.org/2019/01/reticello-glass.html',
    note:
      "Historical-technique research blog. Its account of how reticello is actually built (two oppositely twisted rib canes blown together, with trapped air forming in the gaps between crossings, not on them) is what the Vessel page's reticello is modelled on.",
  },
  {
    label: 'Glass of Venice: Murano Glass Making Techniques',
    url: 'https://www.glassofvenice.com/blog/murano-glass-making-techniques-filigrana/',
    note: 'Overview of filigrana/zanfirico and related Murano cane techniques.',
  },
]

export function AboutPage() {
  return (
    <div className="flex flex-col items-center gap-6 p-4 sm:p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-2xl font-semibold text-neutral-100">About Before The Heat</h1>
        <p className="mt-1 text-left text-base leading-relaxed text-neutral-400">
          Before The Heat is an independent, educational planning tool. It isn't affiliated with or endorsed
          by Wes or Wesley Hunting, and it isn't built from their designs: the canes and patterns you make
          here are your own.
        </p>
        <p className="mt-3 text-left text-base leading-relaxed text-neutral-400">
          The cane and murrini techniques it plans are real, not invented. Wes and Wesley Hunting's work is why this app takes
          those techniques seriously, and the published references below are what it was checked against.
        </p>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-base font-semibold text-neutral-100">Wes and Wesley Hunting</h2>
        <p className="text-base leading-relaxed text-neutral-400">
          Wes Hunting has worked in glass since the 1970s. After
          graduating from Kent State University in 1976, he studied at
          Penland School of Crafts and assisted glass artist Richard Ritter,
          then traveled to Venice and Murano, Italy to study the Italian
          glass tradition firsthand. In 1982 he founded Hunting Glass Studio
          in Princeton, Wisconsin, where he still works today, now
          alongside his son, glass artist Wesley Justin Hunting.
        </p>
        <p className="text-base leading-relaxed text-neutral-400">
          Wes is known for his skill with cane and murrini, and for
          intricate, abstract patterns drawn directly onto hot glass at
          temperatures over 2000°F. He combines Italian techniques such as
          millefiori and zanfirico with decorative methods he's developed and
          refined himself over decades. Together, Wes and Wesley create
          fluid, vibrant vessels and sculptures, each one-of-a-kind.
        </p>
        <ul className="flex flex-col gap-1">
          {HUNTING_LINKS.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-base text-accent underline-offset-[3px] hover:underline"
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-base font-semibold text-neutral-100">Research and sources</h2>
        <p className="text-base leading-relaxed text-neutral-400">
          Every entry below maps to a specific correction or addition
          somewhere in the app; it isn't a general reading list. The Color Index page documents
          its own colorant chemistry sourcing (Corning Museum of Glass,
          Wikipedia, and patent literature) separately, on each colorant's
          entry.
        </p>
        <ul className="flex flex-col gap-4">
          {RESEARCH_SOURCES.map((source) => (
            <li key={source.url} className="flex flex-col gap-1">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-base text-accent underline-offset-[3px] hover:underline"
              >
                {source.label}
              </a>
              <p className="text-base leading-relaxed text-neutral-400">{source.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
