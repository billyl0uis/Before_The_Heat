import { ColorSwatchCard } from '../components/color-index/ColorSwatchCard'
import { COE_NOTE, ENCASEMENT_NOTE, GLASS_COLOR_INDEX } from '../content/glassColorIndex'

function NoteCard({ note }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-sm font-medium text-neutral-100">{note.title}</h2>
      <p className="text-sm leading-relaxed text-neutral-300">{note.body}</p>
    </div>
  )
}

export function ColorIndexPage() {
  return (
    <div className="flex flex-col items-center gap-6 p-4 sm:p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-2xl font-medium text-neutral-100">Color Index</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Real glass colorant chemistry — what each color is actually made of,
          and the physical properties that come with it. This is a reference
          catalog, not a live analysis of whatever hex value the pattern
          editor's color picker is set to: an arbitrary RGB value doesn't
          correspond to a specific real compound.
        </p>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
        <NoteCard note={COE_NOTE} />
        <NoteCard note={ENCASEMENT_NOTE} />
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GLASS_COLOR_INDEX.map((color) => (
          <ColorSwatchCard key={color.id} color={color} />
        ))}
      </div>
    </div>
  )
}
