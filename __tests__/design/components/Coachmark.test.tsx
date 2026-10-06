import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Coachmark, type CoachmarkProps } from '@design/components/Coachmark';

const ANCHOR = { x: 180, y: 200, width: 60, height: 28 };

function props(overrides: Partial<CoachmarkProps> = {}): CoachmarkProps {
  return {
    visible: true,
    anchor: ANCHOR,
    step: 1,
    total: 4,
    title: '3 RIR means 3 reps in reserve',
    paragraphs: ['Stop a set when you could do about 3 more.', 'Week 1 has no rep target.'],
    onNext: jest.fn(),
    onSkip: jest.fn(),
    ...overrides,
  };
}

describe('Coachmark', () => {
  test('shows the counter, the title and every paragraph', () => {
    render(<Coachmark {...props()} />);

    expect(screen.getByText('1 of 4')).toBeTruthy();
    expect(screen.getByText('3 RIR means 3 reps in reserve')).toBeTruthy();
    expect(screen.getByText('Stop a set when you could do about 3 more.')).toBeTruthy();
    expect(screen.getByText('Week 1 has no rep target.')).toBeTruthy();
  });

  test('DoD: a measured element gets a ring and the bubble points at it', () => {
    render(<Coachmark {...props()} />);

    expect(screen.getByTestId('coachmark-ring')).toBeTruthy();
    expect(screen.getByTestId('coachmark-arrow')).toBeTruthy();
  });

  // The design's ring hugs the element: a 56 × 24 chip gets a 68 × 36 ring, 6 clear on every side
  // and the 2pt stroke inside that box.
  test('the ring hugs the element, 6 clear of it, with its stroke inside the box', () => {
    render(<Coachmark {...props()} />);

    const ring = screen.getByTestId('coachmark-ring').props;

    // ANCHOR (180, 200, 60 × 28) → box (174, 194, 72 × 40) → stroke rect pulled in by 1.
    expect(ring.x).toBe(175);
    expect(ring.y).toBe(195);
    expect(ring.width).toBe(70);
    expect(ring.height).toBe(38);
  });

  test('the bubble’s arrow is the coachmark’s 14pt, softened at the corner', () => {
    render(<Coachmark {...props()} />);

    const arrow = StyleSheet.flatten(screen.getByTestId('coachmark-arrow').props.style);

    expect(arrow.width).toBe(14);
    expect(arrow.height).toBe(14);
    expect(arrow.borderRadius).toBe(2);
  });

  // 08.11: Next / Got it and Skip are the full 44pt tall, so nothing relies on hitSlop.
  test('its buttons are the full 44pt tall', () => {
    render(<Coachmark {...props()} />);

    for (const name of ['Skip', 'Next']) {
      const style = StyleSheet.flatten(screen.getByRole('button', { name }).props.style);
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
    }
  });

  test('with nothing measured there is no ring and no arrow, and the bubble is still there', () => {
    render(<Coachmark {...props({ anchor: null })} />);

    expect(screen.queryByTestId('coachmark-ring')).toBeNull();
    expect(screen.queryByTestId('coachmark-arrow')).toBeNull();
    expect(screen.getByTestId('coachmark')).toBeTruthy();
  });

  test('a step that is not the last has Skip and Next, and no Got it', () => {
    render(<Coachmark {...props({ step: 2 })} />);

    expect(screen.getByRole('button', { name: 'Skip' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull();
  });

  test('DoD: the last step has Got it alone instead of the pair', () => {
    render(<Coachmark {...props({ step: 4 })} />);

    expect(screen.getByRole('button', { name: 'Got it' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
  });

  test('reports Next, Got it and Skip', () => {
    const onNext = jest.fn();
    const onSkip = jest.fn();
    const { rerender } = render(<Coachmark {...props({ step: 1, onNext, onSkip })} />);

    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    fireEvent.press(screen.getByRole('button', { name: 'Skip' }));
    rerender(<Coachmark {...props({ step: 4, onNext, onSkip })} />);
    fireEvent.press(screen.getByRole('button', { name: 'Got it' }));

    expect(onNext).toHaveBeenCalledTimes(2);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  test('draws nothing while hidden', () => {
    render(<Coachmark {...props({ visible: false })} />);

    expect(screen.queryByText('1 of 4')).toBeNull();
  });
});
