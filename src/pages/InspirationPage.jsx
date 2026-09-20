const SOURCES = [
  { label: 'Hunting Studio Glass', url: 'http://weshuntingglass.com/wes-hunting' },
  { label: 'Philabaum Glass — Wes Hunting', url: 'https://philabaumglass.com/product-category/wes-hunting' },
  { label: 'Corning Museum of Glass Shop — Wes Hunting', url: 'https://shops.cmog.org/artists/glass-artists/wes-hunting' },
]

export function InspirationPage() {
  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-2xl font-medium text-neutral-100">Inspiration &amp; Credit</h1>
        <p className="mt-1 text-sm text-neutral-400">
          The cane and murrini techniques this app simulates are real. They're
          modeled on the work of glass artists Wes Hunting and his son Wesley
          Hunting.
        </p>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-medium text-neutral-100">Wes &amp; Wesley Hunting</h2>
        <p className="text-sm text-neutral-400">
          Wes Hunting has worked in glass for over thirty years. After
          graduating from Kent State University in 1976, he studied at
          Penland School of Crafts and assisted glass artist Richard Ritter,
          then traveled to Venice and Murano, Italy to study the Italian
          glass tradition firsthand. In 1982 he founded Hunting Glass Studio
          in Princeton, Wisconsin, where he still works today — now
          alongside his son, glass artist Wesley Justin Hunting.
        </p>
        <p className="text-sm text-neutral-400">
          Wes is known for his skill with cane and murrini, and for
          intricate, abstract patterns drawn directly onto hot glass at
          temperatures over 2000°F. He combines Italian techniques —
          millefiori, zanfirico — with decorative methods he's developed and
          refined himself over decades. Together, Wes and Wesley create
          fluid, vibrant vessels and sculptures, each one-of-a-kind.
        </p>
        <p className="text-xs text-neutral-500">
          This app is an independent educational simulation tool. It is not
          affiliated with, endorsed by, or built from proprietary designs
          belonging to Wes or Wesley Hunting — the shapes and patterns you
          make here are your own. The technique references throughout this
          app describe general, real-world glassblowing methods (cane
          pulling, casing, marvering, chevron molds, bundling), and the
          Huntings' work is cited as the inspiration for taking those real
          techniques seriously rather than inventing fictional ones.
        </p>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-medium text-neutral-100">See their work</h2>
        <ul className="flex flex-col gap-1">
          {SOURCES.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-purple-400 hover:underline"
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
