import { useMemo, useState } from 'react'
import { ProfileCurveEditor } from '../components/vessel/ProfileCurveEditor'
import { VesselCanvas } from '../components/vessel/VesselCanvas'
import { VesselControls } from '../components/vessel/VesselControls'
import { GLASS_COLOR_INDEX } from '../content/glassColorIndex'
import { renderSlicePlate } from '../engine/murrini/slicePlate'
import { useResponsiveCanvasSize } from '../hooks/useResponsiveCanvasSize'

const STAMP_SIZE = 96
const DEFAULT_STAMP_FRACTION = 0.16
const RETICELLO_TEXTURE_SIZE = 512
const DEFAULT_RETICELLO_DENSITY = 8
const DEFAULT_RETICELLO_COLOR_A = 'opal-white'
const DEFAULT_RETICELLO_COLOR_B = 'cobalt-blue'
// The field between the crossed rib canes: each rib is a thin colored
// thread pulled in a mostly-clear casing (the same "clear glass gathered
// over" step the Zanfirico tool's casing color stands in for), not the
// pattern editor's own dark UI canvas background. Needs to be a genuinely
// different LUMINANCE from opal white (#f5f5f4, this tool's own default
// thread color) -- a near-white base was nearly indistinguishable from a
// white thread and washed the whole pattern out.
const RETICELLO_BASE_COLOR = '#aab4bd'

function colorSwatch(id) {
  return GLASS_COLOR_INDEX.find((entry) => entry.id === id)?.swatch ?? '#ffffff'
}

export function VesselEditor({ design, vessel, vesselPattern }) {
  const {
    params,
    setParam,
    applyPreset,
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
  // Reticello is a whole-surface technique in real glasswork (see
  // engine/vessel/reticello.js) — genuinely different from the hand-placed
  // murrini stamps above, so it's its own mode rather than another stamp
  // option, and mutually exclusive with manual placement (the vessel
  // texture can show one or the other, not both at once).
  const [reticelloMode, setReticelloMode] = useState(false)
  const [reticelloDensity, setReticelloDensity] = useState(DEFAULT_RETICELLO_DENSITY)
  const [reticelloColorAId, setReticelloColorAId] = useState(DEFAULT_RETICELLO_COLOR_A)
  const [reticelloColorBId, setReticelloColorBId] = useState(DEFAULT_RETICELLO_COLOR_B)
  const hasPattern = design.elements.length > 0
  const { containerRef: canvasContainerRef, size: canvasSize } = useResponsiveCanvasSize(
    360,
    420 / 360,
  )

  const handleSetManualMode = (checked) => {
    setManualMode(checked)
    if (checked) setReticelloMode(false)
  }

  const handleSetReticelloMode = (checked) => {
    setReticelloMode(checked)
    if (checked) setManualMode(false)
  }

  // A murrine pressed onto a gather is a whole slice of the cane: every
  // repeat of the pattern plus its casing rings, cut round. Stamping only
  // the drawn base cell showed a fragment the plan never builds.
  const handlePlacePattern = (u, v) => {
    const stampCanvas = renderSlicePlate({
      elements: design.repeatedElements,
      rod: design.rod,
      casing: design.casing,
      size: STAMP_SIZE,
    })
    addPlacement(u, v, stampCanvas, stampFraction)
  }

  // cellSize has to evenly divide the texture so the diagonal grid tiles
  // seamlessly across the vessel's UV wrap seam -- deriving it from an
  // integer density (cells across) guarantees that, rather than letting a
  // slider pick an arbitrary pixel size.
  const reticelloParams = useMemo(
    () => ({
      baseColor: RETICELLO_BASE_COLOR,
      threadColorA: colorSwatch(reticelloColorAId),
      threadColorB: colorSwatch(reticelloColorBId),
      cellSize: RETICELLO_TEXTURE_SIZE / reticelloDensity,
      threadWidth: Math.max(2, RETICELLO_TEXTURE_SIZE / reticelloDensity / 8),
    }),
    [reticelloColorAId, reticelloColorBId, reticelloDensity],
  )

  return (
    <div className="flex flex-col items-center gap-6 p-4 sm:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-neutral-100">
          Vessel Morphograph
        </h1>
        <p className="text-left text-base leading-relaxed text-neutral-400">
          Shape a vessel. Drag to rotate, scroll to zoom.
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
              reticelloMode={reticelloMode}
              reticelloParams={reticelloParams}
              width={canvasSize.width}
              height={canvasSize.height}
            />
          </div>
          <label className="flex items-center gap-2 text-base text-neutral-300">
            <input
              type="checkbox"
              checked={manualMode}
              disabled={!hasPattern}
              onChange={(event) => handleSetManualMode(event.target.checked)}
            />
            Place murrini by hand
          </label>
          {manualMode && (
            <label className="flex flex-col gap-1 text-base text-neutral-300">
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
                className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-base text-neutral-300 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-base text-neutral-300 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Redo
              </button>
              <button
                type="button"
                onClick={clearPlacements}
                disabled={placements.length === 0}
                className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-base text-neutral-300 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          )}
          {!hasPattern && (
            <p className="max-w-[360px] text-base leading-relaxed text-neutral-400">
              Make a pattern in the Murrini tab to press it onto the vessel.
            </p>
          )}

          <label className="flex items-center gap-2 text-base text-neutral-300">
            <input
              type="checkbox"
              checked={reticelloMode}
              onChange={(event) => handleSetReticelloMode(event.target.checked)}
            />
            Reticello wrap
          </label>
          {reticelloMode && (
            <>
              <label className="flex flex-col gap-1 text-base text-neutral-300">
                Thread density: {reticelloDensity}
                <input
                  type="range"
                  min={4}
                  max={16}
                  step={1}
                  value={reticelloDensity}
                  onChange={(event) => setReticelloDensity(Number(event.target.value))}
                />
              </label>
              <div className="flex flex-col gap-2">
                <p className="text-base text-neutral-300">Rib cane colors</p>
                <div className="flex flex-wrap items-center gap-2">
                  {GLASS_COLOR_INDEX.map((colorant) => (
                    <button
                      key={colorant.id}
                      type="button"
                      title={colorant.name}
                      aria-label={`${colorant.name} — click to set rib A, shift-click for rib B`}
                      onClick={(event) =>
                        event.shiftKey
                          ? setReticelloColorBId(colorant.id)
                          : setReticelloColorAId(colorant.id)
                      }
                      className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: colorant.swatch,
                        borderColor:
                          colorant.id === reticelloColorAId
                            ? '#ffffff'
                            : colorant.id === reticelloColorBId
                              ? '#a855f7'
                              : 'transparent',
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-neutral-500">
                  Click for color A, shift-click for color B.
                </p>
              </div>
            </>
          )}
        </div>
        {freeform && (
          <ProfileCurveEditor controlRadii={controlRadii} onChangeRadius={setControlRadius} />
        )}
        <VesselControls
          params={params}
          onParamChange={setParam}
          onApplyPreset={applyPreset}
          onReset={reset}
          freeform={freeform}
          onEnterFreeform={enterFreeform}
          onExitFreeform={exitFreeform}
        />
      </div>
    </div>
  )
}
