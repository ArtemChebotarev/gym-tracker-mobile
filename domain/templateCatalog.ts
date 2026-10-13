// The mesocycle templates that ship with the app — see 02 · Domain Model ("MesoTemplate") and
// the story "Start cycle from template" (GT-2). A plain TS array like `exerciseCatalog.ts`, for
// the same reasons: ids are hand-picked slugs baked into the app, and every `exerciseId` is
// checked against the exercise catalog by a test rather than trusted.
//
// This is what `npm run catalog:migration` writes into a migration, next to the exercises. Two
// things follow from that, and both are the reason the file changes rarely:
//
// - A template that has reached a phone is there for good. The migration is an upsert, so it
//   corrects a template that exists and adds a new one, but never removes one — a catalog
//   template can only be hidden by the user. A template that is wrong is corrected by a newer
//   migration, not withdrawn.
// - Every edit here needs a new migration (the test "is exactly the catalog this build ships"
//   fails until there is one), so a template goes in once it is settled, not as a draft.
//
// Names carry no number of days: the list appends it itself, from `weekPlan` ("Full Body · 3 days").
// Day names are `Day N` only.
import type { MesoTemplate } from './plan';
import type { Unsaved } from './timestamps';

export const TEMPLATE_CATALOG: readonly Unsaved<MesoTemplate>[] = [];
