import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import {
  TemplatePreviewSheet,
  type TemplatePreviewSheetProps,
} from '@components/TemplatePreviewSheet';
import { toExerciseId, type Exercise, type MuscleGroup } from '@domain/catalog';
import type { MesoTemplate } from '@domain/plan';
import { STAMPS } from '../fixtures/stamps';

// BottomSheet's SafeAreaView throws without a SafeAreaProvider ancestor.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

function exercise(id: string, name: string, muscleGroup: MuscleGroup): Exercise {
  return { ...STAMPS, id: toExerciseId(id), name, muscleGroup, source: 'catalog', isHidden: false };
}

const library = [
  exercise('bench', 'Bench Press', 'chest'),
  exercise('squat', 'Squat', 'quads'),
  exercise('curl', 'Curl', 'biceps'),
];

function template(id: string, name: string): MesoTemplate {
  return {
    ...STAMPS,
    id,
    name,
    source: 'catalog',
    defaultLengthWeeks: 5,
    isHidden: false,
    weekPlan: {
      days: [
        { dayNumber: 1, name: '', exercises: [{ exerciseId: 'bench', order: 1, sets: 4 }] },
        { dayNumber: 2, name: '', exercises: [{ exerciseId: 'squat', order: 1, sets: 5 }] },
      ],
    },
  };
}

const fullBody = template('full-body', 'Full Body');

function makeProps(overrides: Partial<TemplatePreviewSheetProps> = {}): TemplatePreviewSheetProps {
  return {
    visible: true,
    onClose: jest.fn(),
    template: fullBody,
    exercises: library,
    onUseTemplate: jest.fn(),
    ...overrides,
  };
}

describe('TemplatePreviewSheet', () => {
  test("heads the sheet with the template's title and the line under it", () => {
    renderWithSafeArea(<TemplatePreviewSheet {...makeProps()} />);

    expect(screen.getByText('Full Body · 2 days')).toBeTruthy();
    expect(screen.getByText('2 exercises · 9 sets a week')).toBeTruthy();
  });

  test("opens on Day 1, its rows led by the exercise's muscle group", () => {
    renderWithSafeArea(<TemplatePreviewSheet {...makeProps()} />);

    expect(screen.getByRole('button', { name: 'Day 1' }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByText('Chest')).toBeTruthy();
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('4 sets')).toBeTruthy();
    expect(screen.queryByText('Quads')).toBeNull();
  });

  test("switching days shows that day's rows", () => {
    renderWithSafeArea(<TemplatePreviewSheet {...makeProps()} />);

    fireEvent.press(screen.getByRole('button', { name: 'Day 2' }));

    expect(screen.getByText('Quads')).toBeTruthy();
    expect(screen.getByText('Squat')).toBeTruthy();
    expect(screen.queryByText('Chest')).toBeNull();
  });

  test('the group comes from the library, not from the template', () => {
    const asBiceps = library.map((entry) =>
      entry.id === 'bench' ? { ...entry, muscleGroup: 'biceps' as const } : entry,
    );
    renderWithSafeArea(<TemplatePreviewSheet {...makeProps({ exercises: asBiceps })} />);

    expect(screen.getByText('Biceps')).toBeTruthy();
    expect(screen.queryByText('Chest')).toBeNull();
  });

  test('goes back to Day 1 when another template is shown', () => {
    const { rerender } = renderWithSafeArea(<TemplatePreviewSheet {...makeProps()} />);
    fireEvent.press(screen.getByRole('button', { name: 'Day 2' }));

    rerender(
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
        <TemplatePreviewSheet
          {...makeProps({ template: template('upper-lower', 'Upper / Lower') })}
        />
      </SafeAreaProvider>,
    );

    expect(screen.getByText('Chest')).toBeTruthy();
  });

  test('"Use this template" hands the template to the caller', () => {
    const props = makeProps();
    renderWithSafeArea(<TemplatePreviewSheet {...props} />);

    fireEvent.press(screen.getByRole('button', { name: 'Use this template' }));

    expect(props.onUseTemplate).toHaveBeenCalledWith(fullBody);
  });
});
