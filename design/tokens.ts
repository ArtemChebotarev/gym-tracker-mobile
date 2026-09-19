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

  'border/default': '#2A2D31',
  'border/divider': '#1E2125',
  'border/divider-subtle': '#232629',

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

  /** The dimmed backdrop behind a bottom sheet. */
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

// letter-spacing and the uppercase transform apply only to `type/label` — the single place
// in the app with a capitalized section header, see "Заголовок секции" in 08.0.
export const TYPOGRAPHY = {
  'type/screen-title': { fontSize: 24, fontWeight: '500' },
  'type/entity-title': { fontSize: 22, fontWeight: '500' },
  'type/sheet-title': { fontSize: 19, fontWeight: '500' },
  'type/card-title': { fontSize: 16, fontWeight: '500' },
  'type/row-title': { fontSize: 14, fontWeight: '400' },
  'type/body': { fontSize: 13, fontWeight: '400' },
  'type/value': { fontSize: 15, fontWeight: '400' },
  'type/meta': { fontSize: 12, fontWeight: '400' },
  'type/set-value': { fontSize: 17, fontWeight: '400' },
  'type/label': {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.04,
    textTransform: 'uppercase',
  },
  'type/caption': { fontSize: 10, fontWeight: '400' },
} as const satisfies Record<string, TypographyValue>;

export type TypographyToken = keyof typeof TYPOGRAPHY;

// Fixed line heights, for text whose rendered height something else has to match exactly.
export const LINE_HEIGHTS = {
  /** The wizard footer hint — its placeholder reserves the same height on steps without one. */
  'line-height/hint': 14,
} as const;

export type LineHeightToken = keyof typeof LINE_HEIGHTS;

export const RADII = {
  'radius/pill': 20,
  'radius/sheet': 18,
  'radius/control': 10,
  'radius/field': 9,
  'radius/segment-inner': 7,
  'radius/small': 4,
  'radius/progress': 2,
} as const;

export type RadiusToken = keyof typeof RADII;

export const SPACING = {
  'space/screen': 14,
  'space/sheet': 16,
  'space/section': 18,
  'space/gap-tight': 6,
  'space/gap': 7,
  'space/row': 10,

  // A small step scale for the gaps the semantic tokens above don't name.
  'space/xxs': 2,
  'space/chip-y': 3,
  'space/xs': 4,
  'space/dots': 5,
  'space/sm': 8,
  'space/md': 12,
  'space/action-row-y': 13,
  'space/legend': 14,
  'space/button': 15,
  'space/pill-x': 16,
  'space/xl': 24,
} as const;

export type SpacingToken = keyof typeof SPACING;

// Rendered icon sizes — 08.0 · Design SDK, "Иконки": "Размер в таб-баре — 20, в IconButton — 18".
// Every icon in design/icons/ is drawn on the same 24×24 grid and scaled to one of these.
// The smaller ones size inline marks and text glyphs used as icons (✕, ›, ⋮⋮, +).
export const ICON_SIZES = {
  'icon/tab': 20,
  'icon/button': 18,
  'icon/chevron': 20,
  'icon/small': 16,
  'icon/inline': 15,
  'icon/glyph': 14,
} as const;

export type IconSizeToken = keyof typeof ICON_SIZES;

/** Stroke width of every icon's outline, on its 24×24 grid (08.0, "Иконки"). */
export const ICON_STROKE_WIDTH = 1.8;

export const BORDER_WIDTHS = {
  /** Outlines of fields, chips, cards, list and card dividers. */
  'border/default': 1,
  /** The ring marking the open cell of the mesocycle overview grid (08.7). */
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
  /** Muscle-group dot in chips, section headers and filter options. */
  'size/dot': 6,
  /** The larger group dot of the mesocycle editor and the mesocycle list's week dots. */
  'size/dot-large': 8,
  /** Legend swatch of the mesocycle overview grid. */
  'size/swatch': 14,
  /** ListRow's multi-select checkbox. */
  'size/checkbox': 20,
  /** A small round mark: the workout's completed check, the editor's add-exercise "+". */
  'size/badge': 22,
  /** Stepper's inline round buttons; the editor's drag handle. */
  'size/control-inline': 24,
  /** Round IconButton and Stepper buttons (08.0: "Размер 28–30"). */
  'size/icon-button': 30,
  /** Set row: the target indicator column. */
  'size/indicator-column': 22,
  /** Set row: the Log checkbox. */
  'size/log-box': 34,
  /** Set row: the Log column. */
  'size/log-column': 38,
  /** Set row fields and mesocycle overview cells. */
  'size/cell': 40,
  /** Mesocycle overview: the week label column. */
  'size/week-column': 52,
  /** Mesocycle editor: an exercise row's fixed height (the drag maths divide by it). */
  'size/exercise-row': 58,
  /** Mesocycle editor: the Sets column — Stepper's inline width. */
  'size/sets-column': 80,
  /** Bottom sheet grabber. */
  'size/grabber-width': 36,
  'size/grabber-height': 4,
  /** ProgressBar and the wizard header's step segments. */
  'size/progress': 3,
  /** Dropdown's open option panel. */
  'size/dropdown-panel': 190,
  /** New/Edit exercise form: room for its fields plus one open Dropdown panel. */
  'size/form-fields': 400,
  /** Tallest a bottom sheet gets (and the height of a fixed-height one). */
  'size/sheet-max': '80%',
  /** Extra touch area around a small tap target (SearchField's clear button). */
  'size/hit-slop': 8,
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
} as const;

export type ShadowToken = keyof typeof SHADOWS;
