// Pure helpers behind components/BodyWeightSheet.tsx — see the code-style skill.

/** A body weight as the sheet writes it: a positive number, a decimal comma counting too. */
export function parseBodyWeight(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  return value > 0 ? value : null;
}
