// Pure helpers behind components/MesoCreationMethodSheet.tsx — see the code-style skill and
// 08.8 · Редактор мезоцикла — Flow C, "Лист «Способ создания»".

export type CreationMethod = 'template' | 'scratch' | 'copy';

/** Always available, and the way in for a new user — so Next always has something to act on. */
export const DEFAULT_CREATION_METHOD: CreationMethod = 'template';

/**
 * The line under `Copy a cycle`.
 *
 * Normally it says what copying is for. With nothing finished yet it says why the card is off
 * instead: the card exists because the feature does, it just has no data to work from, and a card
 * that is greyed out with its usual caption still under it only leaves the reader guessing.
 * This is the one card on this sheet that can be present and not work.
 */
export function copyMethodCaption(canCopy: boolean): string {
  return canCopy
    ? "Start from a week you've already trained"
    : "Nothing to copy yet — finish a training cycle first";
}
