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
    defaultLengthWeeks: 5,
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
});
