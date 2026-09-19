import { useMemo, useState } from 'react'
import { MurriniCanvas } from '../components/murrini/MurriniCanvas'
import { PatternControls } from '../components/murrini/PatternControls'
import { ShapeToolbar } from '../components/murrini/ShapeToolbar'
import { TechniqueReference } from '../components/murrini/TechniqueReference'
import { computeRepeatedElements } from '../engine/murrini/pattern'
import { SHAPE_TYPES } from '../engine/murrini/shapes'
import { useMurriniDesign } from '../hooks/useMurriniDesign'

export function MurriniEditor() {
  const { canvas, elements, pattern, setPattern, addElement, clearElements } =
    useMurriniDesign()
  const [selectedShape, setSelectedShape] = useState('circle')
  const [color, setColor] = useState('#c084fc')
  const [params, setParams] = useState(SHAPE_TYPES.circle.defaultParams)

  // Swap in that shape's own default params whenever the tool changes, so
  // sliders never show a param the current shape type doesn't have.
  const handleSelectShape = (shapeKey) => {
    setSelectedShape(shapeKey)
    setParams(SHAPE_TYPES[shapeKey].defaultParams)
  }

  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const handlePlace = (x, y) => {
    addElement(selectedShape, x, y, { color, params })
  }

  // elements stays the single "base cell" the user actually drew and is
  // what gets saved later — repetition is purely a render-time expansion
  // of it, driven by the pattern settings.
  const repeatedElements = useMemo(
    () => computeRepeatedElements(elements, pattern),
    [elements, pattern],
  )

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-neutral-100">
          Murrini Pattern Engine
        </h1>
        <p className="text-sm text-neutral-400">
          Pick a shape, set its color and size, then click the canvas to
          place it. Turn on a repeat to see it as a full cane cross-section.
        </p>
      </div>
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <MurriniCanvas
          canvas={canvas}
          elements={repeatedElements}
          onPlace={handlePlace}
        />
        <div className="flex flex-col gap-6">
          <ShapeToolbar
            selectedShape={selectedShape}
            onSelectShape={handleSelectShape}
            color={color}
            onColorChange={setColor}
            params={params}
            onParamChange={handleParamChange}
            onClear={clearElements}
          />
          <PatternControls pattern={pattern} onChange={setPattern} />
        </div>
        <TechniqueReference shape={selectedShape} params={params} />
      </div>
    </div>
  )
}
