import { useEffect, useRef, useState } from 'react'
import { rollField, runCaneField, SECTION_BANDS } from '../engine/field/caneField'
import { fieldInputs, sectionGround } from './fieldShared'

const MESSAGES = ['Gathering…', 'Bundling…', 'Casing…', 'Marvering…', 'Reheating…', 'Pulling cane…', 'Slicing…']

// The pointer is tracked all the time, not only while the field shows,
// so the vortex is born exactly where the tab was clicked.
const pointer = { x: null, y: null, t: -Infinity }
if (typeof window !== 'undefined') {
  const track = (event) => {
    pointer.x = event.clientX
    pointer.y = event.clientY
    pointer.t = performance.now()
  }
  window.addEventListener('pointermove', track, { passive: true })
  window.addEventListener('pointerdown', track, { passive: true })
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The field plays once per browser session, on the first move between
// sections. After that, switching tabs is instant: a repeated delay is
// friction, and the moment is only special the first time.
const PLAYED_KEY = 'before-the-heat:field-played'
function playedThisSession() {
  try {
    if (window.sessionStorage.getItem(PLAYED_KEY)) return true
    window.sessionStorage.setItem(PLAYED_KEY, '1')
    return false
  } catch {
    return false
  }
}

// The signature moment between sections: a freshly rolled cane field that
// follows the pointer for under a second, then gets out of the way.
export function LoadingField({ trigger, section, design }) {
  const canvasRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState(MESSAGES[0])
  const designRef = useRef(design)
  useEffect(() => {
    designRef.current = design
  }, [design])

  useEffect(() => {
    if (trigger === 0 || reducedMotion() || playedThisSession()) return undefined
    const canvas = canvasRef.current
    setMessage((previous) => {
      let next = previous
      while (next === previous) next = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
      return next
    })
    setVisible(true)
    // Wait one frame so the overlay has its size and the section's palette.
    let stop = () => {}
    const startFrame = requestAnimationFrame(() => {
      const { sprite, colours } = fieldInputs(designRef.current, 72)
      stop = runCaneField(canvas, {
        config: rollField(SECTION_BANDS[section] ?? SECTION_BANDS.murrini),
        sprite,
        colours,
        ground: sectionGround(),
        animate: true,
        durationMs: 1150,
        pointer,
      })
    })
    const hide = setTimeout(() => setVisible(false), 900)
    return () => {
      cancelAnimationFrame(startFrame)
      clearTimeout(hide)
      stop()
    }
  }, [trigger, section])

  return (
    <div
      aria-hidden="true"
      data-print-hide
      className={`fixed inset-x-0 top-14 bottom-0 z-20 transition-opacity duration-500 ease-out ${
        visible ? 'pointer-events-auto cursor-crosshair opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <p className="absolute bottom-7 left-1/2 -translate-x-1/2 rounded-lg bg-ground px-3.5 py-2 font-mono text-sm font-semibold">
        {message}
      </p>
    </div>
  )
}
