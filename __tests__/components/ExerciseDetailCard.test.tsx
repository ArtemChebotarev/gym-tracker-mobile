import { render, screen } from '@testing-library/react-native';

import { ExerciseDetailCard, ExerciseDetailCardRow } from '@components/ExerciseDetailCard';

describe('ExerciseDetailCard', () => {
  test('labels the card and puts the meta line beside the label', () => {
    render(
      <ExerciseDetailCard label="Last session" meta="Week 3 · Day 1 · 10 Aug">
        <ExerciseDetailCardRow label="Set 1" labelTone="counter" value="80 kg × 9" isLast />
      </ExerciseDetailCard>,
    );

    expect(screen.getByText('Last session')).toBeTruthy();
    expect(screen.getByText('Week 3 · Day 1 · 10 Aug')).toBeTruthy();
  });

  test('renders no meta line when the caller gives none', () => {
    render(
      <ExerciseDetailCard label="Earlier">
        <ExerciseDetailCardRow label="W2 · D1 · 3 Aug" labelTone="fact" value="80 × 8" isLast />
      </ExerciseDetailCard>,
    );

    expect(screen.getByText('Earlier')).toBeTruthy();
    expect(screen.getByText('W2 · D1 · 3 Aug')).toBeTruthy();
  });

  test('reads a row as its value plus the quieter tail', () => {
    render(
      <ExerciseDetailCard label="Last session">
        <ExerciseDetailCardRow
          label="Set 1"
          labelTone="counter"
          value="80 kg × 9"
          tail=" · 2 RIR"
          isLast={false}
        />
      </ExerciseDetailCard>,
    );

    // The tail is its own Text inside the value's — a query sees the two as one line.
    expect(screen.getByText('80 kg × 9 · 2 RIR')).toBeTruthy();
  });
});
