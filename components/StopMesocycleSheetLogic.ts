// Pure helpers behind components/StopMesocycleSheet.tsx — see the code-style skill.

/**
 * What has to be typed to stop a mesocycle. A tap-through `Are you sure?` is the wrong gate for
 * this one: it ends weeks of a block in one press, and it is offered in the same menu as Add
 * exercise, mid-workout, on a phone (Artem's review of 052 — RP's own app asks for the words too).
 */
export const STOP_MESOCYCLE_PHRASE = 'END MESO';

/**
 * Whether `text` is the confirmation phrase. Case and surrounding spaces are forgiven — typing the
 * words is the deliberate act being asked for, and failing someone over a stray capital would only
 * teach them to paste it.
 */
export function isStopMesocycleConfirmed(text: string): boolean {
  return text.trim().toUpperCase() === STOP_MESOCYCLE_PHRASE;
}

/**
 * What stopping does, as the sheet states it (05, "Остановить мезоцикл"): the block ends where it
 * stands, unfinished workouts count as skipped, nothing more is planned — and everything already
 * logged stays, which is the one reassuring half of it.
 */
export const STOP_MESOCYCLE_WARNING =
  "The block ends here. Workouts you haven't done are marked skipped and no further weeks are planned. Everything you logged stays in your history. This can't be undone.";
