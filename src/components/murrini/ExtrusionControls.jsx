import { turnsLabel } from '../../engine/murrini/shopPlan'
import { Panel, Slider } from './Panel'

// Twist in the same words the plan uses, so Advanced, Simple and the
// printed sheet all say "half a turn" for the same cane.
const twistDisplay = (degrees) => (degrees ? `${turnsLabel(degrees)}, ${degrees > 0 ? 'right' : 'left'}` : 'None')

export function ExtrusionControls({ extrusion, onChange }) {
  const setField = (key, value) => onChange({ ...extrusion, [key]: value })

  return (
    <Panel title="Rod extrusion">
      <Slider
        id="extrusion-twist"
        label="Twist"
        value={extrusion.twistDegrees}
        display={twistDisplay(extrusion.twistDegrees)}
        min={-720}
        max={720}
        step={90}
        onChange={(value) => setField('twistDegrees', value)}
      />
      <Slider
        id="extrusion-taper"
        label="Taper"
        value={extrusion.taper}
        display={extrusion.taper ? `${extrusion.taper}%` : 'None'}
        min={0}
        max={90}
        step={5}
        onChange={(value) => setField('taper', value)}
      />
      <Slider
        id="extrusion-length"
        label="3D view length"
        value={extrusion.length}
        display={`${extrusion.length}`}
        min={20}
        max={400}
        step={10}
        onChange={(value) => setField('length', value)}
      />
      <div className="grid grid-cols-2 rounded-lg bg-raise p-0.5" role="group" aria-label="Rod 3D direction">
        {[
          { value: false, label: 'Lengthwise' },
          { value: true, label: 'Sideways' },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={Boolean(extrusion.sideways) === option.value}
            onClick={() => setField('sideways', option.value)}
            className={`min-w-0 rounded-md px-2 py-1.5 text-sm font-semibold ${
              Boolean(extrusion.sideways) === option.value ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-[0.8rem] leading-relaxed text-mute">
        Twist spirals off-centre canes along the rod, the way a zanfirico is made; a cane on the centre has nothing
        to spiral. Taper narrows the far end. View length and direction only change the Rod 3D view.
      </p>
    </Panel>
  )
}
