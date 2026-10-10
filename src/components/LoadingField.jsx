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
    // Whether to play at all is decided where the tab changes (App), not
    // here: effects can run twice (React StrictMode does this on purpose),
    // and a "played" flag written inside one made the second run bail out
    // after the first run's cleanup had cancelled the hide, leaving the
    // overlay up and swallowing every click.
    if (trigger === 0 || reducedMotion()) return undefined
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
      // Never leave the overlay up: it blocks the whole app while visible.
      setVisible(false)
    }
  }, [trigger, section])

  return (
    <div
      aria-hidden="true"
      data-print-hide
      // Always click-through: the field is a moment to watch, never
      // something that can stand between the user and the app.
      className={`pointer-events-none fixed inset-x-0 top-14 bottom-0 z-20 transition-opacity duration-500 ease-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <p className="absolute bottom-7 left-1/2 -translate-x-1/2 rounded-lg bg-ground px-3.5 py-2 font-mono text-sm font-semibold">
        {message}
      </p>
    </div>
  )
}
