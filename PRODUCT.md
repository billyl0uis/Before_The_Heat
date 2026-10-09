# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: glassblowers (practicing artists and glass students) planning cane, murrini, and vessel work **before** they go to the hot shop. They use the app away from the furnace to sketch a pattern, check that the colors are compatible, and work out how it will be built and how it will read on a blown form.

Secondary: people new to glass who learn cane and murrini techniques through the Learn section and by experimenting in the editors.

## Product Purpose

Before The Heat is a glassblowing design and murrini simulation suite. Success, in priority order:

1. **A usable shop plan.** The user leaves with something buildable they can take to the furnace: a pattern, a build plan, colorant compatibility, and a rod/vessel preview.
2. **Understanding technique.** The user learns accurately how real cane and murrini techniques work.
3. **Creative exploration.** Designing patterns and vessels freely should be enjoyable. Accuracy supports play and does not restrict it.

## Positioning

The simulation reflects real technique and is checked against published sources, not invented. Construction geometry (Zanfirico thread packing, Tripod/Cross/Row/Grid/Frame bundles) comes from VirtualGlass's actual C++ source. Reticello is modeled on the real construction method, with trapped air between crossings. The colors come from real colorants with documented chemistry. A generic pattern or drawing tool cannot honestly make these claims.

## Operating Context

- Used for planning before hot work, not at the furnace mid-gather.
- Users may be at a bench or in the shop on a phone or tablet, as well as at a desktop.
- Core flow: Murrini editor (shapes, pattern repeat, extrusion, colorant picker, compatibility check, build plan, rod preview) → Vessel editor (profile curve, form presets, optic ribs, twist, reticello wrap, pattern wrapped onto a 3D form) → Saved designs (Firebase Design Vault) → Learn (technique guide, glass color index) → About (inspiration and research sources).
- Murrini and vessel state carries across tabs so the user can move back and forth while planning.

## Capabilities and Constraints

- Stack in place: React 19 + Vite, Tailwind CSS v4, Three.js, Firebase Auth/Firestore. Deployed as a static build on Vercel. Keep this stack.
- `engine/` is pure simulation logic and never imports React, components, or Firebase.
- The Design Vault needs `VITE_FIREBASE_*` env vars. Without them it shows a "not configured" notice instead of erroring.
- Navigation is currently tab state in `App.jsx`, with no client-side router.
- WebGL is required for the 3D views. A `WebGLUnavailable` fallback exists.
- Domain terminology (murrini, cane, zanfirico, reticello, casing, marvering, COE/compatibility) is real vocabulary for the primary user and should be kept, with definitions available for the secondary audience.

## Brand Commitments

- Name: **Before The Heat**.
- An independent educational simulation tool, inspired by glass artists Wes Hunting and Wesley Hunting. **It is not affiliated with or endorsed by them, and it is not built from their proprietary designs.** Never imply otherwise.
- Designs users make are their own.

## Evidence on Hand

- Research sources, each tied to a specific correction, are listed in `src/pages/AboutPage.jsx`: VirtualGlass (Erik Demaine, MIT), the Corning Museum of Glass murrine guide, Wikipedia's Caneworking article, Conciatore on reticello, and Glass of Venice on filigrana.
- Colorant chemistry sourcing lives per entry in `src/content/glassColorIndex.js`.
- Technique content lives in `src/content/murrineTechniques.js`.
- There are no testimonials, user counts, or endorsements, and none should be fabricated.

## Product Principles

1. **Accuracy is not negotiable.** Technique, geometry, and color data must never be simplified or faked for visual effect. If a visual can't be accurate, label it as approximate.
2. **Plan first.** Every surface should move the user toward a buildable plan they can take to the shop.
3. **Teach at the point of need.** Explain domain terms where they appear rather than only in a separate reference.
4. **Play is allowed.** Exploration should feel inviting. Accuracy shows the user what is possible; it doesn't block them.
5. **Works where planning happens.** Editors and reference pages must be usable on phones and tablets, not only on a desktop.

## Accessibility & Inclusion

- Must work on phone and tablet viewports, including canvas-based editors and touch input.
- Color is core content (glass colorants), so color selection and compatibility warnings must not rely on color alone.
