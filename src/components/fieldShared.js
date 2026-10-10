import { findColorant } from '../engine/murrini/rod'
import { renderSlicePlate } from '../engine/murrini/slicePlate'

// What the field needs from the design: the murrine as a small sprite,
// plus its outer casing, middle and core colours for the simpler glyphs.
export function fieldInputs(design, spritePx = 64) {
  const sprite = renderSlicePlate({
    elements: design.repeatedElements,
    rod: design.rod,
    casing: design.casing,
    size: spritePx,
  })
  const outer = findColorant(design.casing.at(-1)?.colorantId)?.swatch
  const middle = findColorant(design.casing.at(-2)?.colorantId)?.swatch
  const core = design.elements[0]?.color
  return {
    sprite,
    colours: {
      outer: outer ?? '#cfdcd8',
      middle: middle ?? outer ?? '#f3f1ea',
      core: core ?? '#f3f1ea',
    },
  }
}

export function sectionGround() {
  return getComputedStyle(document.documentElement).getPropertyValue('--ground').trim() || '#150b07'
}
