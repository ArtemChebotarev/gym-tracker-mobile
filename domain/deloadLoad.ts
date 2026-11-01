// How much of the load a deload week keeps — 03 · Progression Engine, "Правило 5". One number for
// the whole app, not a `progressionSettings` field: nothing in the UI changes it, and a snapshot
// copied into every mesocycle would keep an old value in place after this one changed. A snapshot
// saved while it was a field still carries `deloadWeightFactor`; nothing reads it.
//
// It cuts whatever the exercise's load is: the weight, or the reps where the body is the load. Every
// rule and every line of copy about the week reads it from here, so if types ever need different
// shares, that split lives here too.

export const DELOAD_LOAD_FACTOR = 0.5;
