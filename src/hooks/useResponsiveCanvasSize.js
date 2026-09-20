import { useEffect, useRef, useState } from 'react'

// Shrinks a canvas to fit a narrow viewport (phones) while capping it at
// its normal desktop size, keeping a fixed aspect ratio. Measures the
// wrapping container's own rendered width via ResizeObserver rather than
// window size directly, since these canvases sit in a responsive
// flex-col/flex-row layout where the available width depends on whether
// the sidebar controls are stacked below or beside it.
export function useResponsiveCanvasSize(maxWidth, aspectRatio) {
  const containerRef = useRef(null)
  const [size, setSize] = useState({ width: maxWidth, height: maxWidth * aspectRatio })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let frame
    const updateSize = () => {
      const available = container.clientWidth
      if (!available) return
      const width = Math.round(Math.max(160, Math.min(maxWidth, available)))
      // Debounced onto a rAF so a burst of resize notifications (dragging
      // a window edge, an orientation change) collapses into one update
      // instead of repeatedly tearing down and rebuilding the WebGL
      // context mid-gesture.
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setSize((prev) =>
          prev.width === width ? prev : { width, height: Math.round(width * aspectRatio) },
        )
      })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(container)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [maxWidth, aspectRatio])

  return { containerRef, size }
}
