// The "Watch how to do it" link of the Exercise screen — task 153. v1 ships no pictures or
// animations of its own (the spike "Remove older sets from exercise overview", 2026-10-03:
// licences and animation are post-release work), so technique is one tap away in YouTube's Shorts
// search instead. Nothing is stored: the link is built from what the exercise already has.

import type { Equipment } from './catalog';

const SEARCH_URL = 'https://www.youtube.com/results';

/**
 * YouTube's `Type → Shorts` search filter, copied from the address bar after applying it by hand.
 * An undocumented token, so it lives in this one constant: if YouTube changes it, the search opens
 * unfiltered — the link keeps working, it just stops narrowing to Shorts.
 *
 * Already URL-encoded (`%253D` is a twice-encoded `=`, exactly as YouTube writes it), so it is
 * appended as is, never run through the query encoder.
 */
const SHORTS_FILTER = 'EgIQCQ%253D%253D';

const QUERY_SUFFIX = 'form';

/**
 * The word an equipment adds to the search — `barbell`, so `Bench Press` doesn't land on the
 * dumbbell one. Bodyweight adds nothing (`Push Up form`, not `Push Up bodyweight form`) and
 * `other` has no word to give.
 */
const EQUIPMENT_QUERY_WORD: Record<Equipment, string | undefined> = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  machine: 'machine',
  cable: 'cable',
  bodyweight: undefined,
  'bodyweight-weighted': 'weighted',
  other: undefined,
};

/** The Shorts search for how to perform an exercise, from its name and (optional) equipment. */
export function buildHowToUrl(name: string, equipment?: Equipment): string {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const equipmentWord = equipment === undefined ? undefined : EQUIPMENT_QUERY_WORD[equipment];
  // `Cable Fly` is already a cable exercise: saying it twice only skews the search.
  const addEquipment = equipmentWord !== undefined && !containsWord(cleanName, equipmentWord);
  const query = [cleanName, addEquipment ? equipmentWord : undefined, QUERY_SUFFIX]
    .filter((part) => part !== undefined && part !== '')
    .join(' ');

  // Only the query is encoded — the filter already is. Spaces are `+`, the way a search form
  // writes them, and encodeURIComponent turns `&`, `/`, `+` and non-Latin letters into escapes.
  const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
  return `${SEARCH_URL}?search_query=${encodedQuery}&sp=${SHORTS_FILTER}`;
}

function containsWord(text: string, word: string): boolean {
  return text.toLowerCase().split(' ').includes(word);
}
