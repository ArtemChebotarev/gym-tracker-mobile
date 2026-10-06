import { fireEvent, render, screen } from '@testing-library/react-native';

import { WelcomeDialog } from '@components/WelcomeDialog';

describe('WelcomeDialog', () => {
  test('DoD: the wordmark, the promise, three steps and a single Got it', () => {
    render(<WelcomeDialog visible onDismiss={() => {}} />);

    expect(screen.getByLabelText('Hybro')).toBeTruthy();
    expect(screen.getByText('Progressive training that adapts to you')).toBeTruthy();
    expect(screen.getByText('Plan a training cycle')).toBeTruthy();
    expect(screen.getByText('Pick your days and exercises.')).toBeTruthy();
    expect(screen.getByText('Find your weight')).toBeTruthy();
    expect(screen.getByText('We handle progression')).toBeTruthy();
    // Two controls, both of them closing it, and nothing that leads on to creating a cycle (08.11).
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByLabelText('Close')).toBeTruthy();
    expect(screen.getByText('Got it')).toBeTruthy();
  });

  test('Got it reports the dismissal', () => {
    const onDismiss = jest.fn();
    render(<WelcomeDialog visible onDismiss={onDismiss} />);

    fireEvent.press(screen.getByText('Got it'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('the cross in the corner dismisses it exactly as Got it does', () => {
    const onDismiss = jest.fn();
    render(<WelcomeDialog visible onDismiss={onDismiss} />);

    fireEvent.press(screen.getByLabelText('Close'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('draws nothing while hidden', () => {
    render(<WelcomeDialog visible={false} onDismiss={() => {}} />);

    expect(screen.queryByText('Got it')).toBeNull();
  });
});
