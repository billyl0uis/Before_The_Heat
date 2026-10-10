---
version: 1
slug: "src-pages-murrinieditor-jsx"
primary_target: "src/pages/MurriniEditor.jsx"
related_targets: ["src/pages/PlanPage.jsx","src/App.jsx"]
---

# Murrini editor and Plan screen

Scope: the Murrini editor (rod-slice canvas) and the new Plan screen (print sheet and phone checklist), plus the app shell, section palettes and loading transitions. Visitor mode: **Operate**. Build path: code-led.

Audience and job: glassblowers and students planning a cane or murrine before a hot-shop slot, on desktop, tablet or phone (phones are binding). Success is a buildable, accurate plan. Proof is the true-scale slice and the plan itself, never invented physics or claims.

Constraints: React 19, Vite, Tailwind v4, Three.js. `engine/` stays framework-free. World units are kept (rod edge = 230 units), and mm are derived from `rod.gatherDiameterMm`. Schema v3 adds `rod` and an ordered `casing[]`. Out of scope: Vessel internals, Learn content, Firebase layout, engine geometry.

Approved reference (code-led sketch): `.impeccable/mocks/preview/vortex-garden-preview.html`.

Open decisions: the default gather size and pull ratio need a cited source, or they stay user-entered. Until then the defaults are labelled as example values.

## Direction contract

THESIS: The cross-section is the plan. The canvas is a true-scale slice of the rod with its casing rings, and the whole app reads the user's own murrine back to them, ending in a sheet you take to the furnace. This replaces the category default of a square drawing canvas with generic panels and a purple accent.

OWN-WORLD: Taken from the user's VORTEX GARDEN sketch.
- Deep, warm-to-ink grounds, with one palette per section: Murrini is orange Ember (`#150b07`, `#f2762e`), Plan is Primary (`#07092a`, `#fefe59`), Vessel is Reef, and Learn/Saved are yellow Ember. No purple.
- A hex-packed cane field in which every cell is the user's murrine, banded in spirals.
- Hanken Grotesk for UI; JetBrains Mono only for measurements and keys.
- Standard controls, authored SVG icons, no cards inside cards.

STORY: The visitor builds a slice at real scale, sets gather and pull, and orders the casing. They see the yield (len × ratio²) and honest compatibility notes. They open the Plan, print the sheet or follow the phone checklist one step at a time, and leave believing the plan is buildable.

FIRST VIEWPORT:
- **Editor:** a 60px tab bar; on the left, a 220px rail with Single cane and Bundles tool groups; in the centre, the slice at about 480px with a mm tick ring and readouts for gather Ø, pull ratio and pulled Ø; on the right, a 340px inspector (Rod sliders, Casing stack with reorder, named colour chart); along the bottom, a plan strip with "Open shop plan" as the primary action.
- **Plan:** a 300px still cane-field header with the title on a ground plate, a segmented control switching Print sheet / Shop checklist, and the sheet below.
- **Phone:** the slice stays pinned at the top with a thumb dock for Tools, Colour, Casing and Plan.
- **Signature interaction:** on tab switch, a loading cane field that is newly rolled each time, is born under the cursor, follows the pointer, and drops a vortex with a ripple on click. Motion grammar: a single 0.9s moment, damped, with no stretching.

FORM: VORTEX GARDEN cane field (user-pinned direction; it overrides the roll). Seed key cd7ae8d5.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
