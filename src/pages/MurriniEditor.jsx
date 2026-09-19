import { useState } from 'react'
import { MurriniCanvas } from '../components/murrini/MurriniCanvas'
import { ShapeToolbar } from '../components/murrini/ShapeToolbar'
import { TechniqueReference } from '../components/murrini/TechniqueReference'
import { SHAPE_TYPES } from '../engine/murrini/shapes'
import { useMurriniDesign } from '../hooks/useMurriniDesign'

export function MurriniEditor() {
  const { canvas, elements, addElement, clearElements } = useMurriniDesign()
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

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-neutral-100">
          Murrini Pattern Engine
        </h1>
        <p className="text-sm text-neutral-400">
          Pick a shape, set its color and size, then click the canvas to
          place it.
        </p>
      </div>
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <MurriniCanvas canvas={canvas} elements={elements} onPlace={handlePlace} />
        <ShapeToolbar
          selectedShape={selectedShape}
          onSelectShape={handleSelectShape}
          color={color}
          onColorChange={setColor}
          params={params}
          onParamChange={handleParamChange}
          onClear={clearElements}
        />
        <TechniqueReference shape={selectedShape} />
      </div>
    </div>
  )
}
