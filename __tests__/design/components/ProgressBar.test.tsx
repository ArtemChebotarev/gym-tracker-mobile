import { render, screen } from '@testing-library/react-native';

import { ProgressBar } from '@design/components/ProgressBar';

function renderedPercent(): number | undefined {
  return screen.getByRole('progressbar').props.accessibilityValue?.now;
}

describe('ProgressBar', () => {
  test('exposes the filled share as a 0–100 progress value', () => {
    render(<ProgressBar value={0.25} accessibilityLabel="Workout progress" />);

    expect(screen.getByRole('progressbar', { name: 'Workout progress' })).toBeTruthy();
    expect(renderedPercent()).toBe(25);
  });

  test('rounds a fractional share to a whole percent', () => {
    render(<ProgressBar value={1 / 3} accessibilityLabel="Workout progress" />);

    expect(renderedPercent()).toBe(33);
  });

  test.each([
    [-0.5, 0],
    [1.5, 100],
  ])('clamps %p to %p', (value, percent) => {
    render(<ProgressBar value={value} accessibilityLabel="Workout progress" />);

    expect(renderedPercent()).toBe(percent);
  });
});
