import { ColorSwatchCard } from '../components/color-index/ColorSwatchCard'
import { PageHeader } from '../components/PageHeader'
import { COE_NOTE, ENCASEMENT_NOTE, GLASS_COLOR_INDEX } from '../content/glassColorIndex'

// The two notes that apply to every colour sit above the list as plain
// reading, not as cards competing with the swatches.
function Note({ note }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink">{note.title}</h2>
      <p className="mt-2 max-w-[62ch] text-base leading-relaxed text-ink-soft">{note.body}</p>
    </section>
  )
}

export function ColorIndexPage() {
  return (
    <>
      <PageHeader title="Color index" lede="What each glass color is made of, how it behaves at the furnace, and what to watch for." />
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-x-10 gap-y-6 px-4 pb-10 sm:px-8 md:grid-cols-2">
        <Note note={COE_NOTE} />
        <Note note={ENCASEMENT_NOTE} />
      </div>
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
        {GLASS_COLOR_INDEX.map((color) => (
          <ColorSwatchCard key={color.id} color={color} />
        ))}
      </div>
    </>
  )
}
