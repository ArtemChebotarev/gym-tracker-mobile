import { fireEvent, render, screen } from '@testing-library/react-native';

import { DeloadIntroDialog } from '@components/DeloadIntroDialog';

describe('DeloadIntroDialog', () => {
  test('DoD: the title, a lead, three facts and a Got it, with no wordmark', () => {
    render(<DeloadIntroDialog visible onDismiss={() => {}} />);

    expect(screen.getByText('Deload week')).toBeTruthy();
    expect(screen.getByText('The last week of your cycle.')).toBeTruthy();
    // Three facts, each a chip and one line — not a paragraph.
    expect(screen.getByText('50% load')).toBeTruthy();
    expect(screen.getByText('Less volume')).toBeTruthy();
    expect(screen.getByText('Go easy')).toBeTruthy();
    expect(screen.queryByText(/RIR|reps left/)).toBeNull();
    expect(screen.getByText('Reps shown are a guide based on last week.')).toBeTruthy();
    expect(screen.queryByLabelText('Hyperbro')).toBeNull();
    expect(screen.getByText('Got it')).toBeTruthy();
  });

  test('Got it and the cross report the same dismissal', () => {
    const onDismiss = jest.fn();
    render(<DeloadIntroDialog visible onDismiss={onDismiss} />);

    fireEvent.press(screen.getByText('Got it'));
    fireEvent.press(screen.getByLabelText('Close'));

    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  test('draws nothing while hidden', () => {
    render(<DeloadIntroDialog visible={false} onDismiss={() => {}} />);

    expect(screen.queryByText('Got it')).toBeNull();
  });
});
