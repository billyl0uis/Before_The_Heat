import { useState } from 'react'
import { VesselCanvas } from '../components/vessel/VesselCanvas'
import { VesselControls } from '../components/vessel/VesselControls'
import { renderPatternTile } from '../engine/murrini/rasterize'

const STAMP_SIZE = 96

export function VesselEditor({ design, vessel, vesselPattern }) {
  const { params, setParam, reset } = vessel
  const { placements, addPlacement, clearPlacements, undo, redo, canUndo, canRedo } =
    vesselPattern
  const [manualMode, setManualMode] = useState(false)
  const hasPattern = design.elements.length > 0

  const handlePlacePattern = (u, v) => {
    const stampCanvas = renderPatternTile(
      design.elements,
      design.canvas.backgroundColor,
      STAMP_SIZE,
      undefined,
      true,
    )
    addPlacement(u, v, stampCanvas)
  }

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
            manualMode={manualMode}
            placements={placements}
            onPlacePattern={handlePlacePattern}
          />
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={manualMode}
              disabled={!hasPattern}
              onChange={(event) => setManualMode(event.target.checked)}
            />
            Place murrini by hand (click the vessel to press a slice on)
          </label>
          {manualMode && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Redo
              </button>
              <button
                type="button"
                onClick={clearPlacements}
                disabled={placements.length === 0}
                className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          )}
          {!hasPattern && (
            <p className="max-w-[360px] text-xs text-neutral-500">
              Draw something in the Murrini Pattern tab first, then come
              back here and click the vessel to press slices of it onto the
              wall by hand — like pressing real murrini onto a hot gather.
              It's a flat texture, not a real simulation of how the cane
              would stretch when actually blown into this shape.
            </p>
          )}
        </div>
        <VesselControls params={params} onParamChange={setParam} onReset={reset} />
      </div>
    </div>
  )
}
