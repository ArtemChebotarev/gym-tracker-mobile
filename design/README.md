# design

Design system: reusable UI primitives and tokens, independent of screens and business logic.

- `tokens.ts` — **the only place** a color, size, spacing, radius, border width, opacity or shadow value is written (08.0 · Design SDK, "Только токены"). Everything else references a token, never a number or a local constant holding one — enforced by `design/no-hardcoded-design-values`. No fitting token → add one here and to 08.0.
- `shapes.ts` — geometry derived from a token (`circle`, `square`, `roundedBar`, `capsule`).
- `components/`, `icons/` — primitives built only from the above.
