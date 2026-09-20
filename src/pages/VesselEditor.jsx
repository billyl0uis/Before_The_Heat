import { useState } from 'react'
import { VesselCanvas } from '../components/vessel/VesselCanvas'
import { VesselControls } from '../components/vessel/VesselControls'

export function VesselEditor({ design, vessel }) {
  const { params, setParam, reset } = vessel
  const [showPattern, setShowPattern] = useState(false)
  const hasPattern = design.elements.length > 0

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
        <div className="flex flex-col gap-3">
          <VesselCanvas
            params={params}
            patternElements={showPattern ? design.repeatedElements : null}
            patternCanvas={design.canvas}
          />
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={showPattern}
              disabled={!hasPattern}
              onChange={(event) => setShowPattern(event.target.checked)}
            />
            Show murrini pattern on vessel
          </label>
          {!hasPattern && (
            <p className="max-w-[360px] text-xs text-neutral-500">
              Draw something in the Murrini Pattern tab first — this wraps
              that pattern onto the vessel wall. It's a flat texture wrap,
              not a real simulation of how the cane would stretch when
              actually blown into this shape.
            </p>
          )}
        </div>
        <VesselControls params={params} onParamChange={setParam} onReset={reset} />
      </div>
    </div>
  )
}
