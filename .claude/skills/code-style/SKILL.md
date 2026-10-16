---
name: code-style
description: File organization and code-splitting conventions for this repo — domain modules, screens, styles/logic separation, RootScreen usage, and reusing existing models. Consult before writing any new source file, splitting an existing one, or reviewing a PR for file organization.
---

# Code style

One file, one responsibility.

## Domain modules

Don't mix a domain module's type definitions with its business logic (validators, converters, etc.) in the same file — split them, e.g. `domain/mesocycle.ts` (types) + `domain/mesocycleValidators.ts` (validators for those types). Name the logic file after the model file it belongs to (`<model>Validators.ts`, `<model>Converters.ts`, ...). Mirror the split in `__tests__/` so each source file has its own matching test file.

## Screens

Screens keep the same split, one level up. A screen file (`app/**`, or a screen-level component under `components/`) holds only JSX/rendering wiring. Pull its `StyleSheet.create()` block out into `<ScreenName>Styles.ts`, and any pure, non-JSX helper functions (formatters, derived values, predicates) into `<ScreenName>Logic.ts`. Mirror the split in `__tests__/` the same way the domain rule does. This does *not* apply to `design/components/*` — those are small, single-purpose primitives where component + styles together in one file is the established, tested pattern; it's screens (composite, often carrying real business logic) where the split earns its keep. Don't create an empty file just to have one — a screen with nothing to extract (no helpers beyond JSX) doesn't need a Logic file.

**For a route file under `app/**`, the Styles/Logic siblings go in `components/`, never beside the route file itself.** Expo Router treats *every* file directly under `app/` as a route (only `_layout`, `+api`, `+html`, `+not-found` are special-cased) — a plain `app/(tabs)/libraryLogic.ts` next to `app/(tabs)/library.tsx` doesn't get skipped, it silently becomes a fourth tab. Since a route's filename is often generic or Expo-Router-mandated (`index.tsx`), name these siblings after the route's exported component instead of its filename — `app/(tabs)/index.tsx` exporting `TodayScreen` gets `components/TodayScreenStyles.ts`, `app/(tabs)/library.tsx` exporting `LibraryScreen` gets `components/LibraryScreenLogic.ts`.

Both halves of this split are lint-enforced (`.tsx` files under `app/**`/`components/**` only, so the `Styles.ts`/`Logic.ts` sibling files themselves aren't flagged for containing exactly what they exist to hold): `codeStyle/no-inline-screen-styles` rejects a `StyleSheet.create(...)` call in a screen file, and `codeStyle/no-inline-screen-logic` rejects a top-level function whose name isn't PascalCase (i.e. isn't the screen's own component) — see `eslint-rules/noInlineScreenStyles.js` and `eslint-rules/noInlineScreenLogic.js`.

Styles stay as typed `.ts` files (`StyleSheet.create(...)`), not `.css`. React Native has no CSS engine — no browser, no CSSOM, layout is Yoga/flexbox over native views, not DOM elements — so `StyleSheet.create` is the only real styling mechanism here. Keeping it in TS also lets a style object reference the typed tokens in `design/tokens.ts` (`COLORS`, `SPACING`, `TYPOGRAPHY`, `RADII`) directly, with autocomplete and type-checking, instead of a separate CSS-variable generation step that would serve no actual CSS runtime.

Every root tab screen (Today, Mesocycles, Library, ...) renders through `design/components/RootScreen` for its title and top frame — it owns the safe-area inset, screen padding, and title row so the title lands at the exact same position on every tab (08.0 · Design SDK documents `type/screen-title` as "Заголовок корневого экрана" — singular, one shared treatment). Never hand-roll a root screen's own `SafeAreaView` + title styling.

## Design values: tokens only

No color, size, spacing, radius, border width, opacity or shadow value is written anywhere outside `design/tokens.ts` — not in screens, not in `design/components/*`, not in icons. **That includes a local constant**: `const SUBTITLE_FONT_SIZE = 12;` followed by `fontSize: SUBTITLE_FONT_SIZE` is the same hardcode with a name on it, and the next change to the scale would have to hunt it down file by file. The same goes for arithmetic on a number (`borderRadius: DOT_SIZE / 2`), a component's default (`{ size = 18 }`), an exported number another file imports, and `rgba(...)` strings.

- Reference the token directly: `fontSize: TYPOGRAPHY['type/meta'].fontSize`, `width: SIZES['size/log-box']`, `opacity: OPACITY['opacity/pressed']`, `...SHADOWS['shadow/lifted']`. A local alias *of a token* is fine (`const META = TYPOGRAPHY['type/meta'].fontSize`).
- Derived geometry goes through `design/shapes.ts` (`circle`, `square`, `roundedBar`, `capsule`) instead of `/ 2` at the call site.
- **No fitting token? Add one** to `design/tokens.ts` (and to 08.0 · Design SDK in Notion), in the group it belongs to, with a comment saying where it's used. Reuse an existing token when the value *means* the same thing; add a new one when it only happens to be the same number.
- Not design values, so they stay local: flex ratios, `zIndex`, gesture thresholds, animation durations, step counts, and an icon's drawing geometry on its 24×24 grid. `0` is allowed anywhere.

Lint-enforced by `design/no-hardcoded-design-values` (`eslint-rules/noHardcodedDesignValues.js`) over `app/**`, `components/**`, `design/components/**` and `design/icons/**`. Never silence it with an `eslint-disable` — add the token.

## Wizard steps and creation forms: use the existing building blocks

A step of a wizard, or a creation form (the New exercise page, the cycle editor's steps — 08.5, 08.8, 08.10), is assembled from what `design/components/` already has. Do not draw a second stepper, option list, time input or step header. The full description is in Notion, 08.0 · Design SDK, section "Формы и шаги визарда"; the short version:

- **One of a few options, each with a line of explanation** — a group of `OptionCard`s. Tapping selects; moving on is a separate `Next` in the footer.
- **A number** — `StepperRow` (`−` / `+`). If it is easier to set directly, pass `onValuePress`, which draws the value as a pill and opens `NumberPickerSheet` (a count) or `TimePickerSheet` (a duration, minutes and seconds in steps of 5 s). Both are built on `WheelPickerSheet`; never draw wheels of your own. A qualifier of a label goes grey after it on the same line (`labelSuffix`: `Rest · between rounds`), never on a second line — every row is one height.
- **A pick from a long list** — `Dropdown`, which opens as an overlay and closes when another opens.
- **The frame and the header** — `WizardScreen`. Its title names the *step* and changes with it. A wizard of one step draws no `Step N of M` and no progress bar (they appear by themselves at two steps or more). What belongs to the title (a type chip) goes in `titleAccessory`.
- **When a mockup draws any of these differently** — and the 4.x / 7.x / 8.x canvases of 10.1 and the 08.5 mockups do, in places — take the component and let the mockup be adjusted to it, not the other way round. If the component really cannot do what a step needs, extend the component (a prop, a variant) in `design/components/` and describe it in 08.0; do not fork it into the screen.

## Reuse existing models

Reuse existing models, types, classes, and constants instead of recreating them. Before adding a new type or a runtime constant that represents a domain concept, check whether `domain/` (or the relevant sibling layer — `repositories/`, an existing `storage/` adapter, etc.) already defines it, and import that instead of writing a second copy — e.g. a repository that needs every value of a domain enum should reuse a constant exported from the domain module that owns that type, not hand-list the values again. A second hand-written copy of the same values silently drifts from the original the next time it changes. If you deliberately don't reuse an existing model (the shapes only look similar but represent different concepts, reusing it would violate a layer boundary, etc.), say why in the PR summary.
