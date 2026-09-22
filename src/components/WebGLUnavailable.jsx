export function WebGLUnavailable({ width, height }) {
  return (
    <div
      style={{ width, height }}
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-center"
    >
      <p className="text-base leading-relaxed text-neutral-300">3D preview unavailable</p>
      <p className="text-base leading-relaxed text-neutral-400">
        This browser or device can't create a WebGL context. Try a different
        browser, enable hardware acceleration, or update your graphics
        drivers.
      </p>
    </div>
  )
}
