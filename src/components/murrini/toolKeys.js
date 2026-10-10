import { COMPOUND_SHAPE_ORDER } from '../../engine/murrini/compoundShapes'
import { SHAPE_ORDER } from '../../engine/murrini/shapes'

// Rail order, single canes first. Number keys 1–9 pick the first nine.
export const TOOL_KEYS = [...SHAPE_ORDER, ...COMPOUND_SHAPE_ORDER]
