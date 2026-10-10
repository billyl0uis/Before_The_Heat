# Critique ignore list

Detector findings confirmed as false positives in critique 3 (2026-10-10). Drop them silently.

- design-system-font-size: `src/index.css` html `font-size: 18px`. The root size the rem ramp scales from.
- design-system-color: `src/index.css` `#fff` in `@media print`. The printed page background.
- design-system-color: `src/components/murrini/MurriniCanvas.jsx` `#ffffff`. A THREE.js preview material, not UI.
- design-system-color: `src/components/plan/PlanSheet.jsx` `rgb(207 220 216 / 0.28)`. Paper tint for clear glass on the print sheet.
- design-system-color: `src/pages/SimpleBuilder.jsx` `#ffffff`. Canvas placeholder colour for shape previews.
- design-system-color: `src/hooks/useMurriniDesign.js` `#1a1a1a`. Saved design data (thumbnail backdrop), documented in place.
