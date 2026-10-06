import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { RirBadge } from '@components/RirBadge';
import { rirExplanation } from '@components/RirExplanationLogic';
import { SIZES } from '@design/tokens';

const EXPLANATION = rirExplanation({ targetRir: 3, isDeload: false, hasRepTarget: true });

describe('RirBadge', () => {
  test('shows the chip as a button, and the plate only after a tap', () => {
    render(<RirBadge label="3 RIR" explanation={EXPLANATION} />);

    expect(screen.getByText('3 RIR')).toBeTruthy();
    expect(screen.queryByTestId('popover')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: '3 RIR, what is RIR?' }));

    expect(screen.getByText('3 RIR means 3 reps in reserve')).toBeTruthy();
    // The picture and its two labels, then the theses — not a paragraph.
    expect(screen.getByTestId('range-track')).toBeTruthy();
    expect(screen.getByText('Stop here')).toBeTruthy();
    expect(screen.getByText('Failure')).toBeTruthy();
    expect(screen.getByText(/Stop a set when/)).toBeTruthy();
  });

  test('a tap outside closes the plate', () => {
    render(<RirBadge label="3 RIR" explanation={EXPLANATION} />);
    fireEvent.press(screen.getByRole('button', { name: '3 RIR, what is RIR?' }));

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByTestId('popover')).toBeNull();
  });

  // The chip is drawn small; the 44pt Apple minimum is the button's own height plus its hitSlop.
  test('its touch area reaches 44pt: the drawn height plus the slop on both sides', () => {
    render(<RirBadge label="3 RIR" explanation={EXPLANATION} />);

    const button = screen.getByTestId('exercise-rir');
    const drawn = StyleSheet.flatten(button.props.style).minHeight as number;
    const slop = button.props.hitSlop as number;

    expect(drawn + 2 * slop).toBeGreaterThanOrEqual(44);
    expect(drawn).toBe(SIZES['size/icon-button']);
  });
});
