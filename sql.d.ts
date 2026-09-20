// Drizzle's generated `.sql` migrations are imported as modules so the bundler carries them into
// the app (see metro.config.js). Metro turns each one into a string; this tells TypeScript the
// same thing, since a `.sql` file has no types of its own.
declare module '*.sql' {
  const migration: string;
  export default migration;
}
