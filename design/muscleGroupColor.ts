// Muscle-group color mapping — see 08.0 · Design SDK, "Цвета групп мышц". Color is assigned
// to a coarser category, not the individual group: twelve individual colors aren't
// distinguishable, six categories are. `tint` and `text-on-tint` are derived from the
// category color by a fixed rule below rather than hand-picked per category (08.0:
// "Производные значения выводятся ... по правилу, а не задаются вручную").

import type { MuscleGroup } from '@domain/catalog';
import { COLORS } from './tokens';

export const MUSCLE_GROUP_COLOR_CATEGORIES = [
  'chest',
  'back',
  'arms',
  'legs',
  'shoulders',
  'abs',
] as const;
export type MuscleGroupColorCategory = (typeof MUSCLE_GROUP_COLOR_CATEGORIES)[number];

const CATEGORY_BY_MUSCLE_GROUP: Record<MuscleGroup, MuscleGroupColorCategory> = {
  chest: 'chest',
  back: 'back',
  traps: 'back',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  shoulders: 'shoulders',
  abs: 'abs',
};

const CATEGORY_COLOR: Record<MuscleGroupColorCategory, string> = {
  chest: '#F0A537',
  back: '#5B9CF8',
  arms: '#F25ACE',
  legs: '#35C2A0',
  shoulders: '#5AF25F',
  abs: '#A78BFA',
};

const TINT_OPACITY = 0.12;
const TEXT_ON_TINT_LIGHTNESS = 78;

// Takes the raw muscleGroupId a screen has on hand (e.g. straight off a stored Exercise)
// rather than the narrow MuscleGroup type, so a value that predates a domain change or was
// corrupted in storage degrades to `undefined` instead of crashing the lookup.
export function getMuscleGroupCategory(
  muscleGroupId: string,
): MuscleGroupColorCategory | undefined {
  return CATEGORY_BY_MUSCLE_GROUP[muscleGroupId as MuscleGroup];
}

export function getCategoryColor(category: MuscleGroupColorCategory): string {
  return CATEGORY_COLOR[category];
}

// tint = the category color blended at TINT_OPACITY over `surface/page` — background for a
// muscle-group chip.
export function getCategoryTint(category: MuscleGroupColorCategory): string {
  return blendOverPage(CATEGORY_COLOR[category], TINT_OPACITY);
}

// text-on-tint = the category color lightened to a fixed lightness, keeping its hue and
// saturation — readable on top of the tint above, for any category.
export function getCategoryTextOnTint(category: MuscleGroupColorCategory): string {
  return withLightness(CATEGORY_COLOR[category], TEXT_ON_TINT_LIGHTNESS);
}

// --- color math, private to this module -------------------------------------------------

type Rgb = [number, number, number];
type Hsl = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex([r, g, b]: Rgb): string {
  const clamp = (channel: number) => Math.max(0, Math.min(255, Math.round(channel)));
  return `#${[r, g, b]
    .map(clamp)
    .map((channel) => channel.toString(16).padStart(2, '0').toUpperCase())
    .join('')}`;
}

// Standard sRGB alpha blend: `opacity` of `color` painted over `surface/page`.
function blendOverPage(color: string, opacity: number): string {
  const [pageR, pageG, pageB] = hexToRgb(COLORS['surface/page']);
  const [fgR, fgG, fgB] = hexToRgb(color);
  const blend = (bg: number, fg: number) => bg * (1 - opacity) + fg * opacity;
  return rgbToHex([blend(pageR, fgR), blend(pageG, fgG), blend(pageB, fgB)]);
}

function rgbToHsl([r, g, b]: Rgb): Hsl {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const lightness = (max + min) / 2;

  if (max === min) {
    return [0, 0, lightness * 100];
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue: number;
  if (max === rNorm) {
    hue = (gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0);
  } else if (max === gNorm) {
    hue = (bNorm - rNorm) / delta + 2;
  } else {
    hue = (rNorm - gNorm) / delta + 4;
  }

  return [hue * 60, saturation * 100, lightness * 100];
}

function hslToRgb([h, s, l]: Hsl): Rgb {
  const hue = h / 360;
  const saturation = s / 100;
  const lightness = l / 100;

  if (saturation === 0) {
    const gray = lightness * 255;
    return [gray, gray, gray];
  }

  const hueToChannel = (p: number, q: number, t: number): number => {
    let tNorm = t;
    if (tNorm < 0) tNorm += 1;
    if (tNorm > 1) tNorm -= 1;
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
    if (tNorm < 1 / 2) return q;
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
    return p;
  };

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return [
    255 * hueToChannel(p, q, hue + 1 / 3),
    255 * hueToChannel(p, q, hue),
    255 * hueToChannel(p, q, hue - 1 / 3),
  ];
}

// Lightens `color` to a fixed target lightness while keeping its hue and saturation.
function withLightness(color: string, targetLightness: number): string {
  const [hue, saturation] = rgbToHsl(hexToRgb(color));
  return rgbToHex(hslToRgb([hue, saturation, targetLightness]));
}
