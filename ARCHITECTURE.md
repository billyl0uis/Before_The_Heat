# Before The Heat — Phase 1 Blueprint

Status: **Draft — awaiting approval before any code is written.**

This document covers only the architecture and data schema for the Murrini
Design object, per the project's Phase 1 ("Blueprint") step. No functional
React code exists yet.

## Visual Engine Decision (needs your sign-off)

The brief asks to pick **either** p5.js (2D pattern math) **or** Three.js (3D
vessel visualization) as the single engine — not both.

**Recommendation: Three.js.**

Reasoning:
- The suite needs three surfaces eventually — the 2D murrini pattern, the
  vessel *silhouette* (a profile curve), and a combined preview that wraps
  the pattern onto the vessel's 3D form (a lathe/revolve of the silhouette).
  p5.js has no practical path to that revolve + texture-wrap step.
- Three.js can still do the 2D pattern editor: draw the murrini pattern to a
  `<canvas>` (plain 2D canvas API, no need for p5.js) or an off-screen
  texture, then reuse that exact canvas as a material texture on the 3D
  vessel mesh for the Simulation Preview module. One engine, one source of
  truth for the pattern, no format conversion between modules.
- Trade-off you should know about: Three.js has a steeper learning curve
  than p5.js, and the "Logic Breakdown" explanations for module 1 will lean
  more on canvas/2D-context math than p5.js's friendlier drawing API.

If you'd rather keep the pattern editor in p5.js for its simplicity and
accept that the vessel view stays a flat 2D silhouette (no 3D revolve, no
true wrap-preview), say so and I'll flip the recommendation. This is a
one-way door once module 1 is built on top of it, so confirm before I
scaffold anything.

## Folder Structure

```
before-the-heat/
├── public/
├── src/
│   ├── assets/
│   ├── components/          # Presentational React UI only — no simulation math
│   │   ├── layout/
│   │   ├── murrini/         # MurriniCanvas, MurriniToolbar, ...
│   │   ├── vessel/          # VesselCanvas, VesselControls, ...
│   │   ├── vault/           # DesignList, SaveDialog, ...
│   │   └── shared/
│   ├── engine/               # Pure, framework-agnostic simulation logic
│   │   ├── murrini/          # pattern generation + extrusion math
│   │   ├── vessel/           # morphograph math (sine/parabola/sphere fns)
│   │   └── simulation/       # combines pattern + vessel for final preview
│   ├── hooks/                 # useMurriniDesign, useVessel, useDesignVault
│   ├── context/                # DesignContext, AuthContext
│   ├── firebase/                # firebase.js (init), auth.js, firestore.js (CRUD)
│   ├── schemas/                  # JSON Schema / validators for Design Objects
│   ├── content/                   # Static reference text/data (e.g. real-world
│   │                                 glassblowing technique notes), no logic
│   ├── pages/                     # route-level views (Editor, Vault, Preview)
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── .env.local                      # Firebase config (git-ignored)
├── tailwind.config.js
├── vite.config.js
└── package.json
```

Key rule enforced by this structure: **`engine/` never imports from `react`,
`components/`, or `firebase/`.** It takes plain data in and returns plain
data out (or draws to a canvas it's handed). That's what "modularity" means
here — the simulation math is testable and swappable independent of the UI.

## System Architecture (data flow)

```
┌─────────────────────────────┐
│         React UI            │
│  (components/, pages/)      │
└──────────────┬───────────────┘
               │ user input (clicks, sliders, colors)
               ▼
┌─────────────────────────────┐
│      React Hooks / Context   │
│  (hooks/, context/)          │
│  - holds current Design      │
│    Object in state           │
└──────────────┬───────────────┘
     │reads/writes             │ calls with plain data
     ▼                         ▼
┌───────────────┐   ┌─────────────────────────────┐
│   Firebase     │   │        Engine Layer          │
│ (firebase/)    │   │  (engine/murrini,             │
│ - Firestore    │   │   engine/vessel,               │
│   CRUD         │   │   engine/simulation)           │
│ - Auth         │   │  - pure functions + Three.js   │
└───────────────┘   │    scene logic                  │
      ▲             └──────────────┬──────────────────┘
      │ save/load JSON             │ renders to
      │ Design Object              ▼
      │                  ┌───────────────────┐
      └──────────────────│   <canvas> output   │
                          └───────────────────┘
```

Firestore stores/returns the Design Object as JSON (schema below). The
engine layer never talks to Firebase directly — hooks are the only bridge.

## JSON Schema — Murrini Design

This is what gets saved to Firestore for a single murrini pattern.

```json
{
  "id": "string — Firestore document ID",
  "ownerId": "string — Firebase Auth UID",
  "type": "murrini",
  "schemaVersion": 2,
  "name": "string",
  "description": "string",
  "visibility": "private | public",
  "createdAt": "Firestore Timestamp",
  "updatedAt": "Firestore Timestamp",

  "canvas": {
    "width": 500,
    "height": 500,
    "backgroundColor": "#1a1a1a"
  },

  "elements": [
    {
      "id": "string — uuid, unique within this design",
      "shape": "string — key into the shape registry (circle, ring, polygon, star, line, ...)",
      "x": 0,
      "y": 0,
      "rotation": 0,
      "color": "#ffffff",
      "colorantId": "string | null — key into GLASS_COLOR_INDEX (src/content/glassColorIndex.js), the real colorant this color came from; null for a free custom color",
      "opacity": 1,
      "layer": 0,
      "params": "object — shape-specific fields, e.g. { radius } for circle, { radius, sides } for polygon, { radius, innerRadius, points } for star"
    }
  ],

  "pattern": {
    "repeatType": "none | grid | radial | linear",
    "rows": 1,
    "columns": 1,
    "spacingX": 0,
    "spacingY": 0,
    "radialCount": 1
  },

  "extrusion": {
    "length": 100,
    "twistDegrees": 0,
    "taper": 0
  },

  "thumbnailUrl": "string | null — inline base64 PNG data URL (not a Firebase Storage URL, see field notes)",
  "tags": ["string"]
}
```

Field notes:
- `elements` is the *base* pattern unit the user draws — one repeat cell.
  `pattern` describes how that cell repeats across the rod's cross-section
  (grid for a mosaic cane, radial for a classic murrini "flower", etc.).
- `shape` is open-ended, not a fixed enum: it's a lookup key into the shape
  registry at `src/engine/murrini/shapes.js`. `params` holds whatever
  fields that shape type needs (a circle needs `radius`; a star needs
  `radius`, `innerRadius`, `points`). Adding a new shape type is one
  registry entry, not a schema migration.
- v1 → v2 change: `radius` moved from a top-level element field into
  `params`, since not every shape has a single radius. A v1 document can
  be migrated by moving `radius` into `params: { radius }` and defaulting
  `shape` to `"circle"` if missing.
- `colorantId` is additive, not a breaking change — a v2 document without
  it just means the color isn't tied to a documented real colorant
  (equivalent to `null`).
- `thumbnailUrl` deliberately deviates from the original plan of a
  Firebase Storage URL: it's an inline base64 PNG data URL instead,
  generated client-side by `renderElementsToCanvas` (the same rasterizer
  the vessel texture connection uses) at a small fixed size. That avoids
  needing Storage as a second Firebase product to set up just for
  thumbnails, and at this size (a few KB) stays well within Firestore's
  per-document limit. Worth revisiting if designs ever need full-size
  exported images — that's a real Storage use case, this isn't it.
- `extrusion` is the module-1 "stretch simulation": `twistDegrees` and
  `taper` let the rod preview show the pattern twisting/thinning along its
  length the way a real pulled cane does, without redrawing `elements`.
- `schemaVersion` exists so the Design Vault (module 3) can migrate old
  saved documents if this shape changes later — start every future breaking
  change here, not with a silent field rename.
- A `vessel` design and a combined `project` (murrini + vessel + placement)
  will each be their own top-level `type` with their own schema, stored in
  separate logic but the same `designs` collection (or sibling collections
  `murriniDesigns` / `vesselShapes` / `projects` — worth deciding once we
  get to module 3, not now).

## Open questions before Phase 2 (environment setup)

1. Confirm or override the Three.js-only engine decision above.
2. Firestore collection layout: one `designs` collection with a `type`
   discriminator field, or separate collections per type? (Affects query
   patterns in the Vault module — worth deciding early but not blocking.)
3. Auth requirement: can users try the pattern/vessel editors anonymously
   before signing in, or is auth required up front? Affects whether
   `ownerId` can ever be null in this schema.
