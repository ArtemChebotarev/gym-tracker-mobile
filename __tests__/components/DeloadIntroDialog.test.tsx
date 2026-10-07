import { fireEvent, render, screen } from '@testing-library/react-native';

import { DeloadIntroDialog } from '@components/DeloadIntroDialog';

describe('DeloadIntroDialog', () => {
  test('DoD: the title, a lead, three facts and a Got it, with no wordmark', () => {
    render(<DeloadIntroDialog visible onDismiss={() => {}} />);

    expect(screen.getByText('Deload week')).toBeTruthy();
    expect(screen.getByText('The last week of your cycle.')).toBeTruthy();
    // Three facts, each a chip and one line — not a paragraph.
    expect(screen.getByText('½ weight')).toBeTruthy();
    expect(screen.getByText('Fewer sets')).toBeTruthy();
    expect(screen.getByText('8 RIR')).toBeTruthy();
    expect(screen.getByText(/finish each set with about 8 reps left/)).toBeTruthy();
    expect(screen.getByText(/what you did last week/)).toBeTruthy();
    expect(screen.queryByLabelText('Hybro')).toBeNull();
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
