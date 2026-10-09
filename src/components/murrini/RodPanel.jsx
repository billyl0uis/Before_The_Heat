import { pulledLengthMm } from '../../engine/murrini/rod'
import { Panel, Slider } from './Panel'

export function RodPanel({ rod, onChange }) {
  const set = (key) => (value) => onChange({ ...rod, [key]: value })
  const metres = pulledLengthMm(rod) / 1000

  return (
    <Panel title="Rod">
      <Slider
        id="rod-gather"
        label="Gather diameter"
        value={rod.gatherDiameterMm}
        display={`${rod.gatherDiameterMm} mm`}
        min={12}
        max={60}
        onChange={set('gatherDiameterMm')}
      />
      <Slider
        id="rod-length"
        label="Gather length"
        value={rod.gatherLengthMm}
        display={`${rod.gatherLengthMm} mm`}
        min={20}
        max={300}
        step={10}
        onChange={set('gatherLengthMm')}
      />
      <Slider
        id="rod-ratio"
        label="Pull ratio"
        value={rod.pullRatio}
        display={`${rod.pullRatio} : 1`}
        min={2}
        max={20}
        onChange={set('pullRatio')}
      />
      <p className="text-sm leading-relaxed text-mute">
        Pulling keeps the volume, so length grows by the ratio squared: about{' '}
        <span className="font-mono text-ink">{metres.toFixed(1)} m</span> of cane.
      </p>
    </Panel>
  )
}
