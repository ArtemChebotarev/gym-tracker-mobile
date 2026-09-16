import { formatReviewSummary, formatSetCount } from '@components/MesoEditorReviewStepLogic';

describe('formatSetCount', () => {
  test('pluralizes sets', () => {
    expect(formatSetCount(1)).toBe('1 set');
    expect(formatSetCount(3)).toBe('3 sets');
  });
});

describe('formatReviewSummary', () => {
  test('combines length and days per week', () => {
    expect(formatReviewSummary(6, 4)).toBe('6 weeks · 4 days per week');
    expect(formatReviewSummary(3, 1)).toBe('3 weeks · 1 day per week');
  });
});
