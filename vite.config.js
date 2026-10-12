import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { GLOSSARY, GLOSSARY_ORDER } from './src/content/glossary.js'

// The site's public address. Search engines are told this is the one
// real URL (canonical link, sitemap, robots.txt); change it here if the
// project moves to a new domain.
const SITE_URL = 'https://before-the-heat.vercel.app/'

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// The app draws everything with JavaScript, which leaves crawlers and
// link previews an empty page. This writes a plain-HTML summary and the
// glossary into the page itself; React replaces it the moment the app
// starts, so visitors see it at most for an instant while it loads.
function searchableContent() {
  const glossary = GLOSSARY_ORDER.map(
    (id) => `<dt>${escapeHtml(GLOSSARY[id].term)}</dt><dd>${escapeHtml(GLOSSARY[id].definition)}</dd>`,
  ).join('')
  const html = `
      <main class="static-intro">
        <h1>Before The Heat: a murrini and cane planner for glassblowers</h1>
        <p>Plan murrini, cane and blown vessels before you get to the furnace. Before The Heat draws your cane at true scale in real glass colors, then turns it into a shop plan you can print: build order, casing, pull size and twist.</p>
        <ul>
          <li>Murrini and cane: start from a recipe (bullseye, flower, zanfirico, tripod, cross, frame) or build your own cross-section.</li>
          <li>Vessels: see your murrini, cane pick-up or reticello on a tumbler, bowl, vase, pot or plate, with slice and cane counts.</li>
          <li>Shop plan: a printable sheet and a step-by-step checklist, with color compatibility notes.</li>
          <li>Learn: cane and murrini techniques, a glass color index and a glossary of shop words.</li>
        </ul>
        <h2>Glossary of glassblowing terms</h2>
        <dl>${glossary}</dl>
      </main>`
  return {
    name: 'searchable-content',
    transformIndexHtml(page) {
      return page.replace('<div id="root"></div>', `<div id="root">${html}</div>`).replaceAll('%SITE_URL%', SITE_URL)
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}</loc></url>\n</urlset>\n`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), searchableContent()],
})
