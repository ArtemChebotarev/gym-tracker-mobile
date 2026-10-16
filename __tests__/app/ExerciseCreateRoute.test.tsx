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

  test('power is a single step: no counter, Create straight away', () => {
    mockParams = { type: 'power' };
    renderRoute();

    expect(screen.queryByText(/^Step /)).toBeNull();
    expect(screen.getByRole('button', { name: 'Create exercise' })).toBeTruthy();
  });

  test('power: only a name is needed; stored as fullBody with its defaults, rest steppable', async () => {
    mockParams = { type: 'power' };
    renderRoute();

    expect(screen.getByText('1:00')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Increase Rest' }));
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

  test('timed work: step 1 is the plan with the FR-9 defaults, and ends in Next, not Create', () => {
    mockParams = { type: 'interval' };
    renderRoute();

    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
    expect(screen.getByText('2:00')).toBeTruthy();
    expect(screen.getByText('0:05')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Create exercise' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Next' }).props.accessibilityState.disabled).toBe(
      true,
    );
  });

  test('timed work: step 2 offers the four levers, and Create stores the plan with the chosen one', async () => {
    mockParams = { type: 'interval' };
    renderRoute();
    fireEvent.changeText(screen.getByLabelText('Name'), 'Heavy bag');
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Step 2 of 2')).toBeTruthy();
    for (const name of ['Less rest', 'More work', 'More rounds', 'None']) {
      expect(screen.getByRole('radio', { name })).toBeTruthy();
    }
    expect(screen.getByRole('radio', { name: 'Less rest' }).props.accessibilityState.checked).toBe(
      true,
    );
    expect(screen.getByText('Progression')).toBeTruthy();
    expect(screen.queryByText('New exercise')).toBeNull();
    expect(screen.getByText('How much shorter the rest gets each week.')).toBeTruthy();

    fireEvent.press(screen.getByRole('radio', { name: 'More work' }));
    fireEvent.press(screen.getByRole('button', { name: '5 s' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create exercise' }));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(await lastCreated()).toMatchObject({
      name: 'Heavy bag',
      type: 'interval',
      config: {
        type: 'interval',
        workSec: 120,
        restSec: 60,
        getReadySec: 5,
        lever: 'workTime',
        stepSec: 5,
      },
    });
  });

  test('the step is asked only for levers that move time', () => {
    mockParams = { type: 'interval', name: 'Heavy bag' };
    renderRoute();
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step')).toBeTruthy();

    fireEvent.press(screen.getByRole('radio', { name: 'More rounds' }));
    expect(screen.queryByText('Step')).toBeNull();
  });

  test('Back from step 2 returns to the plan with what was typed', () => {
    mockParams = { type: 'interval', name: 'Heavy bag' };
    renderRoute();
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));

    fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
    expect(screen.getByLabelText('Name').props.value).toBe('Heavy bag');
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

  test('tapping a time opens the time picker for that field, and Done closes it', () => {
    mockParams = { type: 'interval' };
    renderRoute();

    fireEvent.press(screen.getByRole('button', { name: 'Set Work' }));

    // The row's label and the picker's title.
    expect(screen.getAllByText('Work')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
  });

  test('timed work asks for no rounds: how many is set in the cycle and the workout', () => {
    mockParams = { type: 'interval' };
    renderRoute();

    expect(screen.queryByText('Rounds')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Set Rounds' })).toBeNull();
    expect(screen.getByText('Work')).toBeTruthy();
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
  test('the equipment dropdown offers the list of the type, not every value', async () => {
    mockParams = { type: 'power' };
    renderRoute();

    fireEvent.press(screen.getByRole('button', { name: 'Equipment' }));

    expect(await screen.findByRole('button', { name: 'Medicine ball' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Plyo box' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Barbell' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Heavy bag' })).toBeNull();
  });

  test('strength keeps its gym list and gets no medicine ball', async () => {
    mockParams = { type: 'strength' };
    renderRoute();

    fireEvent.press(screen.getByRole('button', { name: 'Equipment' }));

    expect(await screen.findByRole('button', { name: 'Barbell' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kettlebell' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Medicine ball' })).toBeNull();
  });
});
