import { fireEvent, render, screen } from '@testing-library/react-native';

import { TemplateList, type TemplateListProps } from '@components/TemplateList';
import type { MesoTemplate } from '@domain/plan';
import { STAMPS } from '../fixtures/stamps';

function template(
  id: string,
  name: string,
  dayCount: number,
  overrides: Partial<MesoTemplate> = {},
): MesoTemplate {
  return {
    ...STAMPS,
    id,
    name,
    source: 'catalog',
    isHidden: false,
    weekPlan: {
      days: Array.from({ length: dayCount }, (_, index) => ({
        dayNumber: index + 1,
        name: '',
        exercises: [],
      })),
    },
    ...overrides,
  };
}

const fullBody = template('full-body', 'Full Body', 3);
const upperLower = template('upper-lower', 'Upper / Lower', 4);
const retired = template('retired', 'Retired Split', 2, { isHidden: true });
const mine = template('mine', 'My Split', 5, { source: 'custom' });

function renderList(overrides: Partial<TemplateListProps> = {}) {
  const props: TemplateListProps = {
    templates: [upperLower, fullBody, retired, mine],
    search: '',
    onSearchChange: jest.fn(),
    filters: {},
    onRequestFilters: jest.fn(),
    onResetFilters: jest.fn(),
    onSelectTemplate: jest.fn(),
    ...overrides,
  };
  render(<TemplateList {...props} />);
  return props;
}

describe('TemplateList', () => {
  test('groups the visible templates by days a week, fewest first, each section with its count', () => {
    renderList({
      templates: [upperLower, fullBody, retired, mine, template('ppl', 'Arnold Split', 5)],
    });

    const headers = screen.getAllByText(/days a week$/).map((node) => node.props.children);
    expect(headers).toEqual(['3 days a week', '4 days a week', '5 days a week']);
    // Two 5-day templates, so that section counts 2; the rows carry the bare name.
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Full Body')).toBeTruthy();
    expect(screen.queryByText(/· \d+ days/)).toBeNull();
  });

  test('a section with no visible template is not drawn', () => {
    renderList();

    expect(screen.queryByText('2 days a week')).toBeNull();
  });

  test('gives every row a subtitle, so no row is a single line', () => {
    renderList();

    expect(screen.getAllByText(/sets a week$/)).toHaveLength(3);
  });

  test('does not show hidden templates', () => {
    renderList();

    expect(screen.queryByText(/Retired Split/)).toBeNull();
  });

  test('a hidden template stays hidden when the search names it', () => {
    renderList({ search: 'Retired' });

    expect(screen.queryByText(/Retired Split/)).toBeNull();
  });

  test('badges a custom template and leaves catalog ones plain', () => {
    renderList();

    expect(screen.getAllByText('Custom')).toHaveLength(1);
  });

  test('reports what is typed into the search field', () => {
    const props = renderList();

    fireEvent.changeText(screen.getByLabelText('Search'), 'upper');

    expect(props.onSearchChange).toHaveBeenCalledWith('upper');
  });

  test('filters the rows by the search text, case-insensitive', () => {
    renderList({ search: 'LOWER' });

    expect(screen.getByText('Upper / Lower')).toBeTruthy();
    expect(screen.queryByText('Full Body')).toBeNull();
    expect(screen.queryByText('3 days a week')).toBeNull();
  });

  test('hands the tapped template to the caller and decides nothing itself', () => {
    const props = renderList();

    fireEvent.press(screen.getByText('Full Body'));

    expect(props.onSelectTemplate).toHaveBeenCalledTimes(1);
    expect(props.onSelectTemplate).toHaveBeenCalledWith(fullBody);
  });

  test('a search with no matches shows the empty state, and its action clears the search', () => {
    const props = renderList({ search: '  push  ' });

    expect(screen.getByText('No templates match "push"')).toBeTruthy();
    fireEvent.press(screen.getByText('Clear search'));

    expect(props.onSearchChange).toHaveBeenCalledWith('');
  });

  describe('tags and filters (GT-217)', () => {
    const hybrid = template('hybrid', 'Boxing Hybrid', 4, { tags: ['full-body', 'hybrid'] });
    const lowerFocus = template('lower', 'Lower Focus', 2, { tags: ['full-body', 'lower'] });

    test("each row shows its template's tags under the description", () => {
      renderList({ templates: [hybrid] });

      expect(screen.getByText('Full body')).toBeTruthy();
      expect(screen.getByText('Hybrid')).toBeTruthy();
    });

    test('with no filter on, the Filters chip alone; it asks for the sheet', () => {
      const props = renderList();

      expect(screen.queryByText('Reset')).toBeNull();
      fireEvent.press(screen.getByText('Filters'));
      expect(props.onRequestFilters).toHaveBeenCalledTimes(1);
    });

    test('applied filters narrow the list, show as chips with what is left, and reset', () => {
      const props = renderList({
        templates: [hybrid, lowerFocus, fullBody],
        filters: { tags: ['hybrid'] },
      });

      expect(screen.getByText('Boxing Hybrid')).toBeTruthy();
      expect(screen.queryByText('Lower Focus')).toBeNull();
      expect(screen.queryByText('Full Body')).toBeNull();
      expect(screen.getByText('Filters (1)')).toBeTruthy();
      fireEvent.press(screen.getByText('Reset'));
      expect(props.onResetFilters).toHaveBeenCalledTimes(1);
    });

    test('filters that leave nothing say so and offer to reset them', () => {
      const props = renderList({
        templates: [hybrid, lowerFocus],
        filters: { dayCounts: [2], tags: ['hybrid'] },
      });

      expect(screen.getByText('No templates match your filters')).toBeTruthy();
      fireEvent.press(screen.getByRole('button', { name: 'Reset filters' }));
      expect(props.onResetFilters).toHaveBeenCalledTimes(1);
    });

    test('a search that finds nothing under filters is the search empty state', () => {
      renderList({ templates: [hybrid], search: 'zzz', filters: { tags: ['hybrid'] } });

      expect(screen.getByText('No templates match "zzz"')).toBeTruthy();
      expect(screen.queryByText('No templates match your filters')).toBeNull();
    });
  });
});
