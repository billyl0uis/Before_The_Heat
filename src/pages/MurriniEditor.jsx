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
import { computeShapeReach, SHAPE_TYPES } from '../engine/murrini/shapes'
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
    removeElement,
    beginElementEdit,
    updateElementLive,
    commitElementEdit,
    clearElements,
    undo,
    redo,
    canUndo,
    canRedo,
  } = design
  const [viewMode, setViewMode] = useState('flat')
  const [selectedShape, setSelectedShape] = useState('circle')
  const [params, setParams] = useState(SHAPE_TYPES.circle.defaultParams)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedElementId, setSelectedElementId] = useState(null)
  const selectedElement = elements.find((element) => element.id === selectedElementId) ?? null
  // Selecting/resizing an existing shape only makes sense against the
  // single base cell you're actually editing — with a repeat on, the
  // canvas shows tiled copies at positions that don't match the base
  // cell's own coordinates, so hit-testing against it would pick the
  // wrong thing (or nothing) at the point you actually clicked.
  const canSelect = pattern.repeatType === 'none'

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
  // The second color a compound tool (Jellyroll, Pinwheel, Zanfirico)
  // uses — null means "pick one automatically" (see resolveColorTrio).
  const [accentColorantId, setAccentColorantId] = useState(null)

  // Swap in that shape's own default params whenever the tool changes, so
  // sliders never show a param the current shape type doesn't have.
  // Picking a placement tool is a clear signal you want to place
  // something next, not keep editing whatever was selected — so it also
  // exits Select mode.
  const handleSelectShape = (shapeKey) => {
    setSelectMode(false)
    setSelectedElementId(null)
    setSelectedShape(shapeKey)
    const definition = SHAPE_TYPES[shapeKey] ?? COMPOUND_SHAPE_TYPES[shapeKey]
    setParams(definition.defaultParams)
  }

  const handleToggleSelectMode = () => {
    setSelectMode((prev) => !prev)
    setSelectedElementId(null)
  }

  const handleClear = () => {
    clearElements()
    setSelectedElementId(null)
  }

  const handleEditParamChange = (key, value) => {
    if (!selectedElementId) return
    updateElementLive(selectedElementId, { params: { [key]: value } })
  }

  const handleDeleteSelected = () => {
    if (!selectedElementId) return
    removeElement(selectedElementId)
    setSelectedElementId(null)
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

  // No placement ghost while selecting — a click in Select mode edits an
  // existing shape instead of placing a new one, so a preview of "the
  // next shape to place" would be misleading. `null` isn't a real shape
  // id, so MurriniCanvas's preview lookup naturally hides the mesh.
  const preview = useMemo(
    () => ({ shape: selectMode ? null : selectedShape, params, color: previewColor }),
    [selectMode, selectedShape, params, previewColor],
  )

  // What a compound tool (Jellyroll, Pinwheel, Zanfirico) actually
  // places: your currently selected color as the primary, plus an accent
  // and a casing color — real glass colorants, picked to never collide
  // with whatever you've already chosen. Because this reads the current
  // selection instead of hardcoding fixed colors, the same tool produces
  // a different result each time you change color before clicking,
  // instead of always the same fixed demo. The accent defaults to an
  // automatic contrast but can be overridden (accentColorantId) via the
  // second color picker shown alongside a compound tool.
  const resolveColorTrio = () => {
    const primary = useCustomColor
      ? { swatch: customColor, id: null }
      : (() => {
          const colorant = GLASS_COLOR_INDEX.find((entry) => entry.id === colorantId)
          return { swatch: colorant.swatch, id: colorant.id }
        })()
    const autoAccentId = primary.id === 'opal-white' ? 'black-glass' : 'opal-white'
    const accentEntry =
      GLASS_COLOR_INDEX.find((entry) => entry.id === accentColorantId) ??
      GLASS_COLOR_INDEX.find((entry) => entry.id === autoAccentId)
    const casingId =
      ['cadmium-selenium-red', 'black-glass', 'cobalt-blue'].find(
        (id) => id !== primary.id && id !== accentEntry.id,
      ) ?? 'cobalt-blue'
    const casing = GLASS_COLOR_INDEX.find((entry) => entry.id === casingId)
    return {
      primary,
      accent: { swatch: accentEntry.swatch, id: accentEntry.id },
      casing: { swatch: casing.swatch, id: casing.id },
    }
  }

  // A circular bounding-box hit test (same reach measure used for the
  // casing/nesting geometry checks) — good enough for click-to-select
  // without needing an exact per-shape point-in-polygon test. Checked
  // topmost element first, since later-placed elements render on top.
  const hitTestElement = (x, y) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i]
      const dx = x - element.x
      const dy = y - element.y
      const reach = computeShapeReach(element.shape, element.params)
      if (Math.sqrt(dx * dx + dy * dy) <= reach) return element
    }
    return null
  }

  const handleCanvasClick = (x, y) => {
    if (selectMode) {
      setSelectedElementId(hitTestElement(x, y)?.id ?? null)
      return
    }
    handlePlace(x, y)
  }

  const handlePlace = (x, y) => {
    if (COMPOUND_SHAPE_TYPES[selectedShape]) {
      addElements(buildCompoundElements(selectedShape, x, y, params, resolveColorTrio()))
      // Zanfirico is invisible as anything but a plain casing until it's
      // actually twisted — jump to a sensible twist and the Rod Preview
      // so placing one immediately shows what it's for, instead of
      // leaving a first-time user staring at flat nested circles. Only
      // on the first placement (twist still at its default of 0), so it
      // never overwrites a twist you've already dialed in.
      if (selectedShape === 'zanfirico' && extrusion.twistDegrees === 0) {
        setExtrusion({ ...extrusion, twistDegrees: 360, length: Math.max(extrusion.length, 200) })
        setViewMode('rod')
      }
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
                onPlace={handleCanvasClick}
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
            onClear={handleClear}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            selectMode={selectMode}
            onToggleSelectMode={handleToggleSelectMode}
            canSelect={canSelect}
            selectedElement={selectedElement}
            onEditParamChange={handleEditParamChange}
            onBeginEdit={beginElementEdit}
            onCommitEdit={commitElementEdit}
            onDeleteSelected={handleDeleteSelected}
            accentColorantId={accentColorantId}
            onSelectAccentColorant={setAccentColorantId}
          />
          <PatternControls pattern={pattern} onChange={setPattern} />
          <ExtrusionControls extrusion={extrusion} onChange={setExtrusion} />
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
