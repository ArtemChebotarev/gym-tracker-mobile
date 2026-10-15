// The New exercise page: the fields of the type that was chosen on the type sheet, what is stored
// on Create, and what a failed save does (task 141.2; 08.0.2 · Error handling).

import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import NewExerciseRoute from '@app/exercise/new';

import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

const mockBack = jest.fn();
let mockParams: { type?: string; name?: string } = {};
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
      <NewExerciseRoute />
    </SafeAreaProvider>,
  );
}

function createButton() {
  return screen.getByRole('button', { name: 'Create exercise' });
}

async function lastCreated() {
  const all = await repositories().exerciseRepo.getAll();
  return all.find((exercise) => exercise.source === 'custom');
}

describe('New exercise page', () => {
  test('strength: needs a name and a muscle group, then stores a plain strength exercise', async () => {
    mockParams = { type: 'strength' };
    renderRoute();

    expect(createButton().props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(screen.getByLabelText('Name'), '  Zercher Squat  ');
    expect(createButton().props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByRole('button', { name: 'Muscle group' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Quads' }));
    fireEvent.press(createButton());

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    const created = await lastCreated();
    expect(created).toMatchObject({ name: 'Zercher Squat', muscleGroup: 'quads' });
    expect(created?.type).toBeUndefined();
    expect(created?.config).toBeUndefined();
  });

  test('a name from the library search is the starting name', () => {
    mockParams = { type: 'strength', name: 'Zercher Squat' };
    renderRoute();

    expect(screen.getByLabelText('Name').props.value).toBe('Zercher Squat');
  });

  test('an unknown type in the link opens as strength', () => {
    mockParams = { type: 'nonsense' };
    renderRoute();

    expect(screen.getByText('Strength')).toBeTruthy();
  });

  test('the chosen type stays visible in the header', () => {
    mockParams = { type: 'power' };
    renderRoute();

    expect(screen.getByText('Power')).toBeTruthy();
  });

  test('a non-strength exercise starts on Full body, the label that value has everywhere', () => {
    mockParams = { type: 'power' };
    renderRoute();

    expect(screen.getByRole('button', { name: 'Muscle group' })).toHaveTextContent(/Full body/);
  });

  test('power: only a name is needed; stored as fullBody with its defaults, rest steppable', async () => {
    mockParams = { type: 'power' };
    renderRoute();

    expect(screen.getByText('1:00')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Increase Rest between sets' }));
    expect(screen.getByText('1:05')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Name'), 'Medball slam');
    fireEvent.press(createButton());

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(await lastCreated()).toMatchObject({
      name: 'Medball slam',
      muscleGroup: 'fullBody',
      type: 'power',
      config: { type: 'power', load: 'weight', restSec: 65, noHeavierAvailable: false },
    });
  });

  test('timed work: rounds, work, rest, get ready and the lever, with the FR-9 defaults', async () => {
    mockParams = { type: 'interval' };
    renderRoute();

    expect(screen.getByText('2:00')).toBeTruthy();
    expect(screen.getByText('0:05')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Progress by' })).toHaveTextContent(/Less rest/);
    fireEvent.changeText(screen.getByLabelText('Name'), 'Heavy bag');
    fireEvent.press(createButton());

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(await lastCreated()).toMatchObject({
      type: 'interval',
      config: {
        type: 'interval',
        rounds: 3,
        workSec: 120,
        restSec: 60,
        getReadySec: 5,
        lever: 'rest',
        stepSec: 15,
      },
    });
  });

  test('mobility: only the duration, 10:00 by default', async () => {
    mockParams = { type: 'mobility' };
    renderRoute();

    expect(screen.getByText('10:00')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Progress by' })).toBeNull();
    fireEvent.changeText(screen.getByLabelText('Name'), 'Cooldown');
    fireEvent.press(createButton());

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(await lastCreated()).toMatchObject({
      type: 'mobility',
      config: { type: 'mobility', durationSec: 600 },
    });
  });

  test('a failed save says so and keeps the page open with what was typed', async () => {
    mockParams = { type: 'power' };
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const create = jest
      .spyOn(repositories().exerciseRepo, 'createCustom')
      .mockRejectedValueOnce(new Error('storage down'));
    renderRoute();

    fireEvent.changeText(screen.getByLabelText('Name'), 'My Throw');
    fireEvent.press(createButton());

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith("Couldn't save the exercise", 'Try again.'),
    );
    expect(screen.getByDisplayValue('My Throw')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();

    create.mockRestore();
    alert.mockRestore();
  });
});
