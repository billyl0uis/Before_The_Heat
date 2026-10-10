import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/icons'
import { ModeSwitch } from '../components/ModeSwitch'
import { CasingPanel } from '../components/murrini/CasingPanel'
import { ColorChart } from '../components/murrini/ColorChart'
import { CompatibilityCheck } from '../components/murrini/CompatibilityCheck'
import { ExtrusionControls } from '../components/murrini/ExtrusionControls'
import { PatternControls } from '../components/murrini/PatternControls'
import { RodPanel } from '../components/murrini/RodPanel'
import { RodSlice } from '../components/murrini/RodSlice'
import { TechniqueReference } from '../components/murrini/TechniqueReference'
import { TOOL_KEYS } from '../components/murrini/toolKeys'
import { ToolRail } from '../components/murrini/ToolRail'
import { GLASS_COLOR_INDEX } from '../content/glassColorIndex'
import { buildCompoundElements, COMPOUND_SHAPE_TYPES } from '../engine/murrini/compoundShapes'
import { pulledDiameterMm, pulledLengthMm } from '../engine/murrini/rod'
import { computeShapeReach, SHAPE_TYPES } from '../engine/murrini/shapes'
import { describePlacement } from '../engine/murrini/placement'
import { buildShopPlan, shopPlanWarnings, usedColorants } from '../engine/murrini/shopPlan'
import { useResponsiveCanvasSize } from '../hooks/useResponsiveCanvasSize'
import { useSliceGeometry } from '../hooks/useSliceGeometry'

const DOCK = [
  { key: 'tools', label: 'Tools', icon: 'tools' },
  { key: 'colour', label: 'Color', icon: 'colour' },
  { key: 'casing', label: 'Rod', icon: 'casing' },
  { key: 'plan', label: 'Plan', icon: 'plan' },
]

// Lazy so OrbitControls (and its ~370KB chunk, shared with the Vessel tab)
// only loads if Rod Preview is actually opened — most visits stay on the
// flat pattern view and never need it.
const RodPreviewCanvas = lazy(() =>
  import('../components/murrini/RodPreviewCanvas').then((m) => ({
    default: m.RodPreviewCanvas,
  })),
)

export function MurriniEditor({ design, onOpenPlan, onMode }) {
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
    rod,
    setRod,
    casing,
    addCasingLayer,
    removeCasingLayer,
    moveCasingLayer,
    updateCasingLayer,
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
  const { containerRef: flatContainerRef, size: flatSize } = useResponsiveCanvasSize(520, 1)
  const [dock, setDock] = useState('tools')
  const [notice, setNotice] = useState(null)
  const { containerRef: rodContainerRef, size: rodSize } = useResponsiveCanvasSize(360, 420 / 360)

  const [colorantId, setColorantId] = useState(GLASS_COLOR_INDEX[0].id)
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [customColor, setCustomColor] = useState('#f2762e')
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
    () => shopPlanWarnings({ elements, casing }),
    [elements, casing],
  )
  const planSteps = useMemo(
    () => buildShopPlan({ elements, pattern, rod, casing, extrusion }),
    [elements, pattern, rod, casing, extrusion],
  )
  // Coloured glass only: clear isn't a colorant to test, and the
  // compatibility warning counts the same way, so the numbers agree.
  const colorantCount = useMemo(
    () => usedColorants({ elements, casing }).filter((colorant) => colorant.id !== 'clear').length,
    [elements, casing],
  )

  // The rod as the canvas draws it: casing rings in world units and the
  // room left inside them for canes. Memoised so the WebGL scene only
  // rebuilds its rings when the rod or casing actually change.
  const slice = useSliceGeometry(rod, casing)

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
    if (!selectMode && Math.hypot(x, y) > slice.contentRadius) {
      setNotice('Place canes inside the rod. The outer rings are casing.')
      return
    }
    setNotice(null)
    if (selectMode) {
      setSelectedElementId(hitTestElement(x, y)?.id ?? null)
      return
    }
    handlePlace(x, y)
  }

  // Say what a placement does to the plan, rather than letting it change
  // quietly: a cane inside another becomes part of it, and canes that cut
  // into each other can't exist in a real bundle.
  const reportPlacement = (placed) => {
    const result = describePlacement(elements, placed)
    if (!result) return setNotice(null)
    setNotice(
      result.kind === 'inside'
        ? `This sits inside ${result.other}, so the plan pulls them as one cane. ⌘Z to undo.`
        : `This overlaps ${result.other}. Canes in a bundle can only touch: move it apart, or ⌘Z to undo.`,
    )
  }

  const handlePlace = (x, y) => {
    if (COMPOUND_SHAPE_TYPES[selectedShape]) {
      const specs = buildCompoundElements(selectedShape, x, y, params, resolveColorTrio())
      addElements(specs)
      reportPlacement(specs.map((spec) => ({ ...spec, compoundId: spec.compoundId ?? 'new' })))
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
    reportPlacement([{ shape: selectedShape, x, y, params }])
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

  // Keyboard: undo/redo, delete the selected shape, Esc leaves Select,
  // and number keys pick the first nine tools in rail order.
  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target.tagName
      const typing =
        tag === 'TEXTAREA' || (tag === 'INPUT' && event.target.type !== 'range' && event.target.type !== 'checkbox')
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElementId) {
        event.preventDefault()
        removeElement(selectedElementId)
        setSelectedElementId(null)
      } else if (event.key === 'Escape' && selectMode) {
        setSelectMode(false)
        setSelectedElementId(null)
      } else if (/^[1-9]$/.test(event.key)) {
        const key = TOOL_KEYS[Number(event.key) - 1]
        if (key) handleSelectShape(key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const onDock = (key) => (dock === key ? '' : 'max-lg:hidden')

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] lg:h-[calc(100svh-3.5rem)] lg:grid-cols-[232px_minmax(0,1fr)_344px] lg:grid-rows-[minmax(0,1fr)_auto]">
      <aside
        className={`flex min-w-0 flex-col gap-5 overflow-x-hidden overflow-y-auto border-line bg-panel p-4 lg:border-r ${onDock('tools')}`}
        aria-label="Tools"
      >
        <ToolRail
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
        <TechniqueReference elements={elements} shape={selectedShape} params={params} />
      </aside>

      <section
        aria-label="Cross-section"
        className="max-lg:order-first max-lg:sticky max-lg:top-14 max-lg:z-10 flex min-h-0 flex-col items-center justify-center gap-2 border-b border-line bg-ground px-4 py-2 lg:gap-4 lg:row-start-1 lg:col-start-2 lg:border-b-0 lg:py-6"
      >
        <div className="flex w-full max-w-[520px] items-center justify-between gap-3">
          <div className="inline-flex rounded-lg bg-raise p-0.5" role="group" aria-label="View">
            {[
              { key: 'flat', label: 'Slice' },
              { key: 'rod', label: 'Rod 3D' },
            ].map((mode) => (
              <button
                key={mode.key}
                type="button"
                aria-pressed={viewMode === mode.key}
                onClick={() => setViewMode(mode.key)}
                className={`rounded-md px-3 py-1 text-sm font-semibold max-sm:min-h-[44px] ${
                  viewMode === mode.key ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          {onMode && <ModeSwitch mode="advanced" onChange={onMode} className="sm:hidden" />}
          <p className="text-right text-xs text-mute max-sm:hidden">
            {viewMode === 'flat' && 'True scale · 1 tick = 1 mm · '}
            <kbd className="font-mono">⌘Z</kbd> undo
          </p>
        </div>

        {viewMode === 'flat' ? (
          <div ref={flatContainerRef} className="flex w-full max-w-[min(520px,calc(100svh-20rem))] justify-center max-lg:max-w-[min(300px,30svh)]">
            <RodSlice
              canvas={canvas}
              elements={repeatedElements}
              slice={slice}
              rod={rod}
              onPlace={handleCanvasClick}
              preview={preview}
              size={flatSize.width}
            />
          </div>
        ) : (
          <div ref={rodContainerRef} className="w-full min-w-0" style={{ maxWidth: 360 }}>
            <Suspense
              fallback={
                <div
                  className="flex items-center justify-center rounded-lg border border-line text-sm text-mute"
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
        <p role="status" aria-live="polite" className="text-sm text-amber-300 empty:hidden lg:min-h-5 lg:empty:block">
          {notice}
        </p>
      </section>

      <aside
        className={`flex flex-col gap-5 overflow-y-auto border-line bg-panel p-4 lg:col-start-3 lg:row-start-1 lg:border-l ${
          dock === 'colour' || dock === 'casing' ? '' : 'max-lg:hidden'
        }`}
        aria-label="Rod and color"
      >
        <div className={onDock('casing')}>
          <RodPanel rod={rod} onChange={setRod} />
        </div>
        <div className={onDock('casing')}>
          <CasingPanel
            casing={casing}
            rod={rod}
            selectedColorantId={useCustomColor ? null : colorantId}
            onAdd={addCasingLayer}
            onRemove={removeCasingLayer}
            onMove={moveCasingLayer}
            onUpdate={updateCasingLayer}
          />
        </div>
        <div className={onDock('colour')}>
          <ColorChart
            colorantId={colorantId}
            onSelectColorant={setColorantId}
            useCustom={useCustomColor}
            onToggleCustom={setUseCustomColor}
            customColor={customColor}
            onCustomColorChange={setCustomColor}
          />
        </div>
        <div className={onDock('colour')}>
          <CompatibilityCheck warnings={compatibilityWarnings} colorantCount={colorantCount} />
        </div>
      </aside>

      <footer
        className={`flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line bg-panel px-5 py-3 lg:col-span-3 lg:row-start-2 ${onDock('plan')}`}
      >
        <Stat label="Build" value={planSteps.length ? `${planSteps.length} steps` : 'Place a cane to start'} />
        <Stat
          label="Yield"
          value={`≈ ${(pulledLengthMm(rod) / 1000).toFixed(1)} m of Ø ${pulledDiameterMm(rod).toFixed(1)} mm`}
        />
        <Stat
          label="Colors"
          value={
            compatibilityWarnings.some((w) => w.severity !== 'info')
              ? `${compatibilityWarnings.filter((w) => w.severity !== 'info').length} to check`
              : `${colorantCount} color${colorantCount === 1 ? '' : 's'}, run a test strip`
          }
        />
        <button
          type="button"
          onClick={onOpenPlan}
          disabled={!planSteps.length}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-bold text-accent-ink transition-transform hover:-translate-y-px disabled:opacity-50 max-lg:w-full max-lg:justify-center lg:ml-auto"
        >
          Open shop plan <Icon name="arrowRight" size={18} />
        </button>
      </footer>

      <nav
        aria-label="Editor panels"
        className="sticky bottom-0 z-20 grid grid-cols-4 gap-1 border-t border-line bg-panel px-1.5 pt-1.5 pb-3 lg:hidden"
      >
        {DOCK.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={dock === item.key}
            onClick={() => setDock(item.key)}
            className={`flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-semibold ${
              dock === item.key ? 'bg-raise text-ink' : 'text-mute'
            }`}
          >
            <Icon name={item.icon} size={22} />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs tracking-[0.08em] text-mute uppercase">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}
