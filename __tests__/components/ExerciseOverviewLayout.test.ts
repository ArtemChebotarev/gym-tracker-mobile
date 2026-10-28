import { EXERCISE_TYPES } from '@domain/catalog';
import type { ExerciseOverviewStats } from '@domain/exerciseOverview';
import { overviewSections } from '@components/ExerciseOverviewLayout';

const STATS: ExerciseOverviewStats = {
  bestSet: { weight: 90, reps: 6 },
  sessionCount: 4,
  lastDoneAt: '2026-09-17T11:30:00.000Z',
};

describe('overviewSections', () => {
  test('strength: Best set, Sessions and Last done, then How to perform — nothing else', () => {
    expect(overviewSections({ type: 'strength' }, STATS)).toEqual([
      { kind: 'tiles', tiles: ['bestSet', 'sessions', 'lastDone'] },
      { kind: 'howTo' },
    ]);
  });

  test('power: the strength tiles, How to perform, then its Settings (canvas 4.6)', () => {
    expect(overviewSections({ type: 'power' }, STATS)).toEqual([
      { kind: 'tiles', tiles: ['bestSet', 'sessions', 'lastDone'] },
      { kind: 'howTo' },
      { kind: 'settings' },
    ]);
  });

  test('power with nothing logged still has its Settings — they exist from creation', () => {
    expect(overviewSections({ type: 'power' }, null)).toEqual([
      { kind: 'empty' },
      { kind: 'howTo' },
      { kind: 'settings' },
    ]);
  });

  test('an exercise stored without a type is laid out as strength', () => {
    expect(overviewSections({}, STATS)).toEqual(overviewSections({ type: 'strength' }, STATS));
  });

  test('power has a best set; the types of rounds do not', () => {
    const tilesOf = (type: 'power' | 'interval' | 'mobility') =>
      overviewSections({ type }, STATS).find((section) => section.kind === 'tiles');

    expect(tilesOf('power')).toEqual({
      kind: 'tiles',
      tiles: ['bestSet', 'sessions', 'lastDone'],
    });
    expect(tilesOf('interval')).toEqual({ kind: 'tiles', tiles: ['sessions', 'lastDone'] });
    expect(tilesOf('mobility')).toEqual({ kind: 'tiles', tiles: ['sessions', 'lastDone'] });
  });

  test.each(EXERCISE_TYPES)(
    "%s with nothing logged: the empty state takes the tiles' place, How to perform stays",
    (type) => {
      const sections = overviewSections({ type }, null);

      expect(sections[0]).toEqual({ kind: 'empty' });
      expect(sections).toContainEqual({ kind: 'howTo' });
      expect(sections.some((section) => section.kind === 'tiles')).toBe(false);
    },
  );

  test.each(EXERCISE_TYPES)('%s opens with the tiles and then How to perform', (type) => {
    const [first, second] = overviewSections({ type }, STATS);

    expect(first?.kind).toBe('tiles');
    expect(second).toEqual({ kind: 'howTo' });
  });
});
