import { useRef, useState } from 'react'
import { SculptCanvas } from '../components/sculpt/SculptCanvas'
import { SculptControls } from '../components/sculpt/SculptControls'
import { useResponsiveCanvasSize } from '../hooks/useResponsiveCanvasSize'

export function FreeSculptPage() {
  const canvasRef = useRef(null)
  const [brushRadius, setBrushRadius] = useState(24)
  const [brushStrength, setBrushStrength] = useState(6)
  const [brushMode, setBrushMode] = useState('push')
  const [history, setHistory] = useState({ canUndo: false, canRedo: false })
  const { containerRef: canvasContainerRef, size: canvasSize } = useResponsiveCanvasSize(480, 1)

  return (
    <div className="flex flex-col items-center gap-6 p-4 sm:p-8">
      <div className="max-w-xl text-center">
        <h1 className="text-2xl font-medium text-neutral-100">Free Sculpt</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Not a vessel — just a gather of hot glass, worked by hand. Push
          and pull the surface freely; unlike the Vessel Morphograph, this
          doesn't have to stay radially symmetric.
        </p>
      </div>
      <div className="flex w-full min-w-0 flex-col items-start gap-6 lg:flex-row">
        <div ref={canvasContainerRef} className="w-full min-w-0" style={{ maxWidth: 480 }}>
          <SculptCanvas
            ref={canvasRef}
            brushRadius={brushRadius}
            brushStrength={brushStrength}
            brushMode={brushMode}
            onHistoryChange={setHistory}
            width={canvasSize.width}
            height={canvasSize.height}
          />
        </div>
        <SculptControls
          brushRadius={brushRadius}
          onBrushRadiusChange={setBrushRadius}
          brushStrength={brushStrength}
          onBrushStrengthChange={setBrushStrength}
          brushMode={brushMode}
          onBrushModeChange={setBrushMode}
          onUndo={() => canvasRef.current?.undo()}
          onRedo={() => canvasRef.current?.redo()}
          onReset={() => canvasRef.current?.reset()}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
        />
      </div>
    </div>
  )
}
