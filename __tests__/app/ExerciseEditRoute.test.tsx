// The Edit exercise page: filled with the exercise it opens, the same fields as New exercise, what
// is stored on Save, and what a failed save does (10.1 FR-11; 08.0.2 · Error handling).

import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import EditExerciseRoute from '@app/exercise/[id]/edit';
import { createCustomExercise } from '@usecases/exerciseLibrary';

import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

const mockBack = jest.fn();
let mockParams: { id?: string } = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

const repositories = withRepositories();

beforeEach(() => {
  mockBack.mockClear();
  mockParams = {};
});

function renderRoute() {
  return renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <EditExerciseRoute />
    </SafeAreaProvider>,
  );
}

function saveButton() {
  return screen.getByRole('button', { name: 'Save' });
}

describe('Edit exercise page', () => {
  test('opens filled with the exercise, titled Edit exercise, with its type in the header', async () => {
    const custom = await createCustomExercise(
      { name: 'Garage Press', muscleGroup: 'chest', equipment: 'dumbbell' },
      repositories(),
    );
    mockParams = { id: custom.id };
    renderRoute();

    expect(await screen.findByText('Edit exercise')).toBeTruthy();
    expect(screen.getByText('Strength')).toBeTruthy();
    expect(screen.getByLabelText('Name').props.value).toBe('Garage Press');
    expect(screen.getByRole('button', { name: 'Muscle group' })).toHaveTextContent(/Chest/);
    expect(screen.getByRole('button', { name: 'Equipment' })).toHaveTextContent(/Dumbbell/);
    expect(screen.queryByText(/^Step /)).toBeNull();
  });

  test('a rename is stored, and the page closes', async () => {
    const custom = await createCustomExercise(
      { name: 'Garage Press', muscleGroup: 'chest' },
      repositories(),
    );
    mockParams = { id: custom.id };
    renderRoute();
    await screen.findByText('Edit exercise');

    fireEvent.changeText(screen.getByLabelText('Name'), '  Garage Bench  ');
    fireEvent.press(saveButton());

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    await expect(repositories().exerciseRepo.getById(custom.id)).resolves.toMatchObject({
      name: 'Garage Bench',
      muscleGroup: 'chest',
    });
  });

  test('an empty name cannot be saved', async () => {
    const custom = await createCustomExercise(
      { name: 'Garage Press', muscleGroup: 'chest' },
      repositories(),
    );
    mockParams = { id: custom.id };
    renderRoute();
    await screen.findByText('Edit exercise');

    fireEvent.changeText(screen.getByLabelText('Name'), '   ');

    expect(saveButton().props.accessibilityState.disabled).toBe(true);
  });

  test('a power exercise picks its load, and the pick is stored', async () => {
    const custom = await createCustomExercise(
      { name: 'Box jump', muscleGroup: 'fullBody', type: 'power' },
      repositories(),
    );
    mockParams = { id: custom.id };
    renderRoute();
    await screen.findByText('Edit exercise');

    expect(screen.getByRole('button', { name: 'Kg' }).props.accessibilityState.selected).toBe(true);
    fireEvent.press(screen.getByRole('button', { name: 'Level' }));
    expect(screen.getByRole('button', { name: 'Level' }).props.accessibilityState.selected).toBe(
      true,
    );
    expect(screen.getByText(/log a level/)).toBeTruthy();
    fireEvent.press(saveButton());

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    await expect(repositories().exerciseRepo.getById(custom.id)).resolves.toMatchObject({
      type: 'power',
      config: { type: 'power', load: 'level' },
    });
  });

  test('a timed-work exercise edits its lever on a second step, as New exercise does', async () => {
    const custom = await createCustomExercise(
      { name: 'Heavy bag', muscleGroup: 'fullBody', type: 'interval' },
      repositories(),
    );
    mockParams = { id: custom.id };
    renderRoute();
    await screen.findByText('Edit exercise');

    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Step 2 of 2')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Less rest' }).props.accessibilityState.checked).toBe(
      true,
    );
    fireEvent.press(screen.getByRole('radio', { name: 'More work' }));
    fireEvent.press(saveButton());

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    await expect(repositories().exerciseRepo.getById(custom.id)).resolves.toMatchObject({
      type: 'interval',
      config: { type: 'interval', lever: 'workTime' },
    });
  });

  test('a catalog exercise opens nothing', async () => {
    mockParams = { id: 'bench-press-barbell' };
    const read = jest.spyOn(repositories().exerciseRepo, 'getById');
    renderRoute();

    // Once the exercise has been read there is still no form for it.
    await waitFor(() => expect(read).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Edit exercise')).toBeNull());
    expect(screen.queryByLabelText('Name')).toBeNull();
    read.mockRestore();
  });

  test('a failed save says so and keeps the page open with what was typed', async () => {
    const custom = await createCustomExercise(
      { name: 'Garage Press', muscleGroup: 'chest' },
      repositories(),
    );
    mockParams = { id: custom.id };
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const update = jest
      .spyOn(repositories().exerciseRepo, 'updateCustom')
      .mockRejectedValueOnce(new Error('storage down'));
    renderRoute();
    await screen.findByText('Edit exercise');

    fireEvent.changeText(screen.getByLabelText('Name'), 'Garage Bench');
    fireEvent.press(saveButton());

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith("Couldn't save the exercise", 'Try again.'),
    );
    expect(screen.getByDisplayValue('Garage Bench')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();

    update.mockRestore();
    alert.mockRestore();
  });
});
