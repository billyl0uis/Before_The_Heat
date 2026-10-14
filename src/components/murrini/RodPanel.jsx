import { pulledLengthMm } from '../../engine/murrini/rod'
import { FillGap } from '../FillChoice'
import { Panel, Slider } from './Panel'

export function RodPanel({ rod, onChange, balance = null, onGrow = null }) {
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
      {balance && onGrow && <FillGap balance={balance} onGrow={onGrow} />}
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
        {/* The finished size, so Advanced speaks in the same terms as Simple's
            Size step: you set the gather, this is the cane it makes. */}
        Pulls to a{' '}
        <span className="font-mono text-ink">
          Ø {(rod.gatherDiameterMm / rod.pullRatio).toLocaleString('en', { maximumFractionDigits: 1 })} mm
        </span>{' '}
        cane, about <span className="font-mono text-ink">{metres.toFixed(1)} m</span> of it. Pulling keeps the volume, so
        length grows by the ratio squared.
      </p>
    </Panel>
  )
}
