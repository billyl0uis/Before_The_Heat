import { VesselCanvas } from '../components/vessel/VesselCanvas'
import { VesselControls } from '../components/vessel/VesselControls'
import { useVesselShape } from '../hooks/useVesselShape'

export function VesselEditor() {
  const { params, setParam, reset } = useVesselShape()

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-neutral-100">
          Vessel Morphograph
        </h1>
        <p className="text-sm text-neutral-400">
          Sculpt a vessel silhouette from math — taper, bulge, a spherical
          blend, and a surface ripple. Drag to orbit, scroll to zoom.
        </p>
      </div>
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <VesselCanvas params={params} />
        <VesselControls params={params} onParamChange={setParam} onReset={reset} />
      </div>
    </div>
  )
}
