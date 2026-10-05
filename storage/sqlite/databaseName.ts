/**
 * The name of the app's database file, inside the app's own sandboxed documents directory —
 * expo-sqlite puts it there, and the OS backs it up and deletes it with the app. Naming it here
 * rather than at the call site keeps it out of the bootstrap's business: a rename would be a data
 * migration, not a startup detail. It keeps the pre-Hybro name for that reason (task 131).
 *
 * Its own module, apart from `openAppDatabase`, so code outside the app — the dev seed script —
 * can name the file without importing expo-sqlite's native module.
 */
export const DATABASE_NAME = 'gymtracker.db';
