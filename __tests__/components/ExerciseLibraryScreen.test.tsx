import { fireEvent, render, screen } from '@testing-library/react-native';

import { toExerciseId, type Exercise } from '@domain/catalog';
import type { ExerciseListEntry, ExerciseListGroup } from '@domain/catalogListing';
import type { SetLog } from '@domain/execution';
import { ExerciseLibraryScreen, type ExerciseLibraryScreenProps } from '@components/ExerciseLibraryScreen';

function exercise(overrides: Partial<Exercise> & Pick<Exercise, 'id' | 'name' | 'muscleGroup'>): Exercise {
  return { source: 'catalog', isHidden: false, ...overrides };
}

function setLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
    id: 'set-1',
    sessionExerciseId: 'session-exercise-1',
    exerciseId: 'bench-press',
    setNumber: 1,
    weight: 85,
    reps: 8,
    completedAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

function entry(exerciseValue: Exercise, lastSetLog: SetLog | null = null): ExerciseListEntry {
  return { exercise: exerciseValue, lastSetLog };
}

const BASE_PROPS: ExerciseLibraryScreenProps = {
  groups: [],
  isPending: false,
  search: '',
  onSearchChange: jest.fn(),
  filters: {},
  onResetFilters: jest.fn(),
  onRequestCreate: jest.fn(),
  onRequestFilters: jest.fn(),
};

function renderScreen(overrides: Partial<ExerciseLibraryScreenProps> = {}) {
  const props: ExerciseLibraryScreenProps = { ...BASE_PROPS, ...overrides };
  render(<ExerciseLibraryScreen {...props} />);
  return props;
}

describe('ExerciseLibraryScreen', () => {
  test('renders the header title and an accessible add button', () => {
    const onRequestCreate = jest.fn();
    renderScreen({ onRequestCreate });

    expect(screen.getByText('Exercises')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Add exercise' }));
    expect(onRequestCreate).toHaveBeenCalledWith();
  });

  test('typing in the search field calls onSearchChange', () => {
    const onSearchChange = jest.fn();
    renderScreen({ onSearchChange });

    fireEvent.changeText(screen.getByLabelText('Search'), 'bench');

    expect(onSearchChange).toHaveBeenCalledWith('bench');
  });

  test('pressing the Filters chip calls onRequestFilters', () => {
    const onRequestFilters = jest.fn();
    renderScreen({ onRequestFilters });

    fireEvent.press(screen.getByRole('button', { name: 'Filters' }));

    expect(onRequestFilters).toHaveBeenCalledTimes(1);
  });

  test('search-empty state shows the query and a Create action that opens the sheet prefilled', () => {
    const onRequestCreate = jest.fn();
    renderScreen({ groups: [], search: 'Zercher Squat', onRequestCreate });

    expect(screen.getByText('No exercises match "Zercher Squat"')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Create "Zercher Squat"' }));

    expect(onRequestCreate).toHaveBeenCalledWith('Zercher Squat');
  });

  test('filter-empty state shows a Reset filters action that clears the filters', () => {
    const onResetFilters = jest.fn();
    renderScreen({
      groups: [],
      search: '',
      filters: { muscleGroups: ['chest'] },
      onResetFilters,
    });

    expect(screen.getByText('No exercises match your filters')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Reset filters' }));

    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });

  test('a non-empty search takes priority over an active filter for the empty state shown', () => {
    renderScreen({
      groups: [],
      search: 'Zercher Squat',
      filters: { muscleGroups: ['chest'] },
    });

    expect(screen.getByText('No exercises match "Zercher Squat"')).toBeTruthy();
    expect(screen.queryByText('No exercises match your filters')).toBeNull();
  });

  test('renders groups and their exercises in the given order, with headers and subtitles', () => {
    const groups: ExerciseListGroup[] = [
      {
        muscleGroup: 'back',
        entries: [
          entry(
            exercise({ id: toExerciseId('lat-pulldown'), name: 'Lat Pulldown', muscleGroup: 'back' }),
            setLog({ weight: 60, reps: 10, completedAt: '2026-09-09T12:00:00.000Z' }),
          ),
        ],
      },
      {
        muscleGroup: 'chest',
        entries: [
          entry(
            exercise({ id: toExerciseId('bench-press'), name: 'Bench Press', muscleGroup: 'chest' }),
            setLog({ weight: 85, reps: 8, completedAt: '2026-09-10T12:00:00.000Z' }),
          ),
          entry(
            exercise({
              id: toExerciseId('my-fly'),
              name: 'My Custom Fly',
              muscleGroup: 'chest',
              source: 'custom',
            }),
          ),
        ],
      },
    ];

    renderScreen({ groups });

    const headings = screen.getAllByText(/Back|Chest/);
    expect(headings.map((node) => node.props.children)).toEqual(['Back', 'Chest']);

    expect(screen.getByText('Lat Pulldown')).toBeTruthy();
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText(/85 kg × 8/)).toBeTruthy();

    const customRow = screen.getByText('My Custom Fly');
    expect(customRow).toBeTruthy();
    expect(screen.getByText('Custom')).toBeTruthy();
    expect(screen.getByText('Never performed')).toBeTruthy();
  });

  test('renders a chip for each active filter plus the result counter', () => {
    const groups: ExerciseListGroup[] = [
      {
        muscleGroup: 'triceps',
        entries: [
          entry(
            exercise({ id: toExerciseId('triceps-pushdown'), name: 'Triceps Pushdown', muscleGroup: 'triceps' }),
          ),
        ],
      },
    ];

    renderScreen({
      groups,
      filters: { muscleGroups: ['chest'], sources: ['custom'], performedOnly: true },
    });

    expect(screen.getByText('Chest')).toBeTruthy();
    expect(screen.getByText('Custom')).toBeTruthy();
    expect(screen.getByText('Performed only')).toBeTruthy();
    expect(screen.getByText('Exercises 1')).toBeTruthy();
  });
});
