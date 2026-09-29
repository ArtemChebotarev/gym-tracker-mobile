import {
  isStopMesocycleConfirmed,
  STOP_MESOCYCLE_PHRASE,
  STOP_MESOCYCLE_WARNING,
} from '@components/StopMesocycleSheetLogic';

describe('isStopMesocycleConfirmed', () => {
  test('the phrase is `END CYCLE`, typed out', () => {
    expect(STOP_MESOCYCLE_PHRASE).toBe('END CYCLE');
    expect(isStopMesocycleConfirmed(STOP_MESOCYCLE_PHRASE)).toBe(true);
  });

  test('case and surrounding spaces are forgiven', () => {
    expect(isStopMesocycleConfirmed('end cycle')).toBe(true);
    expect(isStopMesocycleConfirmed('  End Cycle  ')).toBe(true);
  });

  test.each(['', 'END', 'END CYC', 'ENDCYCLE', 'end  cycle', 'end cycle now'])(
    '%p is not the phrase',
    (text) => {
      expect(isStopMesocycleConfirmed(text)).toBe(false);
    },
  );
});

describe('STOP_MESOCYCLE_WARNING', () => {
  test('says what goes and that what was logged stays', () => {
    expect(STOP_MESOCYCLE_WARNING).toMatch(/skipped/);
    expect(STOP_MESOCYCLE_WARNING).toMatch(/logged stays/);
  });
});
