---
name: Before The Heat
description: A true-scale murrini and cane planner that reads the user's own design back to them and ends in a sheet you take to the furnace.
colors:
  ember-ground: "#150b07"
  ember-panel: "#1f120c"
  ember-raise: "#2b1911"
  ember-line: "#40271b"
  ember-ink: "#fbf1e8"
  ember-ink-soft: "#ead8ca"
  ember-mute: "#cdb5a5"
  ember-faint: "#a8907f"
  ember-orange: "#f2762e"
  ember-accent-ink: "#1a0a02"
  ember-sky: "#5ec1e8"
  primary-ground: "#07092a"
  primary-panel: "#0d1140"
  primary-raise: "#151a55"
  primary-line: "#232a6b"
  primary-ink: "#f2f3ff"
  primary-ink-soft: "#dfe2fb"
  primary-mute: "#aab1e3"
  primary-faint: "#8890c8"
  primary-yellow: "#fefe59"
  primary-accent-ink: "#07092a"
  primary-cobalt: "#4f7cff"
  reef-ground: "#071433"
  reef-panel: "#0c1d45"
  reef-raise: "#132756"
  reef-line: "#1f3768"
  reef-ink: "#eef6ff"
  reef-ink-soft: "#d9e7f7"
  reef-mute: "#a7bddc"
  reef-faint: "#8299bb"
  reef-teal: "#3fb0d0"
  reef-accent-ink: "#04121f"
  reef-gold: "#e6c23a"
  yellow-ember-ground: "#140c06"
  yellow-ember-panel: "#1f140b"
  yellow-ember-raise: "#2a1c10"
  yellow-ember-line: "#3e2a18"
  yellow-ember-ink: "#f6f2e6"
  yellow-ember-ink-soft: "#e8e0cc"
  yellow-ember-mute: "#c9b9a0"
  yellow-ember-faint: "#a4937b"
  yellow-ember-yellow: "#f7c21a"
  yellow-ember-accent-ink: "#1a0e00"
  yellow-ember-sky: "#5ec1e8"
  caution-text: "oklch(87.9% 0.169 91.605)"
  safety-text: "oklch(80.8% 0.114 19.571)"
  paper: "#fbfbf8"
  paper-ink: "#0b0e2e"
  paper-mute: "#454a72"
  paper-rule: "#d9dae6"
  paper-cobalt: "#1430d8"
  paper-green: "#1f6b3a"
  paper-red: "#b3261e"
  clear-glass-backdrop: "#3a3d45"
typography:
  display:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.8rem, 4.6vw, 3.4rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  numeral:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  section-label:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  readout:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.6rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  measure:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8rem"
    fontWeight: 400
rounded:
  swatch: "0.25rem"
  control: "0.375rem"
  button: "0.5rem"
  plate: "0.75rem"
  sheet-card: "1.5rem"
  pill: "9999px"
spacing:
  unit: "0.25rem"
  chip-gap: "0.375rem"
  panel-gap: "0.75rem"
  rail-pad: "1rem"
  rail-stack: "1.25rem"
  strip-gap: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.ember-orange}"
    textColor: "{colors.ember-accent-ink}"
    rounded: "{rounded.button}"
    padding: "0.75rem 1.25rem"
  button-secondary:
    backgroundColor: "{colors.ember-raise}"
    textColor: "{colors.ember-ink}"
    rounded: "{rounded.control}"
    padding: "0.375rem 0.625rem"
  button-quiet:
    textColor: "{colors.ember-mute}"
    rounded: "{rounded.button}"
    padding: "0.5rem 0.75rem"
  segmented-track:
    backgroundColor: "{colors.ember-raise}"
    rounded: "{rounded.button}"
    padding: "0.125rem"
  segmented-option-active:
    backgroundColor: "{colors.ember-orange}"
    textColor: "{colors.ember-accent-ink}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
  tab:
    textColor: "{colors.ember-mute}"
    typography: "{typography.title}"
    height: "3.5rem"
  tab-active:
    textColor: "{colors.ember-ink}"
  tool-button:
    backgroundColor: "{colors.ember-raise}"
    textColor: "{colors.ember-mute}"
    rounded: "{rounded.button}"
    height: "4rem"
  colour-chip:
    backgroundColor: "{colors.ember-raise}"
    textColor: "{colors.ember-ink}"
    rounded: "{rounded.button}"
  input-number:
    backgroundColor: "{colors.ember-ground}"
    textColor: "{colors.ember-ink}"
    typography: "{typography.measure}"
    rounded: "{rounded.swatch}"
    width: "3rem"
  plan-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.swatch}"
    padding: "2.75rem 3rem"
    width: "860px"
  checklist-card:
    backgroundColor: "{colors.ember-panel}"
    rounded: "{rounded.sheet-card}"
    width: "28rem"
---

# Design System: Before The Heat

## Overview

**Creative North Star: "The Vortex Garden"**

The world is pinned to the user's own VORTEX GARDEN p5 sketch: deep, warm-to-ink grounds, hex-packed cane fields banded in spirals, and saturated glass colour used as signal against near-black. The app's subject is the murrine itself, so the system stays quiet around it. The editor is still and instrument-like: a true-scale cross-section of the rod with a millimetre tick ring, flanked by flat rails separated by hairlines, never cards inside cards. Colour volume is reserved for the user's glass and the one section accent.

Every section paints the whole page (body, scrollbars, selection, focus ring) in its own palette, switched by a `data-section` attribute on the root. Murrini is orange Ember, Plan is Primary navy with yellow, Vessel is Reef, and Learn, Saved and About share yellow Ember. There is no purple anywhere; the inherited purple and neutral utility scales are remapped onto the section tokens.

Motion is rare and owned by one device: the generative cane field, whose every cell is the user's real murrine. It appears only as the Plan header (one still frame of the actual design) and as the loading moment between sections (rolled fresh each time, born under the pointer, following it, a click drops a vortex with a ripple). The journey ends on paper: a white print sheet in Primary navy ink.

**Key Characteristics:**
- One palette per section, applied to the whole page from the root.
- The design is the image: field cells, step plates and the slice are rendered from the user's real murrine, never illustrated.
- Flat tonal layering (ground, panel, raise, line) with hairline separators; shadow only on things that sit over a field or a page.
- Hanken Grotesk for everything readable; JetBrains Mono only for measurements and keys.
- Colour is never the only signal: chips carry names and behaviour, step titles name their colours.
- Standard controls and authored 24px, 2px-stroke icons.

## Colors

Near-black grounds tinted toward each section's hue, one hot accent per section, and a cool or warm second accent for status dots and progress.

Every section defines the same eleven roles: ground, panel, raise, line, ink, ink-soft, mute, faint, accent, accent-ink, accent-2. Components use the roles, never a section's literal hex, so the same markup re-themes per tab. The Components frontmatter shows the Murrini values; other sections substitute their own.

### Primary
- **Ember Orange** (ember-orange): the Murrini accent and the system default. Primary buttons, the active tab underline, active tool outline, slider thumbs, focus ring, selection and the emphasised pulled-diameter readout.
- **Primary Yellow** (primary-yellow): the Plan accent, a hot lemon on navy. Active segment, Print plan, progress fill.
- **Reef Teal** (reef-teal): the Vessel accent.
- **Ember Yellow** (yellow-ember-yellow): the accent for Learn, Saved and About.

### Secondary
- **Ember Sky** (ember-sky / yellow-ember-sky), **Primary Cobalt** (primary-cobalt), **Reef Gold** (reef-gold): the per-section accent-2. Used small: the "Saved in this browser" dot, the compatibility check mark, the current-step segment of the checklist progress bar, and the Mark's petals.

### Neutral
- **Ground** (ember-ground and siblings): page background, field ground, and the plate behind text laid over a cane field.
- **Panel** (ember-panel): rails, tab bar, plan strip, mobile dock, checklist card.
- **Raise** (ember-raise): inactive tool tiles, chips, segmented tracks, secondary buttons.
- **Line** (ember-line): every hairline separator and input stroke; also the scrollbar thumb.
- **Ink / Ink Soft** (ember-ink, ember-ink-soft): primary text and readout values.
- **Mute / Faint** (ember-mute, ember-faint): labels, panel headings, inactive tabs, helper copy; faint for the unsaved status dot.

### Status
- **Caution** (caution-text): amber text for strike, devitrification and over-thick casing notes, and caution callouts on a dark amber wash.
- **Safety** (safety-text): soft red for toxic or radioactive colorant notes, safety callouts, and destructive buttons (outlined in red at 40% alpha). These two stay fixed across sections.

### Print and glass
- **Paper** (paper), **Paper Ink** (paper-ink), **Paper Mute** (paper-mute), **Paper Rule** (paper-rule): the print sheet, white with Primary-navy ink, even when printed from another section.
- **Paper Cobalt** (paper-cobalt): step numbers and the pull arrow on the sheet. **Paper Green** (paper-green) heads "Colours used"; **Paper Red** (paper-red) heads "Watch for".
- **Clear-Glass Backdrop** (clear-glass-backdrop): the slate behind rendered slices and step plates on the sheet and in the checklist, so clear glass (drawn at 0.28 tint) stays visible on white paper.

### Named Rules
**The One Palette Per Section Rule.** A section owns the whole page. Never mix two sections' accents on one screen, and never hard-code a section hex in a component; use the role.

**The No Purple Rule.** Purple is retired by user decision. Any purple utility in legacy markup resolves to the section accent; new work never introduces a purple, violet or magenta hue.

**The Name Every Colour Rule.** A swatch never stands alone. Colour chips print the colorant's short name and its behaviour (transparent, opaque, strikes, toxic); casing rows and step titles name their colours in words.

## Typography

**Display Font:** Hanken Grotesk (with ui-sans-serif, system-ui)
**Label/Mono Font:** JetBrains Mono (with ui-monospace), loaded at 400 to 600

**Character:** A sturdy, slightly warm grotesk carries every readable word at weights 400 to 800; a mono appears only where a number is a measurement you will take to the bench.

The root size is 18px, so every rem value scales with it. Body text uses tabular numerals throughout.

### Hierarchy
- **Display** (800, clamp(1.8rem, 4.6vw, 3.4rem), 0.98): the Plan header title, set on a ground plate over the cane field. Empty-state titles use 800 at 1.875rem.
- **Numeral** (800, 4.5rem, 1): the checklist's current step number in the accent; "Done" uses the same voice.
- **Headline** (700, 1.6rem, 1.25): checklist step titles; the sheet's "Shop plan" title at 1.7rem, 800.
- **Title** (600, 1rem): tab labels (0.95rem), step titles on the sheet, strip values.
- **Body** (400, 0.875rem, 1.625): helper copy, casing rows, compatibility notes. Checklist detail runs larger at 1.05rem.
- **Section Label** (700, 0.875rem, 0.06em, uppercase): the heading of each rail panel ("Single cane", "Rod", "Casing, inside to out") and the sheet's subsections ("Pull", "Build order"). Readout and strip labels use the same uppercase treatment at 0.65 to 0.75rem.
- **Readout** (JetBrains Mono 600, 1.6rem desktop / 1.25rem phone): gather diameter, pull ratio, pulled diameter under the slice.
- **Measure** (JetBrains Mono 400, 0.8rem): slider values, casing thickness, totals, keyboard hints, the Plan header's pull summary, loading messages.

### Named Rules
**The Mono Means Measurement Rule.** JetBrains Mono is for millimetres, ratios, lengths, counts of a measured thing and key names. Never use it for headings, labels or prose.

## Layout

The editor is a full-height three-column instrument on large screens: a 232px tool rail, a flexible centre holding the slice (max 520px, capped by viewport height), and a 344px inspector, with a full-width plan strip across the bottom. The 3.5rem tab bar is sticky. Rails scroll independently; panels stack with 1.25rem gaps, each separated from the next by a hairline and 1.25rem of bottom padding.

Below the large breakpoint the slice pins to the top under the tab bar (capped at 300px or 30svh) and one panel group shows at a time, chosen from a four-button thumb dock (Tools, Colour, Rod, Plan) fixed to the bottom.

The Plan page is a 14rem (phone) to 18rem cane-field header with its title and pull summary anchored bottom-left on ground plates, a panel-coloured control bar (segmented view switch, quiet "Edit design", primary "Print plan" right-aligned), then the sheet or checklist centred below. The sheet is max 860px with a 17rem left column (slice, pull, casing) and the build order on the right, collapsing to one column on phones. The checklist is a single 28rem card.

Spacing follows Tailwind's 0.25rem unit at an 18px root: 0.375rem between chips and tool tiles, 0.75rem inside panels, 1rem rail padding, 2rem between strip stats.

## Elevation & Depth

The editor is flat. Depth comes from tonal steps (ground below panel below raise) and 1px hairlines in the line colour. Shadows appear only where an object sits over something busier: text plates over the cane field, the paper sheet and the checklist card over the page.

### Shadow Vocabulary
- **Field plate** (`box-shadow: 0 12px 40px rgb(0 0 0 / 0.5)`): ground plates holding the Plan title and pull summary over the cane field.
- **Paper lift** (`box-shadow: 0 30px 80px rgb(0 0 0 / 0.5), 0 2px 6px rgb(0 0 0 / 0.3)`): the print sheet on screen; removed in print.
- **Card lift** (`box-shadow: 0 0 0 1px var(--line), 0 30px 70px rgb(0 0 0 / 0.45)`): the shop checklist card.
- **Swatch edge** (`box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.25)`): an inner hairline so dark swatches stay visible on dark panels (black at 0.2 on paper).

### Named Rules
**The No Card In A Card Rule.** Rail panels are a heading, content and a hairline. Never wrap a panel's contents in another bordered or shadowed container.

## Shapes

Gently rounded rectangles throughout, scaled to the object: 0.25rem for swatches, number inputs and the paper sheet; 0.375rem for small buttons and segment options; 0.5rem for primary buttons, tool tiles, chips and segmented tracks; 0.75rem for field plates and checklist buttons; 1.5rem for the checklist card. Full pills for colour pills in the checklist, status dots and progress segments. The one true circle is the slice itself, ringed by a millimetre tick ring (long ticks every 5mm). Icons sit on a 24px grid with 2px round-capped, round-joined strokes in currentColor; shape tool icons trace the real shape geometry.

## Components

### Buttons
Standard, solid and direct.
- **Shape:** gently rounded (0.5rem).
- **Primary:** accent fill, accent-ink text, 700 weight, 0.75rem by 1.25rem, trailing arrow icon where it moves you forward ("Open shop plan", "Go to the editor"). Lifts 1px on hover. One per view.
- **Secondary:** raise fill, ink text, 0.375rem radius, small; hover steps to the line colour. Used for Undo/Redo and "+ Clear layer".
- **Quiet:** no fill, mute text that turns ink on hover ("Edit design").
- **Icon button:** 2.25rem square, mute, hover raise; disabled at 30% opacity.
- **Destructive:** outlined in safety red at 40% alpha with safety text, or a line-outlined mute button that turns red on hover ("Clear slice").

### Segmented Control
A raise-coloured track with 0.125rem padding; the active option fills with the accent and accent-ink text, inactive options are mute. Used for Slice / Rod 3D and Print sheet / Shop checklist; it reports state with `aria-pressed`.

### Chips
- **Colour chip:** a 3-column grid of raise tiles, each a 1.75rem swatch band above the short colorant name (0.7rem) and its behaviour in mono (0.65rem), which turns safety red for hazards. Selected: ink border; hover: line border.
- **Colour pill (checklist):** full pill on raise, a 1.25rem swatch circle and the name.

### Cards / Containers
- **Rail panel:** heading row (section label plus an optional right-aligned action or mono total), content, bottom hairline; no background change from the rail.
- **Compatibility callout:** 0.375rem radius, 1px border and a dark wash in the severity colour (safety red, caution amber, or line on raise for info).

### Inputs / Fields
- **Sliders:** native ranges tinted with the section accent; the label sits left and the mono value right on one baseline.
- **Number input:** ground fill, 1px line stroke, small mono text, followed by a "mm" unit.
- **Focus:** a 2px accent outline offset 2px on every focusable element.

### Navigation
- **Tab bar:** 3.5rem sticky panel bar with the Mark and wordmark (800, tight), then tabs in 600 weight. Inactive tabs are mute and turn ink on hover; the active tab is ink with a 3px accent underline rounded at the top. A save-state dot and its label sit at the far right on wide screens. P toggles between the editor and its plan.
- **Mobile dock:** four equal buttons (22px icon over a 0.75rem label) on panel; active is raise with ink text.

### Tool Tile
Two-column tiles at least 4rem tall: a 24px shape glyph drawn from the real shape over its name. Inactive tiles are raise at 60% with mute text; active tiles have a 1px accent border on raise with ink text. Tool groups are "Single cane" and "Bundles", and number keys select tools.

### The Slice
A true-scale cross-section on the ground colour: the rod mapped at a world radius of 230 units, casing rings drawn in their real colours, a millimetre tick ring in mute, and three readouts beneath (gather Ø, pull ratio, pulled Ø in the accent). It never animates on its own.

### Cane Field
A hex-packed field whose every cell is a sprite of the user's real murrine, banded in spirals using the section's band palette (taken from the VORTEX GARDEN sketch). Cells never scale past their pre-drawn size and are never stretched non-uniformly.
- **Plan header:** one still frame drawn synchronously, banded by the design's real twist; redraws on design or width change only.
- **Loading transition:** rolled fresh on every tab change, born at the pointer, follows it, a click drops a vortex and a ripple; held about 0.9s then faded over 0.5s, with a mono process word ("Gathering…", "Pulling cane…") on a ground plate. Skipped entirely under reduced motion.

### Print Sheet
White paper (max 860px) in navy ink: a header with a 2px navy rule, the slice on the clear-glass backdrop, the pull in mono, a casing table and a numbered build order with a step plate for each step, closing with "Colours used" and "Watch for". In print, only the sheet is output: app chrome is hidden and the background is pure white.

### Shop Checklist
One step at a time on a single rounded card: a segmented progress bar (done in accent, current in accent-2, rest in line), the step number at 4.5rem in the accent, a headline title, colour pills, a 112px step plate, and Back / "Done, next" buttons (1 : 2 width, the forward button in accent) with a large touch height.

## Do's and Don'ts

### Do:
- **Do** theme through the roles (ground, panel, raise, line, ink, mute, faint, accent, accent-ink, accent-2) so a component re-themes when `data-section` changes.
- **Do** render every image of glass (field cells, step plates, the slice, thumbnails) from the user's actual design data.
- **Do** keep the editor still; motion belongs to the cane field's loading moment only, at about a second, and is skipped under `prefers-reduced-motion`.
- **Do** set text over a cane field on a ground plate with the field-plate shadow.
- **Do** isolate destructive actions in space: "Clear slice" sits 1.5rem below Undo/Redo, and "Delete shape" is red-outlined and set apart from the sliders.
- **Do** put names on every swatch and name colours in step titles.
- **Do** keep the print sheet paper-white with Primary-navy ink, whatever section it is printed from.

### Don't:
- **Don't** use purple, violet or magenta anywhere.
- **Don't** animate the Plan header or let the cane field run in the editor.
- **Don't** upscale or non-uniformly stretch field cells.
- **Don't** set headings, labels or prose in JetBrains Mono.
- **Don't** nest a bordered or shadowed card inside a rail panel.
- **Don't** use emoji or text glyphs as icons; draw them on the 24px, 2px-stroke grid.
- **Don't** let a colour be the only signal of state, hazard or identity.

<!-- Scope note: Vessel, Learn, Saved and About were re-themed only by remapping Tailwind's neutral-* and purple-* scales onto the section tokens; their layouts and components predate this system and were not redesigned. Treat them as legacy surfaces, not as references for this system. -->
