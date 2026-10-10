import * as THREE from 'three'

// The light glass is photographed in: a dark floor rising to a bright top,
// with two soft vertical strip lights. Glass is read almost entirely by
// what it reflects, and long smooth highlights read as glass, where a room
// of box-shaped panels (three's RoomEnvironment) reflected as blotchy
// rectangles. Painted once as an equirectangular image.
export function createStudioEnvironment(pmrem) {
  const width = 1024
  const height = 512
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const sweep = ctx.createLinearGradient(0, 0, 0, height)
  sweep.addColorStop(0, '#ffffff')
  sweep.addColorStop(0.4, '#c9ccd3')
  sweep.addColorStop(0.56, '#4a4e58')
  sweep.addColorStop(1, '#14161c')
  ctx.fillStyle = sweep
  ctx.fillRect(0, 0, width, height)
  ctx.filter = 'blur(14px)'
  for (const [x, w, alpha] of [
    [0.16, 0.06, 1],
    [0.58, 0.04, 0.85],
    [0.86, 0.025, 0.6],
  ]) {
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fillRect(x * width, height * 0.04, w * width, height * 0.62)
  }
  ctx.filter = 'none'
  const texture = new THREE.CanvasTexture(canvas)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace
  const environment = pmrem.fromEquirectangular(texture).texture
  texture.dispose()
  return environment
}
