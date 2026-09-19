import { useMemo, useState } from 'react'
import { ColorantPicker } from '../components/murrini/ColorantPicker'
import { CompatibilityCheck } from '../components/murrini/CompatibilityCheck'
import { ExtrusionControls } from '../components/murrini/ExtrusionControls'
import { MurriniCanvas } from '../components/murrini/MurriniCanvas'
import { PatternControls } from '../components/murrini/PatternControls'
import { RodPreviewCanvas } from '../components/murrini/RodPreviewCanvas'
import { ShapeToolbar } from '../components/murrini/ShapeToolbar'
import { TechniqueReference } from '../components/murrini/TechniqueReference'
import { GLASS_COLOR_INDEX } from '../content/glassColorIndex'
import { checkColorCompatibility } from '../engine/murrini/colorCompatibility'
import { SHAPE_TYPES } from '../engine/murrini/shapes'

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
    clearElements,
  } = design
  const [viewMode, setViewMode] = useState('flat')
  const [selectedShape, setSelectedShape] = useState('circle')
  const [params, setParams] = useState(SHAPE_TYPES.circle.defaultParams)

  const [colorantId, setColorantId] = useState(GLASS_COLOR_INDEX[0].id)
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [customColor, setCustomColor] = useState('#c084fc')

  // Swap in that shape's own default params whenever the tool changes, so
  // sliders never show a param the current shape type doesn't have.
  const handleSelectShape = (shapeKey) => {
    setSelectedShape(shapeKey)
    setParams(SHAPE_TYPES[shapeKey].defaultParams)
  }

  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const compatibilityWarnings = useMemo(
    () => checkColorCompatibility(elements),
    [elements],
  )

  const handlePlace = (x, y) => {
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
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-neutral-100">
          Murrini Pattern Engine
        </h1>
        <p className="text-sm text-neutral-400">
          Pick a shape and a real glass color, then click the canvas to place
          it. Turn on a repeat to see it as a full cane cross-section.
        </p>
      </div>
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {[
              { key: 'flat', label: 'Flat pattern' },
              { key: 'rod', label: 'Rod preview (3D)' },
            ].map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setViewMode(mode.key)}
                className={`rounded px-3 py-1.5 text-sm transition-colors ${
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
            <MurriniCanvas
              canvas={canvas}
              elements={repeatedElements}
              onPlace={handlePlace}
            />
          ) : (
            <RodPreviewCanvas elements={repeatedElements} extrusion={extrusion} />
          )}
        </div>
        <div className="flex flex-col gap-6">
          <ShapeToolbar
            selectedShape={selectedShape}
            onSelectShape={handleSelectShape}
            params={params}
            onParamChange={handleParamChange}
            onClear={clearElements}
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
          <TechniqueReference shape={selectedShape} params={params} />
        </div>
      </div>
    </div>
  )
}
