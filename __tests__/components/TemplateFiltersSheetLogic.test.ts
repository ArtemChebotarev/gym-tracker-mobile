import {
  dayCountRows,
  FOCUS_TAGS,
  isHybridOnly,
  setHybridOnly,
  templateApplyLabel,
  templateFilterChips,
  toggleDayCount,
  toggleTag,
} from '@components/TemplateFiltersSheetLogic';

describe('TemplateFiltersSheetLogic (GT-217)', () => {
  test('Focus offers Full body, Upper body and Lower body, in that order', () => {
    expect(FOCUS_TAGS).toEqual(['full-body', 'upper', 'lower']);
  });

  test('toggling adds a value, and taking the last one away clears the field', () => {
    const on = toggleDayCount({}, 4);
    expect(on).toEqual({ dayCounts: [4] });
    expect(toggleDayCount(on, 4)).toEqual({ dayCounts: undefined });
    expect(toggleTag({ tags: ['upper'] }, 'lower')).toEqual({ tags: ['upper', 'lower'] });
    expect(toggleTag({ tags: ['upper'] }, 'upper')).toEqual({ tags: undefined });
  });

  test('the Hybrid switch adds and removes only the hybrid tag', () => {
    const on = setHybridOnly({ tags: ['lower'] }, true);
    expect(on).toEqual({ tags: ['lower', 'hybrid'] });
    expect(isHybridOnly(on)).toBe(true);
    expect(setHybridOnly(on, false)).toEqual({ tags: ['lower'] });
    expect(setHybridOnly({ tags: ['hybrid'] }, false)).toEqual({ tags: undefined });
    expect(isHybridOnly({})).toBe(false);
  });

  test('the confirm button counts templates, and says No matches at zero', () => {
    expect(templateApplyLabel(0)).toBe('No matches');
    expect(templateApplyLabel(1)).toBe('Show 1 template');
    expect(templateApplyLabel(3)).toBe('Show 3 templates');
  });

  test('the row chips: days fewest first, then tags in the sheet order', () => {
    expect(
      templateFilterChips({ dayCounts: [5, 2], tags: ['hybrid', 'upper'] }).map(
        (chip) => chip.label,
      ),
    ).toEqual(['2 days', '5 days', 'Upper body', 'Hybrid']);
    expect(templateFilterChips({})).toEqual([]);
  });

  test('day options go four to a row', () => {
    expect(dayCountRows([2, 3, 4, 5, 6])).toEqual([[2, 3, 4, 5], [6]]);
    expect(dayCountRows([])).toEqual([]);
  });
});
