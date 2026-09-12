// Muscle-group color mapping — see 08.0 · Design SDK, "Цвета групп мышц". Color is assigned
// to the family, not the individual group: four families read at a glance, twelve individual
// colors don't. `tint` and `text-on-tint` are derived from the family color by a fixed rule
// below rather than hand-picked per family (08.0: "Производные значения выводятся ... по
// правилу, а не задаются вручную").
//
// The spec's own worked example for `pull` was written by hand and didn't reproduce under any
// standard color-blend formula, so it was corrected in the spec to match this rule's actual
// output rather than the other way around.

import type { MuscleGroup } from '@domain/catalog';
import { COLORS } from './tokens';

export const MUSCLE_FAMILIES = ['push', 'pull', 'legs', 'core'] as const;
export type MuscleFamily = (typeof MUSCLE_FAMILIES)[number];

const FAMILY_BY_MUSCLE_GROUP: Record<MuscleGroup, MuscleFamily> = {
  chest: 'push',
  shoulders: 'push',
  triceps: 'push',
  back: 'pull',
  biceps: 'pull',
  forearms: 'pull',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  abs: 'core',
  traps: 'core',
};

const FAMILY_COLOR: Record<MuscleFamily, string> = {
  push: '#F0A537',
  pull: '#5B9CF8',
  legs: '#35C2A0',
  core: '#A78BFA',
};

const TINT_OPACITY = 0.12;
const TEXT_ON_TINT_LIGHTNESS = 78;

// Takes the raw muscleGroupId a screen has on hand (e.g. straight off a stored Exercise)
// rather than the narrow MuscleGroup type, so a value that predates a domain change or was
// corrupted in storage degrades to `undefined` instead of crashing the lookup.
export function getMuscleFamily(muscleGroupId: string): MuscleFamily | undefined {
  return FAMILY_BY_MUSCLE_GROUP[muscleGroupId as MuscleGroup];
}

export function getFamilyColor(family: MuscleFamily): string {
  return FAMILY_COLOR[family];
}

// tint = the family color blended at TINT_OPACITY over `surface/page` — background for a
// muscle-group chip.
export function getFamilyTint(family: MuscleFamily): string {
  return blendOverPage(FAMILY_COLOR[family], TINT_OPACITY);
}

// text-on-tint = the family color lightened to a fixed lightness, keeping its hue and
// saturation — readable on top of the tint above, for any family.
export function getFamilyTextOnTint(family: MuscleFamily): string {
  return withLightness(FAMILY_COLOR[family], TEXT_ON_TINT_LIGHTNESS);
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
