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

  test('the ring wraps the element with the gap on every side', () => {
    render(<Coachmark {...props()} />);

    const ring = screen.getByTestId('coachmark-ring').props;

    // ANCHOR (180, 200, 60 × 28) grown by `space/xs` (4).
    expect(ring.x).toBe(176);
    expect(ring.y).toBe(196);
    expect(ring.width).toBe(68);
    expect(ring.height).toBe(36);
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
