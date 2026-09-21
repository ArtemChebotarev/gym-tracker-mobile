/**
 * `2 RIR` — reps in reserve as every screen writes it: the chip above an exercise card, the reps
 * placeholder of a set row with no target reps (08.7), and the trailing note of a logged set on the
 * Exercise screen (08.6).
 *
 * It lives here rather than beside any one of them because it belongs to all three. It used to sit
 * in `components/WorkoutExerciseCardLogic.ts`, which made `WorkoutSetRowLogic.ts` import back into
 * the card's logic for one line and closed a require cycle between the two (task 114).
 */
export function formatRir(rir: number): string {
  return `${rir} RIR`;
}
