import { fireEvent, render, screen } from '@testing-library/react-native';

import { DeloadIntroDialog } from '@components/DeloadIntroDialog';

describe('DeloadIntroDialog', () => {
  test('DoD: the title, the explanation and a Got it, with no wordmark', () => {
    render(<DeloadIntroDialog visible onDismiss={() => {}} />);

    expect(screen.getByText('Deload week')).toBeTruthy();
    expect(screen.getByText(/This is the last week of your cycle/)).toBeTruthy();
    expect(screen.getByText(/aim to finish each set with/)).toBeTruthy();
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
