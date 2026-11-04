import {
  isCarriedCommand,
  lastWorkingWeekOf,
  shouldShowEditCoachmark,
} from '@components/EditCoachmarkLogic';
import type { OnboardingFlags } from '@repositories/settings';
import type { ExerciseCommand } from '@state/useExerciseCommand';
import { DEFAULT_ONBOARDING } from '@storage/settingsDefaults';

const READY: OnboardingFlags = { ...DEFAULT_ONBOARDING, welcomeSeen: true };
const LIVE = { mode: 'live' as const, isDeload: false, weekNumber: 2 };

describe('isCarriedCommand', () => {
  test.each<[ExerciseCommand, boolean]>([
    ['addSet', true],
    ['removeLastSet', true],
    ['addRound', true],
    ['removeLastRound', true],
    ['moveUp', true],
    ['moveDown', true],
    ['skip', false],
    ['unskip', false],
    // Delete has no card left to ring: its confirmation says it instead.
    ['delete', false],
  ])('%s → %s', (command, carried) => {
    expect(isCarriedCommand(command)).toBe(carried);
  });
});

describe('shouldShowEditCoachmark', () => {
  test('GT-224: a live working week with another after it, after the Welcome dialog', () => {
    expect(shouldShowEditCoachmark(READY, LIVE, 4)).toBe(true);
  });

  test('once seen, never again', () => {
    expect(shouldShowEditCoachmark({ ...READY, editCoachmarkSeen: true }, LIVE, 4)).toBe(false);
  });

  test('not before the Welcome dialog, nor before the flags are read', () => {
    expect(shouldShowEditCoachmark(DEFAULT_ONBOARDING, LIVE, 4)).toBe(false);
    expect(shouldShowEditCoachmark(undefined, LIVE, 4)).toBe(false);
  });

  test('not on a deload, nor read-only, history or a preview', () => {
    expect(shouldShowEditCoachmark(READY, { ...LIVE, isDeload: true }, 4)).toBe(false);
    for (const mode of ['readonly', 'history', 'preview'] as const) {
      expect(shouldShowEditCoachmark(READY, { ...LIVE, mode }, 4)).toBe(false);
    }
  });

  test('not on the last working week: only the deload comes after it (Artem, 04.11.2026)', () => {
    expect(shouldShowEditCoachmark(READY, { ...LIVE, weekNumber: 4 }, 4)).toBe(false);
    expect(shouldShowEditCoachmark(READY, { ...LIVE, weekNumber: 3 }, 4)).toBe(true);
  });

  test('not while the block is still being read', () => {
    expect(shouldShowEditCoachmark(READY, LIVE, undefined)).toBe(false);
  });
});

describe('lastWorkingWeekOf', () => {
  test('the week before the deload, or the last week of a block without one', () => {
    const weeks = (deload: boolean) =>
      [1, 2, 3, 4, 5].map((weekNumber) => ({ weekNumber, isDeload: deload && weekNumber === 5 }));
    expect(lastWorkingWeekOf(weeks(true))).toBe(4);
    expect(lastWorkingWeekOf(weeks(false))).toBe(5);
  });
});
