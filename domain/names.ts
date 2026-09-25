// The one rule behind every user-typed name in the app: what the field holds, trimmed, and never
// nothing. Its own module rather than a copy in each `*Validators.ts`, because a name is the same
// concept wherever it is typed — an exercise's (08.6, "Обрезается по краям, не может быть
// пустым") and a mesocycle's (087) are the same field with a different noun in front of it.
//
// The narrow validators build on this one and keep their own doc and error wording; see
// `normalizeExerciseName` in domain/catalogValidators.ts and `normalizeMesocycleName` in
// domain/mesocycleValidators.ts.

/**
 * Whether `name` holds anything but whitespace — what a form's Save button asks before it lets a
 * name through. The same question `normalizeRequiredName` throws on, so a sheet that disables
 * Save and the domain behind it can never disagree about what counts as empty.
 */
export function isNameEntered(name: string): boolean {
  return name.trim().length > 0;
}

/**
 * Trims `name` and returns it, or throws if nothing is left. `subject` names what is being
 * named — it opens the error message, so it reads as a sentence: `Mesocycle name is required.`
 */
export function normalizeRequiredName(name: string, subject: string): string {
  if (!isNameEntered(name)) {
    throw new Error(`${subject} name is required.`);
  }
  return name.trim();
}
