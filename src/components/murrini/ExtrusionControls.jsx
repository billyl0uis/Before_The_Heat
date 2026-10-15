import { twistLabel } from '../../engine/murrini/shopPlan'
import { Panel, Slider } from './Panel'

// Twist in the same words the plan uses, so Advanced, Simple and the
// printed sheet all say "half a turn" for the same cane.
const twistDisplay = (rod, degrees) =>
  degrees ? `${twistLabel(rod, degrees).replace('a turn every', '1 turn /')}, ${degrees > 0 ? 'right' : 'left'}` : 'None'

export function ExtrusionControls({ extrusion, rod, onChange }) {
  const setField = (key, value) => onChange({ ...extrusion, [key]: value })

  return (
    <Panel title="Twist">
      <Slider
        id="extrusion-twist"
        label="Twist"
        value={extrusion.twistDegrees}
        display={twistDisplay(rod, extrusion.twistDegrees)}
        min={-720}
        max={720}
        step={90}
        onChange={(value) => setField('twistDegrees', value)}
      />
      <p className="text-[0.8rem] leading-relaxed text-mute">
        Twist spirals the canes round the center as the cane is pulled, the way a zanfirico is made. The Cane view
        shows it at this rate.
      </p>
    </Panel>
  )
}
