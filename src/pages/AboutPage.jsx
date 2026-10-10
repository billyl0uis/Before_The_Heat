import { PageHeader } from '../components/PageHeader'

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

const linkClass = 'font-semibold text-accent underline decoration-accent/40 underline-offset-[3px] hover:decoration-accent'

export function AboutPage() {
  return (
    <div className="pb-16">
      <PageHeader
        title="About Before The Heat"
        lede="Before The Heat is an independent, educational planning tool. It isn't affiliated with or endorsed by Wes or Wesley Hunting, and it isn't built from their designs: the canes and patterns you make here are your own."
      >
        <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-mute">
          The cane and murrini techniques it plans are real, not invented. Wes and Wesley Hunting's work is why
          this app takes those techniques seriously, and the published references below are what it was checked
          against.
        </p>
      </PageHeader>

      <div className="mx-auto grid w-full max-w-5xl gap-12 px-4 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <section>
          <h2 className="text-[1.6rem] leading-tight font-bold tracking-tight">Wes and Wesley Hunting</h2>
          <div className="mt-4 flex max-w-[62ch] flex-col gap-4 text-base leading-relaxed text-ink-soft">
            <p>
              Wes Hunting has worked in glass since the 1970s. After graduating from Kent State University in 1976,
              he studied at Penland School of Crafts and assisted glass artist Richard Ritter, then traveled to
              Venice and Murano, Italy to study the Italian glass tradition firsthand. In 1982 he founded Hunting
              Glass Studio in Princeton, Wisconsin, where he still works today, now alongside his son, glass artist
              Wesley Justin Hunting.
            </p>
            <p>
              Wes is known for his skill with cane and murrini, and for intricate, abstract patterns drawn directly
              onto hot glass at temperatures over 2000°F. He combines Italian techniques such as millefiori and
              zanfirico with decorative methods he's developed and refined himself over decades. Together, Wes and
              Wesley create fluid, vibrant vessels and sculptures, each one-of-a-kind.
            </p>
          </div>
          <ul className="mt-5 flex flex-col gap-2">
            {HUNTING_LINKS.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer" className={linkClass}>
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-[1.6rem] leading-tight font-bold tracking-tight">Research and sources</h2>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-ink-soft">
            Every entry below maps to a specific correction or addition somewhere in the app; it isn't a general
            reading list. The Color index documents its own colorant chemistry sourcing (Corning Museum of Glass,
            Wikipedia, and patent literature) on each colorant's entry.
          </p>
          <ul className="mt-5 flex flex-col divide-y divide-line border-y border-line">
            {RESEARCH_SOURCES.map((source) => (
              <li key={source.url} className="flex flex-col gap-1 py-4">
                <a href={source.url} target="_blank" rel="noreferrer" className={linkClass}>
                  {source.label}
                </a>
                <p className="max-w-[62ch] text-sm leading-relaxed text-mute">{source.note}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
