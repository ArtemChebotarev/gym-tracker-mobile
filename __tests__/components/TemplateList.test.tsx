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
  test("shows each visible template's name with its day count", () => {
    renderList();

    expect(screen.getByText('Full Body')).toBeTruthy();
    expect(screen.getByText(' · 3 days')).toBeTruthy();
    expect(screen.getByText('Upper / Lower')).toBeTruthy();
    expect(screen.getByText(' · 4 days')).toBeTruthy();
  });

  test('does not show hidden templates', () => {
    renderList();

    expect(screen.queryByText('Retired Split')).toBeNull();
  });

  test('a hidden template stays hidden when the search names it', () => {
    renderList({ search: 'Retired' });

    expect(screen.queryByText('Retired Split')).toBeNull();
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
