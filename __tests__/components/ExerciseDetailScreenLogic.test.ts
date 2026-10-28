import type { IntervalLever, PowerLoad } from '@domain/exerciseConfig';
import type { RoundLog, SetLog } from '@domain/execution';
import {
  exerciseLogRows,
  exerciseSettings,
  formatRoundTail,
  powerLoadOf,
  formatBestSet,
  formatLastDone,
  formatSetLabel,
  formatSetRirTail,
  formatSetValue,
} from '@components/ExerciseDetailScreenLogic';
import { STAMPS } from '../fixtures/stamps';

function setLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
    ...STAMPS,
    id: 'log-1',
    sessionExerciseId: 'se-1',
    exerciseId: 'bench-press',
    setNumber: 1,
    weight: 85,
    reps: 8,
    completedAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

describe('formatBestSet', () => {
  test('is weight by reps, with no unit', () => {
    expect(formatBestSet({ weight: 85, reps: 8 })).toBe('85×8');
  });
});

describe('formatLastDone', () => {
  test('counts days up to a week', () => {
    expect(formatLastDone('2026-09-17T12:00:00.000Z', new Date('2026-09-20T12:00:00.000Z'))).toBe(
      '3 d',
    );
  });

  test('switches to weeks past one', () => {
    expect(formatLastDone('2026-09-01T12:00:00.000Z', new Date('2026-09-20T12:00:00.000Z'))).toBe(
      '2 w',
    );
  });
});

describe('a logged set row', () => {
  test('labels the set by its number', () => {
    expect(formatSetLabel(setLog({ setNumber: 2 }))).toBe('Set 2');
  });

  test('reads weight by reps, with the RIR kept out of the value', () => {
    const log = setLog({ weight: 80, reps: 9, rir: 2 });

    expect(formatSetValue(log)).toBe('80 kg × 9');
    expect(formatSetRirTail(log)).toBe(' · 2 RIR');
  });

  test('has no tail at all when the set has no RIR', () => {
    expect(formatSetRirTail(setLog())).toBeUndefined();
  });

  test('keeps a weighted bodyweight set’s body weight and added weight apart', () => {
    expect(formatSetValue(setLog({ weight: 5, bodyWeight: 83 }), 'bodyweight-weighted')).toBe(
      '83 (+5) kg × 8',
    );
  });

  test('reads a power set in its own load, with no RIR', () => {
    const log = setLog({ weight: 2, reps: 3, rir: 2 });

    expect(formatSetValue(log, undefined, 'level')).toBe('Level 2 × 3');
    expect(formatSetValue(log, undefined, 'weight')).toBe('2 kg × 3');
    expect(formatSetRirTail(log, 'level')).toBeUndefined();
  });
});

describe('powerLoadOf', () => {
  test('is the load of a power exercise, its default when it has no config', () => {
    expect(
      powerLoadOf({
        type: 'power',
        config: { type: 'power', load: 'level', noHeavierAvailable: false },
      }),
    ).toBe('level');
    expect(powerLoadOf({ type: 'power' })).toBe('weight');
  });

  test('is absent for every other type', () => {
    expect(powerLoadOf({})).toBeUndefined();
    expect(powerLoadOf({ type: 'interval' })).toBeUndefined();
  });
});

function roundLog(overrides: Partial<RoundLog> = {}): RoundLog {
  return {
    ...STAMPS,
    id: 'round-1',
    sessionExerciseId: 'se-1',
    exerciseId: 'heavy-bag',
    roundNumber: 1,
    workSec: 120,
    restSec: 60,
    restSkipped: false,
    completed: true,
    completedAt: '2026-08-10T12:00:00.000Z',
    ...overrides,
  };
}

describe('a logged round row', () => {
  test('reads its work, then its rest a step quieter', () => {
    expect(exerciseLogRows({ setLogs: [], roundLogs: [roundLog()] })).toEqual([
      { key: 'round-1', label: 'Round 1', value: '2:00', tail: ' · rest 1:00' },
    ]);
  });

  test('says the rest was skipped, or that the round ended early', () => {
    expect(formatRoundTail(roundLog({ restSkipped: true }))).toBe(' · rest skipped');
    expect(formatRoundTail(roundLog({ completed: false, restSkipped: true }))).toBe(
      ' · ended early',
    );
  });

  test('has no tail where there was no rest to take', () => {
    expect(formatRoundTail(roundLog({ restSec: undefined }))).toBeUndefined();
  });

  test('lists sets before rounds, each with its own row', () => {
    const rows = exerciseLogRows({ setLogs: [setLog()], roundLogs: [roundLog()] });

    expect(rows.map((row) => row.label)).toEqual(['Set 1', 'Round 1']);
  });
});

describe('exerciseSettings — power', () => {
  const power = (load: PowerLoad, noHeavierAvailable = false) =>
    exerciseSettings({ type: 'power', config: { type: 'power', load, noHeavierAvailable } }).rows;

  test.each([
    ['weight', 'Kg'],
    ['level', 'Level'],
    ['none', 'None'],
  ] as const)('a power load of %s reads %s, as in the New exercise sheet', (load, value) => {
    expect(power(load)).toEqual([{ key: 'load', label: 'Load', value }]);
  });

  test('No heavier available shows only while it is on', () => {
    expect(power('weight', true)).toEqual([
      { key: 'load', label: 'Load', value: 'Kg' },
      { key: 'noHeavier', label: 'No heavier available', value: 'On' },
    ]);
  });

  test('on a level load the flag reads as the workout note words it', () => {
    expect(power('level', true)[1]).toEqual({
      key: 'noHeavier',
      label: 'No higher level available',
      value: 'On',
    });
  });

  test('a power exercise stored without a config reads as the default load', () => {
    expect(exerciseSettings({ type: 'power' })).toEqual({
      rows: [{ key: 'load', label: 'Load', value: 'Kg' }],
    });
  });

  test('strength has nothing to set', () => {
    expect(exerciseSettings({})).toEqual({ rows: [] });
    expect(exerciseSettings({ type: 'strength' })).toEqual({ rows: [] });
  });
});

describe('exerciseSettings — timed work', () => {
  const interval = (lever: IntervalLever, stepSec: 5 | 10 | 15 = 5) =>
    exerciseSettings({ type: 'interval', config: { type: 'interval', lever, stepSec } });

  test('Less rest: the lever, its step, and what next week brings', () => {
    expect(interval('rest', 10)).toEqual({
      rows: [
        { key: 'lever', label: 'Progress by', value: 'Less rest' },
        { key: 'step', label: 'Step', value: '10 s' },
      ],
      note: "Finish every round and next week's rest is 10 s shorter.",
    });
  });

  test('More work: the lever, its step, and what next week brings', () => {
    expect(interval('workTime', 15)).toEqual({
      rows: [
        { key: 'lever', label: 'Progress by', value: 'More work' },
        { key: 'step', label: 'Step', value: '15 s' },
      ],
      note: "Finish every round and next week's work is 15 s longer.",
    });
  });

  test('More rounds has no step — it always adds one round', () => {
    expect(interval('rounds')).toEqual({
      rows: [{ key: 'lever', label: 'Progress by', value: 'More rounds' }],
      note: 'Finish every round and next week has one more round.',
    });
  });

  test('None keeps the plan: no step and no line under the card', () => {
    expect(interval('none')).toEqual({
      rows: [{ key: 'lever', label: 'Progress by', value: 'None' }],
    });
  });
});
