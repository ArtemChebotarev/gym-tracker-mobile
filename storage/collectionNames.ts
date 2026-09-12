// Canonical names for the in-memory "tables". A repository that reaches into another
// entity's collection directly — e.g. Mesocycle cascading a delete into its child sessions,
// session exercises, and set logs — must pass `InMemoryStore.collection()` the exact same
// name the owning repository uses, since the store looks collections up by that string.
// Centralized here so that agreement doesn't depend on every file spelling the name
// identically by hand.
export const MESOCYCLE_COLLECTION = 'Mesocycle';
export const SESSION_COLLECTION = 'Session';
export const SESSION_EXERCISE_COLLECTION = 'SessionExercise';
export const SET_LOG_COLLECTION = 'SetLog';
