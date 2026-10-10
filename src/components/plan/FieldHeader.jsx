import { useEffect, useRef } from 'react'
import { runCaneField, SECTION_BANDS, stillField } from '../../engine/field/caneField'
import { fieldInputs, sectionGround } from '../fieldShared'

// The Plan's header: one still frame of the cane field, every cell the
// real design, banded by its real twist. It redraws when the design or the
// width changes, and never animates on its own.
export function FieldHeader({ design, compact = false, children }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    let stop = () => {}
    const draw = () => {
      stop()
      const { sprite, colours } = fieldInputs(design, 96)
      stop = runCaneField(canvas, {
        config: stillField(
          SECTION_BANDS.plan,
          design.extrusion.twistDegrees,
          canvas.clientWidth,
          canvas.clientHeight,
        ),
        sprite,
        colours,
        ground: sectionGround(),
        dprCap: 2,
      })
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => {
      observer.disconnect()
      stop()
    }
  }, [design])

  return (
    <div data-print-hide className={`relative overflow-hidden ${compact ? 'h-24 sm:h-36' : 'h-36 sm:h-72'}`}>
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
      <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-end gap-3 sm:inset-x-8 sm:bottom-6">
        {children}
      </div>
    </div>
  )
}
