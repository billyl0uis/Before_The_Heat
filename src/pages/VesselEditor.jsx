import { useState } from 'react'
import { ProfileCurveEditor } from '../components/vessel/ProfileCurveEditor'
import { VesselCanvas } from '../components/vessel/VesselCanvas'
import { VesselControls } from '../components/vessel/VesselControls'
import { renderPatternTile } from '../engine/murrini/rasterize'
import { useResponsiveCanvasSize } from '../hooks/useResponsiveCanvasSize'

const STAMP_SIZE = 96
const DEFAULT_STAMP_FRACTION = 0.16

export function VesselEditor({ design, vessel, vesselPattern }) {
  const {
    params,
    setParam,
    reset,
    freeform,
    enterFreeform,
    exitFreeform,
    controlRadii,
    setControlRadius,
  } = vessel
  const { placements, addPlacement, clearPlacements, undo, redo, canUndo, canRedo } =
    vesselPattern
  const [manualMode, setManualMode] = useState(false)
  const [stampFraction, setStampFraction] = useState(DEFAULT_STAMP_FRACTION)
  const hasPattern = design.elements.length > 0
  const { containerRef: canvasContainerRef, size: canvasSize } = useResponsiveCanvasSize(
    360,
    420 / 360,
  )

  const handlePlacePattern = (u, v) => {
    const stampCanvas = renderPatternTile(
      design.elements,
      design.canvas.backgroundColor,
      STAMP_SIZE,
      undefined,
      true,
    )
    addPlacement(u, v, stampCanvas, stampFraction)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4 sm:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-neutral-100">
          Vessel Morphograph
        </h1>
        <p className="text-sm text-neutral-400">
          Sculpt a vessel silhouette from math — taper, bulge, a spherical
          blend, and a surface ripple. Drag to orbit, scroll to zoom.
        </p>
      </div>
      <div className="flex w-full min-w-0 flex-col items-start gap-6 lg:flex-row">
        <div className="flex w-full min-w-0 flex-col gap-3 lg:w-auto">
          <div ref={canvasContainerRef} className="w-full min-w-0" style={{ maxWidth: 360 }}>
            <VesselCanvas
              params={params}
              freeform={freeform}
              controlRadii={controlRadii}
              manualMode={manualMode}
              placements={placements}
              onPlacePattern={handlePlacePattern}
              width={canvasSize.width}
              height={canvasSize.height}
            />
          </div>
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
            <label className="flex flex-col gap-1 text-sm text-neutral-300">
              Slice size: {Math.round(stampFraction * 100)}%
              <input
                type="range"
                min={0.06}
                max={0.35}
                step={0.01}
                value={stampFraction}
                onChange={(event) => setStampFraction(Number(event.target.value))}
              />
            </label>
          )}
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
            <p className="max-w-[360px] text-sm text-neutral-400">
              Draw something in the Murrini Pattern tab first, then come
              back here and click the vessel to press slices of it onto the
              wall by hand — like pressing real murrini onto a hot gather.
              It's a flat texture, not a real simulation of how the cane
              would stretch when actually blown into this shape.
            </p>
          )}
        </div>
        {freeform && (
          <ProfileCurveEditor controlRadii={controlRadii} onChangeRadius={setControlRadius} />
        )}
        <VesselControls
          params={params}
          onParamChange={setParam}
          onReset={reset}
          freeform={freeform}
          onEnterFreeform={enterFreeform}
          onExitFreeform={exitFreeform}
        />
      </div>
    </div>
  )
}
