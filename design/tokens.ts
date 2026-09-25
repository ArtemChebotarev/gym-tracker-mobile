// Design tokens — the only source of colors, typography, radii, spacing, sizes, border widths,
// opacities and shadows in the app (08.0 · Design SDK: "Ни один экран не задаёт цвет, размер или
// радиус самостоятельно"). Nothing that renders UI holds one of these values itself — not even as
// a local constant; `design/no-hardcoded-design-values` enforces it (task 100). If no token fits,
// add one here (and to 08.0) rather than a number at the call site, so a change to the scale is a
// change to this file only.
// Dark theme only — no abstraction over light/dark pairs, see "Тёмная тема единственная".
// Muscle-group family colors live in design/muscleFamily.ts, not here (see 057).

export const COLORS = {
  'surface/page': '#0E0F11',
  'surface/raised': '#141619',
  'surface/sheet': '#17191C',
  'surface/card': '#1A1C1F',
  'surface/control-active': '#2C3036',
  /**
   * A Popover's plate (08.7.1). Sits *above* a card rather than under it, so it is lighter than
   * `surface/card` — on `surface/sheet`, as 08.7.1 first had it, a plate floating over a card was
   * darker than the card and the two read as one block (Artem's review on the device).
   */
  'surface/popover': '#262A30',

  'border/default': '#2A2D31',
  'border/divider': '#1E2125',
  'border/divider-subtle': '#232629',

  // The frame of a day still to do, in the mesocycle overview (08.7, task 107). The sheet's own
  // `border/*` greys sit at ~1.3:1 against `surface/sheet`, so a cell drawn in them was invisible
  // on a phone; this one clears WCAG 1.4.11's 3:1 for meaningful graphics at 3.5:1.
  'border/cell-quiet': '#6B7076',

  'text/primary': '#F5F5F4',
  'text/secondary': '#C9CDD2',
  'text/muted': '#8A9099',
  'text/faint': '#6B7076',
  'text/disabled': '#5A5F65',

  accent: '#CDFF57',
  'accent/on': '#232B0A',
  'accent/bg': '#232B0A',
  'accent/border': '#4A5A20',

  danger: '#E2574C',
  'danger/border': '#5C2320',
  /**
   * A filled destructive block — the `Delete` revealed by swiping a row (08.3, task 117). The one
   * place danger is a fill rather than text and a contour (Artem's call): a swipe action *is* the
   * coloured block, and iOS has no other reading of it. Darker than `danger` so the 12pt label on
   * it clears 4.5:1 (4.8:1 against `danger/on`); `danger` itself gives only 3.4:1.
   */
  'danger/fill': '#C43C31',
  /** Text and icons on `danger/fill`. */
  'danger/on': '#F5F5F4',

  /** The dimmed backdrop behind a bottom sheet, and behind a Popover. */
  'overlay/scrim': 'rgba(0, 0, 0, 0.5)',
  /** Drop shadow under a lifted (dragged) row. */
  shadow: '#000000',
} as const;

export type ColorToken = keyof typeof COLORS;

export type TypographyValue = {
  fontSize: number;
  fontWeight: '400' | '500';
  letterSpacing?: number;
  textTransform?: 'uppercase';
};

// The scale follows iOS HIG Dynamic Type at its default "Large" size (task 101): body text and
// row titles 17 (Body), secondary lines 15 (Subheadline), labels 13 (Footnote), captions 12
// (Caption 1) — nothing under 12. The first scale was measured off the web mockups and read small
// on a real iPhone. Dynamic Type still scales all of it (`allowFontScaling` is on by default).
//
// letter-spacing and the uppercase transform apply only to `type/label` — the single place
// in the app with a capitalized section header, see "Заголовок секции" in 08.0. React Native's
// letterSpacing is in points, not em: 0.5 is 08.0's 0.04em at 13.
export const TYPOGRAPHY = {
  'type/screen-title': { fontSize: 28, fontWeight: '500' },
  'type/entity-title': { fontSize: 24, fontWeight: '500' },
  'type/sheet-title': { fontSize: 22, fontWeight: '500' },
  'type/card-title': { fontSize: 17, fontWeight: '500' },
  'type/row-title': { fontSize: 17, fontWeight: '400' },
  'type/body': { fontSize: 17, fontWeight: '400' },
  'type/value': { fontSize: 20, fontWeight: '400' },
  'type/meta': { fontSize: 15, fontWeight: '400' },
  'type/set-value': { fontSize: 20, fontWeight: '400' },
  'type/label': {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  'type/caption': { fontSize: 12, fontWeight: '400' },
} as const satisfies Record<string, TypographyValue>;

export type TypographyToken = keyof typeof TYPOGRAPHY;

// Fixed line heights, for text whose rendered height something else has to match exactly.
export const LINE_HEIGHTS = {
  /** The wizard footer hint — its placeholder reserves the same height on steps without one. */
  'line-height/hint': 16,
  /** A caption line whose height has to be reserved — RangeTrack's value labels, each of which
   * is positioned over the row rather than flowing in it (08.7.1). */
  'line-height/caption': 16,
} as const;

export type LineHeightToken = keyof typeof LINE_HEIGHTS;

export const RADII = {
  /**
   * Fully rounded ends on a block whose height is only known at layout time — a swipe action's
   * capsule is as tall as the row it sits behind, and a row is as tall as its content made it.
   * Larger than any such block ever gets: the platform clamps a radius to half the box it is on,
   * so the ends come out round whatever the height turns out to be. A block of a *known* height
   * takes `roundedBar`/`capsule` from design/shapes.ts instead, which derives the radius from it.
   */
  'radius/capsule': 999,
  'radius/pill': 20,
  'radius/sheet': 18,
  'radius/control': 12,
  'radius/field': 10,
  'radius/segment-inner': 8,
  'radius/small': 4,
  'radius/progress': 2,
} as const;

export type RadiusToken = keyof typeof RADII;

export const SPACING = {
  'space/screen': 16,
  'space/sheet': 20,
  'space/section': 24,
  'space/gap-tight': 8,
  'space/gap': 10,
  'space/row': 12,

  // A small step scale for the gaps the semantic tokens above don't name.
  'space/xxs': 2,
  'space/chip-y': 4,
  /** Set row: above and below its 44pt fields — kept tight, the fields already carry the height. */
  'space/set-row-y': 6,
  'space/xs': 4,
  'space/dots': 6,
  'space/md': 14,
  'space/action-row-y': 14,
  'space/button': 15,
  'space/pill-x': 18,
  'space/xl': 24,
} as const;

export type SpacingToken = keyof typeof SPACING;

// Rendered icon sizes — 08.0 · Design SDK, "Иконки": "Размер в таб-баре — 24, в IconButton — 20".
// Every icon in design/icons/ is drawn on the same 24×24 grid and scaled to one of these.
// The smaller ones size inline marks and text glyphs used as icons (✕, ›, ⋮⋮, +).
export const ICON_SIZES = {
  'icon/tab': 24,
  'icon/button': 20,
  'icon/chevron': 22,
  'icon/small': 18,
  'icon/inline': 17,
  'icon/glyph': 16,
} as const;

export type IconSizeToken = keyof typeof ICON_SIZES;

/** Stroke width of every icon's outline, on its 24×24 grid (08.0, "Иконки"). */
export const ICON_STROKE_WIDTH = 1.8;

export const BORDER_WIDTHS = {
  /** Outlines of fields, chips, cards, list and card dividers. */
  'border/default': 1,
  /** The accent outline marking the open cell of the mesocycle overview grid (08.7, task 127). */
  'border/emphasis': 2,
} as const;

export type BorderWidthToken = keyof typeof BORDER_WIDTHS;

export const OPACITY = {
  /** A control while it's pressed. */
  'opacity/pressed': 0.7,
  /** A disabled control, a skipped exercise card. */
  'opacity/dimmed': 0.5,
} as const;

export type OpacityToken = keyof typeof OPACITY;

// Component dimensions — fixed widths, heights and diameters of controls and marks.
export const SIZES = {
  /**
   * The smallest touch area of anything tappable (iOS HIG: 44×44pt). A control drawn smaller
   * reaches it through `hitSlop` — `tapTargetSlop` in design/shapes.ts.
   */
  'size/tap-target': 44,
  /** Muscle-group dot in chips, section headers and filter options. */
  'size/dot': 8,
  /** The larger group dot of the mesocycle editor and the mesocycle list's week dots. */
  'size/dot-large': 10,
  /** ListRow's multi-select checkbox. */
  'size/checkbox': 24,
  /** A small round mark: the workout's completed check, the editor's add-exercise "+". */
  'size/badge': 28,
  /** Stepper's inline round buttons; the editor's drag handle. */
  'size/control-inline': 32,
  /** A chip's minimum height — Chip, the filter chips, the editor's day tabs. */
  'size/chip': 36,
  /** ListRow's action pill (Start, Copy) — drawn smaller, 44pt to the touch. */
  'size/pill': 32,
  /** Round IconButton and Stepper buttons (08.0: "Размер 36", tap area 44). */
  'size/icon-button': 36,
  /** Set row: the target indicator column. */
  'size/indicator-column': 24,
  /** Set row: the Log checkbox — drawn at 32, 44pt to the touch (`tapTargetSlop`). */
  'size/log-box': 32,
  /** Set row: the Log column — as wide as the checkbox's tap target. */
  'size/log-column': 44,
  /** Set row fields and mesocycle overview cells. */
  'size/cell': 44,
  /** Mesocycle overview: the week label column. */
  'size/week-column': 64,
  /**
   * One capsule revealed by swiping a row (`SwipeableRow`, 08.3). Wide enough for a 20pt icon over
   * a short one-word label and, at 64, still past the 44pt tap target in the one direction a swipe
   * action can't grow — its height is the row's, less the inset that makes it a capsule. It is
   * also the width of the leading capsule's own icon-and-label block, which stays that wide
   * whatever the capsule around it has stretched to.
   */
  'size/swipe-action': 64,
  /** Mesocycle editor: an exercise row's fixed height (the drag maths divide by it). */
  'size/exercise-row': 68,
  /** Mesocycle editor: the Sets column — Stepper's inline width. */
  'size/sets-column': 104,
  /** Bottom sheet grabber. */
  'size/grabber-width': 36,
  'size/grabber-height': 5,
  /** ProgressBar and the wizard header's step segments. */
  'size/progress': 4,
  /** Dropdown's open option panel. */
  'size/dropdown-panel': 240,
  /** New/Edit exercise form: room for its fields plus one open Dropdown panel. */
  'size/form-fields': 480,
  /** Tallest a bottom sheet gets (and the height of a fixed-height one). */
  'size/sheet-max': '80%',
  /** Popover's arrow to its anchor — a square of this side, turned 45°. */
  'size/popover-arrow': 12,
  /** The bar of track beside a RangeTrack legend line, showing which span it names (08.7.1). */
  'size/legend-swatch': 24,
  /**
   * A round button drawn around a glyph rather than a full icon — the weight-swap ⓘ beside the
   * Reps column header (08.7.1). Drawn at 24, 44pt to the touch through `tapTargetSlop`.
   */
  'size/glyph-button': 24,
} as const;

export type SizeToken = keyof typeof SIZES;

export const SHADOWS = {
  /** A row lifted off the list while it's dragged. */
  'shadow/lifted': {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  /**
   * A plate floating over the screen — a Popover (08.7.1). Deeper and offset downwards, so the
   * plate reads as being above what it covers rather than printed on it.
   */
  'shadow/overlay': {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
} as const;

export type ShadowToken = keyof typeof SHADOWS;
