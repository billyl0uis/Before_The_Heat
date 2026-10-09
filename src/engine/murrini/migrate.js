import { DEFAULT_EXTRUSION } from './extrude'
import { DEFAULT_PATTERN } from './pattern'
import { DEFAULT_CASING, DEFAULT_ROD } from './rod'

export const CURRENT_SCHEMA_VERSION = 3

// What a design saved before v3 (no rod, no casing) should become when it's
// loaded. Kept separate from migrateDesign so the version plumbing below
// never has to change when this decision does.
//
// Casing is only inferred where the design itself is evidence for it: a
// zanfirico is cased in clear in practice, so it gets the clear layer.
// Anything else gets none, rather than a layer the user never chose.
export function legacyRodAndCasing(saved) {
  const hasZanfirico = (saved.elements ?? []).some(
    (element) => element.compoundType === 'zanfirico',
  )
  return {
    rod: { ...DEFAULT_ROD },
    casing: hasZanfirico ? DEFAULT_CASING.map((layer) => ({ ...layer })) : [],
  }
}

// Turns any saved design (Vault document or the local autosave) into the
// current shape. Never mutates its input, and never drops fields it doesn't
// recognise, so a newer document opened by an older build loses nothing.
export function migrateDesign(saved) {
  if (!saved) return null
  const version = saved.schemaVersion ?? 1
  const legacy = version < 3 ? legacyRodAndCasing(saved) : null

  return {
    ...saved,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    elements: saved.elements ?? [],
    pattern: { ...DEFAULT_PATTERN, ...saved.pattern },
    extrusion: { ...DEFAULT_EXTRUSION, ...saved.extrusion },
    rod: { ...DEFAULT_ROD, ...(legacy?.rod ?? saved.rod) },
    casing: legacy?.casing ?? saved.casing ?? [],
  }
}
