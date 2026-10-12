import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { COE_NOTE, ENCASEMENT_NOTE, GLASS_COLOR_INDEX } from './src/content/glassColorIndex.js'
import { GLOSSARY, GLOSSARY_ORDER } from './src/content/glossary.js'
import { MURRINI_TECHNIQUES } from './src/content/murrineTechniques.js'
import { TECHNIQUE_ORDER, techniqueSlug } from './src/routes.js'

// The site's public address. Search engines are told this is the one
// real URL for each page (canonical links, sitemap, robots.txt); change it
// here if the project moves to a new domain.
const SITE_URL = 'https://before-the-heat.vercel.app'

const esc = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const shorten = (text, max = 155) => (text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`)

const TECHNIQUES = TECHNIQUE_ORDER.map(({ key }) => ({ key, ...MURRINI_TECHNIQUES[key] })).filter((t) => t.title)

const learnNav = `
        <nav aria-label="Learn">
          <h2>More to learn</h2>
          <ul>
            <li><a href="/learn">All cane and murrini techniques</a></li>
            <li><a href="/learn/glossary">Glossary of glassblowing terms</a></li>
            <li><a href="/learn/colors">Glass color index</a></li>
            <li><a href="/">Plan your own cane in Before The Heat</a></li>
          </ul>
          <ul>${TECHNIQUES.map((t) => `<li><a href="/learn/${techniqueSlug(t.key)}">${esc(t.title)}</a></li>`).join('')}</ul>
        </nav>`

const glossaryList = GLOSSARY_ORDER.map(
  (id) => `<dt>${esc(GLOSSARY[id].term)}</dt><dd>${esc(GLOSSARY[id].definition)}</dd>`,
).join('')

const HOME = {
  path: '/',
  title: 'Before The Heat · Murrini and cane planner for glassblowers',
  description:
    'Plan murrini, cane and blown vessels before you get to the furnace. Draw your cane at true scale in real glass colors, then print a shop plan: build order, casing, pull size and twist.',
  body: `
        <h1>Before The Heat: a murrini and cane planner for glassblowers</h1>
        <p>Plan murrini, cane and blown vessels before you get to the furnace. Before The Heat draws your cane at true scale in real glass colors, then turns it into a shop plan you can print: build order, casing, pull size and twist.</p>
        <ul>
          <li>Murrini and cane: start from a recipe (bullseye, flower, zanfirico, tripod, cross, frame) or build your own cross-section.</li>
          <li>Vessels: see your murrini, cane pick-up or reticello on a tumbler, bowl, vase, pot or plate, with slice and cane counts.</li>
          <li>Shop plan: a printable sheet and a step-by-step checklist, with color compatibility notes.</li>
          <li>Learn: cane and murrini techniques, a glass color index and a glossary of shop words.</li>
        </ul>
        <h2>Glossary of glassblowing terms</h2>
        <dl>${glossaryList}</dl>${learnNav}`,
}

// One real HTML page per Learn address, so each can be found and shared
// on its own. The app takes over as soon as it loads.
const PAGES = [
  HOME,
  {
    path: '/learn',
    title: 'Cane and murrini techniques · Before The Heat',
    description:
      'How real glass cane and murrini are made, step by step: casing, zanfirico, optic molds, jellyroll, pinwheel, bundles and more, from single canes to complex cross-sections.',
    body: `
        <h1>Cane and murrini techniques</h1>
        <p>The real glassblowing methods behind every tool in Before The Heat, in the order you'd learn them: single canes first, bundles last.</p>
        ${TECHNIQUES.map((t) => `<section><h2><a href="/learn/${techniqueSlug(t.key)}">${esc(t.title)}</a></h2><p>${esc(t.summary)}</p></section>`).join('\n        ')}${learnNav}`,
  },
  ...TECHNIQUES.map((t) => ({
    path: `/learn/${techniqueSlug(t.key)}`,
    title: `${t.title}: how it's made · Before The Heat`,
    description: shorten(t.summary),
    body: `
        <h1>${esc(t.title)}</h1>
        <p>${esc(t.summary)}</p>
        <h2>How it's made</h2>
        <ol>${t.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>${
          t.tips
            ? `
        <h2>${esc(t.tips.title)}</h2>
        <p>${esc(t.tips.intro)}</p>
        <ul>${t.tips.items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
            : ''
        }${learnNav}`,
  })),
  {
    path: '/learn/glossary',
    title: 'Glassblowing glossary: cane and murrini terms · Before The Heat',
    description:
      'Plain-language definitions of glassblowing words: gather, pull ratio, casing, marver, pick-up, COE, striking colors, zanfirico, reticello and more.',
    body: `
        <h1>Glassblowing glossary</h1>
        <p>The shop words used in cane and murrini work, in plain language.</p>
        <dl>${glossaryList}</dl>${learnNav}`,
  },
  {
    path: '/learn/colors',
    title: 'Glass color index: what glass colors are made of · Before The Heat',
    description:
      'What each glass color is made of, from cobalt blue to gold ruby: the colorant chemistry, which colors strike or devitrify, and why colors need a matching COE.',
    body: `
        <h1>Glass color index</h1>
        <h2>${esc(COE_NOTE.title)}</h2>
        <p>${esc(COE_NOTE.body)}</p>
        <h2>${esc(ENCASEMENT_NOTE.title)}</h2>
        <p>${esc(ENCASEMENT_NOTE.body)}</p>
        ${GLASS_COLOR_INDEX.map((c) => `<section><h2>${esc(c.name)}</h2><p>${esc(c.colorant)}${c.strikes ? '. Strikes on reheat' : ''}.</p><p>${esc(c.notes)}</p></section>`).join('\n        ')}${learnNav}`,
  },
]

function pageHtml(base, page) {
  const url = `${SITE_URL}${page.path === '/' ? '/' : page.path}`
  return base
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(page.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(page.title)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${esc(page.description)}$2`)
    .replaceAll('%SITE_URL%', url)
    .replaceAll('%SITE_ROOT%', SITE_URL)
    .replace('<div id="root"></div>', `<div id="root"><main class="static-intro">${page.body}\n      </main></div>`)
}

// The app draws everything with JavaScript, which leaves crawlers and link
// previews an empty page. In development the home summary goes in; on a
// build, every address in PAGES gets its own file with its own title,
// description and text.
function searchablePages() {
  let outDir = 'dist'
  return {
    name: 'searchable-pages',
    configResolved(config) {
      outDir = config.build.outDir
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        // On a build the pages are written in closeBundle from this
        // untouched template; in development, show the home summary.
        if (!ctx.server) return html
        return pageHtml(html, HOME)
      },
    },
    closeBundle() {
      const base = readFileSync(join(outDir, 'index.html'), 'utf8')
      for (const page of PAGES) {
        const file = page.path === '/' ? join(outDir, 'index.html') : join(outDir, page.path.slice(1), 'index.html')
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, pageHtml(base, page))
      }
      writeFileSync(
        join(outDir, '404.html'),
        base
          .replace('<head>', '<head>\n    <meta name="robots" content="noindex" />')
          .replace(/<title>[^<]*<\/title>/, '<title>Page not found · Before The Heat</title>')
          .replaceAll('%SITE_URL%', `${SITE_URL}/`)
          .replaceAll('%SITE_ROOT%', SITE_URL),
      )
      writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
      writeFileSync(
        join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.map(
          (page) => `  <url><loc>${SITE_URL}${page.path}</loc></url>`,
        ).join('\n')}\n</urlset>\n`,
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), searchablePages()],
})
