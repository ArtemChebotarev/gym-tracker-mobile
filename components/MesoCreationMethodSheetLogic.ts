// Pure helpers behind components/MesoCreationMethodSheet.tsx — see the code-style skill and
// 08.8 · Редактор мезоцикла — Flow C, "Лист «Способ создания»".

/**
 * The line under `Copy a mesocycle`.
 *
 * Normally it says what copying is for. With nothing finished yet it says why the row is off
 * instead: the row exists because the feature does, it just has no data to work from, and a row
 * that is greyed out with its usual caption still under it only leaves the reader guessing.
 * This is the one row on this sheet that can be present and not work — templates, which don't
 * exist in this version, are absent from the sheet entirely rather than shown disabled.
 */
export function copyMethodCaption(canCopy: boolean): string {
  return canCopy
    ? "Start from a week you've already trained"
    : "Nothing to copy yet — finish a mesocycle first";
}
