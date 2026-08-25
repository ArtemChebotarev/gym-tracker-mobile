export type WeightUnit = 'kg' | 'lb';

const KG_TO_LB = 2.2046226218;

export function convertWeight(weightKg: number, unit: WeightUnit): number {
  if (unit === 'lb') {
    return weightKg * KG_TO_LB;
  }

  return weightKg;
}

export function formatWeight(weightKg: number, unit: WeightUnit): string {
  const value = convertWeight(weightKg, unit);
  const rounded = Math.round(value * 10) / 10;

  return `${rounded} ${unit}`;
}
