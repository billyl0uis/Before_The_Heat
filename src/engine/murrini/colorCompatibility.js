import { GLASS_COLOR_INDEX } from '../../content/glassColorIndex'

const COLORANT_BY_ID = new Map(GLASS_COLOR_INDEX.map((colorant) => [colorant.id, colorant]))

function nameList(colorants) {
  return colorants.map((colorant) => colorant.name).join(', ')
}

// Checks the real colorants actually used in a design against each other.
// Deliberately does NOT assign or compare COE numbers per colorant — those
// depend on the specific manufacturer's formulation, not the colorant
// family, and this app has no way to know them. Every warning here is
// built only from properties already verified in glassColorIndex.js
// (strikes / devitrifies / hazard), not invented interaction rules.
export function checkColorCompatibility(elements) {
  const usedIds = [...new Set(elements.map((element) => element.colorantId).filter(Boolean))]
  const used = usedIds
    .map((id) => COLORANT_BY_ID.get(id))
    .filter(Boolean)

  const warnings = []

  const cadmiumColors = used.filter((colorant) => colorant.hazard === 'cadmium')
  if (cadmiumColors.length) {
    warnings.push({
      id: 'cadmium-safety',
      severity: 'safety',
      title: 'Includes a cadmium-based color',
      body: `${nameList(cadmiumColors)} — toxic in powder or vapor form. Ventilation and no dry-grinding if you cold-work this piece for real.`,
    })
  }

  const strikers = used.filter((colorant) => colorant.strikes)
  const devitrifiers = used.filter(
    (colorant) => colorant.devitrifies === true || colorant.devitrifies === 'some',
  )
  if (strikers.length && devitrifiers.length) {
    warnings.push({
      id: 'strike-devitrify-tension',
      severity: 'caution',
      title: 'Reheat tension between colors used',
      body: `${nameList(strikers)} need${strikers.length === 1 ? 's' : ''} extended reheat near the softening point to strike, but ${nameList(devitrifiers)} ${devitrifiers.length === 1 ? 'is' : 'are'} documented as prone to devitrifying under exactly that kind of extended flame exposure. If they end up in the same piece, consider encasing the devitrification-prone color or reheating the two areas separately.`,
    })
  }

  const radioactiveColors = used.filter((colorant) => colorant.hazard === 'radioactive')
  if (radioactiveColors.length) {
    warnings.push({
      id: 'radioactive-note',
      severity: 'info',
      title: 'Includes a radioactive colorant',
      body: `${nameList(radioactiveColors)} — uncommon in modern studios for that reason. Worth checking sourcing and local regulations before treating this as a real, makeable piece.`,
    })
  }

  if (used.length >= 2) {
    warnings.push({
      id: 'coe-reminder',
      severity: 'info',
      title: 'Confirm physical compatibility before making this for real',
      body: `This design combines ${used.length} real colorants (${nameList(used)}). Their Coefficient of Expansion (COE) depends on each manufacturer's specific formulation, not the colorant family — this app can't verify it from the chemistry alone. Check your supplier's compatibility data, or run a compatibility test strip, before committing a real piece to the furnace.`,
    })
  }

  return warnings
}
