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

/**
 * `name` if no one has it yet, otherwise `name` with the first free suffix ` 2`, ` 3`, … — how a
 * name offered by the app avoids one the user already has (04, "Правила Flow B": "Имя цикла").
 * Names are compared trimmed and exactly, case included: the same comparison a user makes when
 * reading two names off a list.
 */
export function firstFreeName(name: string, takenNames: readonly string[]): string {
  const taken = new Set(takenNames.map((other) => other.trim()));
  const base = name.trim();
  if (!taken.has(base)) {
    return base;
  }
  let suffix = 2;
  while (taken.has(`${base} ${suffix}`)) {
    suffix += 1;
  }
  return `${base} ${suffix}`;
}

/**
 * Whether `name` matches what was typed into a list's search field: a case-insensitive substring,
 * with the query trimmed. An empty query matches every name. The one rule behind every search
 * field in the app — the exercise library's (08.6) and the template list's (08.10) — so typing the
 * same thing finds things the same way wherever it is typed.
 */
export function nameMatchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.trim().toLowerCase());
}
