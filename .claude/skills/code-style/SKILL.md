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

## Reuse existing models

Reuse existing models, types, classes, and constants instead of recreating them. Before adding a new type or a runtime constant that represents a domain concept, check whether `domain/` (or the relevant sibling layer — `repositories/`, an existing `storage/` adapter, etc.) already defines it, and import that instead of writing a second copy — e.g. a repository that needs every value of a domain enum should reuse a constant exported from the domain module that owns that type, not hand-list the values again. A second hand-written copy of the same values silently drifts from the original the next time it changes. If you deliberately don't reuse an existing model (the shapes only look similar but represent different concepts, reusing it would violate a layer boundary, etc.), say why in the PR summary.
