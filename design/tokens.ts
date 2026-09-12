// Design tokens — the only source of colors, typography, radii, and spacing values in the
// app (08.0 · Design SDK: "Ни один экран не задаёт цвет, размер или радиус самостоятельно").
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
  'type/row-title': { fontSize: 14, fontWeight: '400' },
  'type/body': { fontSize: 13, fontWeight: '400' },
  'type/value': { fontSize: 15, fontWeight: '400' },
  'type/label': {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.04,
    textTransform: 'uppercase',
  },
  'type/caption': { fontSize: 10, fontWeight: '400' },
} as const satisfies Record<string, TypographyValue>;

export type TypographyToken = keyof typeof TYPOGRAPHY;

export const RADII = {
  'radius/pill': 20,
  'radius/sheet': 18,
  'radius/control': 10,
  'radius/field': 9,
  'radius/segment-inner': 7,
} as const;

export type RadiusToken = keyof typeof RADII;

export const SPACING = {
  'space/screen': 14,
  'space/sheet': 16,
  'space/section': 18,
  'space/gap-tight': 6,
  'space/gap': 7,
  'space/row': 10,
} as const;

export type SpacingToken = keyof typeof SPACING;
