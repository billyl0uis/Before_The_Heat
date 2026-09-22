import { lazy, Suspense, useMemo, useState } from 'react'
import { BuildPlan } from '../components/murrini/BuildPlan'
import { ColorantPicker } from '../components/murrini/ColorantPicker'
import { CompatibilityCheck } from '../components/murrini/CompatibilityCheck'
import { ExtrusionControls } from '../components/murrini/ExtrusionControls'
import { MurriniCanvas } from '../components/murrini/MurriniCanvas'
import { PatternControls } from '../components/murrini/PatternControls'
import { ShapeToolbar } from '../components/murrini/ShapeToolbar'
import { TechniqueReference } from '../components/murrini/TechniqueReference'
import { GLASS_COLOR_INDEX } from '../content/glassColorIndex'
import { checkColorCompatibility } from '../engine/murrini/colorCompatibility'
import { buildCompoundElements, COMPOUND_SHAPE_TYPES } from '../engine/murrini/compoundShapes'
import { DEFAULT_EXTRUSION } from '../engine/murrini/extrude'
import { SHAPE_TYPES } from '../engine/murrini/shapes'
import { useResponsiveCanvasSize } from '../hooks/useResponsiveCanvasSize'

// Lazy so OrbitControls (and its ~370KB chunk, shared with the Vessel tab)
// only loads if Rod Preview is actually opened — most visits stay on the
// flat pattern view and never need it.
const RodPreviewCanvas = lazy(() =>
  import('../components/murrini/RodPreviewCanvas').then((m) => ({
    default: m.RodPreviewCanvas,
  })),
)

export function MurriniEditor({ design }) {
  const {
    canvas,
    elements,
    repeatedElements,
    pattern,
    setPattern,
    extrusion,
    setExtrusion,
    addElement,
    addElements,
    clearElements,
    undo,
    redo,
    canUndo,
    canRedo,
  } = design
  const [viewMode, setViewMode] = useState('flat')
  const [selectedShape, setSelectedShape] = useState('circle')
  const [params, setParams] = useState(SHAPE_TYPES.circle.defaultParams)

  // Both canvases cap at their normal desktop size but shrink to fit a
  // narrow screen instead of forcing horizontal scrolling.
  const { containerRef: flatContainerRef, size: flatSize } = useResponsiveCanvasSize(
    canvas.width,
    canvas.height / canvas.width,
  )
  const { containerRef: rodContainerRef, size: rodSize } = useResponsiveCanvasSize(360, 420 / 360)

  const [colorantId, setColorantId] = useState(GLASS_COLOR_INDEX[0].id)
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [customColor, setCustomColor] = useState('#c084fc')

  // Swap in that shape's own default params whenever the tool changes, so
  // sliders never show a param the current shape type doesn't have.
  const handleSelectShape = (shapeKey) => {
    setSelectedShape(shapeKey)
    const definition = SHAPE_TYPES[shapeKey] ?? COMPOUND_SHAPE_TYPES[shapeKey]
    setParams(definition.defaultParams)
  }

  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const compatibilityWarnings = useMemo(
    () => checkColorCompatibility(elements),
    [elements],
  )

  // What handlePlace would actually place right now — used to render the
  // hover preview so it always matches the real click outcome exactly.
  const previewColor = useMemo(() => {
    if (useCustomColor) return customColor
    const colorant = GLASS_COLOR_INDEX.find((entry) => entry.id === colorantId)
    return colorant?.swatch ?? customColor
  }, [useCustomColor, customColor, colorantId])

  const preview = useMemo(
    () => ({ shape: selectedShape, params, color: previewColor }),
    [selectedShape, params, previewColor],
  )

  // What a compound tool (Jellyroll, Pinwheel) actually places: your
  // currently selected color as the primary, plus an automatically
  // chosen contrasting accent and casing color — real glass colorants,
  // picked to never collide with whatever you've already chosen. Because
  // this reads the current selection instead of hardcoding fixed colors,
  // the same tool produces a different result each time you change color
  // before clicking, instead of always the same fixed demo.
  const resolveColorTrio = () => {
    const primary = useCustomColor
      ? { swatch: customColor, id: null }
      : (() => {
          const colorant = GLASS_COLOR_INDEX.find((entry) => entry.id === colorantId)
          return { swatch: colorant.swatch, id: colorant.id }
        })()
    const accentId = primary.id === 'opal-white' ? 'black-glass' : 'opal-white'
    const accent = GLASS_COLOR_INDEX.find((entry) => entry.id === accentId)
    const casingId =
      ['cadmium-selenium-red', 'black-glass', 'cobalt-blue'].find(
        (id) => id !== primary.id && id !== accentId,
      ) ?? 'cobalt-blue'
    const casing = GLASS_COLOR_INDEX.find((entry) => entry.id === casingId)
    return {
      primary,
      accent: { swatch: accent.swatch, id: accent.id },
      casing: { swatch: casing.swatch, id: casing.id },
    }
  }

  const handlePlace = (x, y) => {
    if (COMPOUND_SHAPE_TYPES[selectedShape]) {
      addElements(buildCompoundElements(selectedShape, x, y, params, resolveColorTrio()))
      return
    }
    if (useCustomColor) {
      addElement(selectedShape, x, y, { color: customColor, params, colorantId: null })
      return
    }
    const colorant = GLASS_COLOR_INDEX.find((entry) => entry.id === colorantId)
    addElement(selectedShape, x, y, {
      color: colorant.swatch,
      params,
      colorantId: colorant.id,
    })
  }

  // A spiral cane (filigrana/reticello) is a real, specific setup: a base
  // color with one thin accent thread off-center, then the whole bundle
  // twisted as it's pulled — the twist rotates that off-center thread into
  // a visible helix along the rod's length. Twisting a shape sitting dead
  // center (like a single plain circle) is invisible, since there's
  // nothing off-axis to spiral — that's the gap this preset closes: it
  // sets up geometry the twist can actually show.
  const handleSpiralPreset = () => {
    clearElements()
    const base = GLASS_COLOR_INDEX.find((entry) => entry.id === 'cobalt-blue')
    const accent = GLASS_COLOR_INDEX.find((entry) => entry.id === 'opal-white')
    const baseRadius = 20
    const accentRadius = 4
    addElement('circle', 0, 0, {
      color: base.swatch,
      colorantId: base.id,
      params: { radius: baseRadius },
    })
    // Placed just outside the base cane's radius, tangent to its surface
    // — like a thread trailed onto the outside of a gather before it's
    // pulled. This also sidesteps a real rendering limit: the Rod Preview
    // extrudes each element as its own separate solid mesh (only the
    // built-in Ring shape is one true shape-with-a-hole), so two opaque
    // meshes with overlapping volume just occlude/z-fight each other
    // instead of compositing into a visible layered surface. Placing the
    // accent so the two volumes only touch, never overlap, avoids that
    // entirely.
    addElement('circle', baseRadius + accentRadius, 0, {
      color: accent.swatch,
      colorantId: accent.id,
      params: { radius: accentRadius },
    })
    setExtrusion({ ...DEFAULT_EXTRUSION, length: 220, twistDegrees: 360 })
    setViewMode('rod')
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4 sm:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-neutral-100">
          Murrini Pattern Engine
        </h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Pick a shape and a real glass color, then click the canvas to place
          it. Turn on a repeat to see it as a full cane cross-section.
        </p>
      </div>
      <div className="flex w-full min-w-0 flex-col items-start gap-6 lg:flex-row">
        <div className="flex w-full min-w-0 flex-col gap-3 lg:w-auto">
          <div className="flex gap-2">
            {[
              { key: 'flat', label: 'Flat pattern' },
              { key: 'rod', label: 'Rod preview (3D)' },
            ].map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setViewMode(mode.key)}
                className={`rounded px-3 py-1.5 text-base transition-colors ${
                  mode.key === viewMode
                    ? 'bg-purple-500 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          {viewMode === 'flat' ? (
            <div ref={flatContainerRef} className="w-full min-w-0" style={{ maxWidth: canvas.width }}>
              <MurriniCanvas
                canvas={canvas}
                elements={repeatedElements}
                onPlace={handlePlace}
                preview={preview}
                displayWidth={flatSize.width}
                displayHeight={flatSize.height}
              />
            </div>
          ) : (
            <div ref={rodContainerRef} className="w-full min-w-0" style={{ maxWidth: 360 }}>
              <Suspense
                fallback={
                  <div
                    className="flex items-center justify-center rounded-lg border border-neutral-800 text-base text-neutral-400"
                    style={{ width: rodSize.width, height: rodSize.height }}
                  >
                    Loading 3D preview…
                  </div>
                }
              >
                <RodPreviewCanvas
                  elements={repeatedElements}
                  extrusion={extrusion}
                  width={rodSize.width}
                  height={rodSize.height}
                />
              </Suspense>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-6">
          <ShapeToolbar
            selectedShape={selectedShape}
            onSelectShape={handleSelectShape}
            params={params}
            onParamChange={handleParamChange}
            onClear={clearElements}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
          <PatternControls pattern={pattern} onChange={setPattern} />
          <ExtrusionControls
            extrusion={extrusion}
            onChange={setExtrusion}
            onSpiralPreset={handleSpiralPreset}
          />
        </div>
        <div className="flex flex-col gap-6">
          <ColorantPicker
            colorantId={colorantId}
            onSelectColorant={setColorantId}
            useCustom={useCustomColor}
            onToggleCustom={setUseCustomColor}
            customColor={customColor}
            onCustomColorChange={setCustomColor}
          />
          <CompatibilityCheck warnings={compatibilityWarnings} />
          <TechniqueReference elements={elements} shape={selectedShape} params={params} />
          <BuildPlan elements={elements} />
        </div>
      </div>
    </div>
  )
}
