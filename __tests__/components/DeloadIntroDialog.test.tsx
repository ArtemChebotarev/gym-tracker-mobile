import { fireEvent, render, screen } from '@testing-library/react-native';

import { DeloadIntroDialog } from '@components/DeloadIntroDialog';

const props = { visible: true, exercises: [{ type: 'strength' }] } as const;

describe('DeloadIntroDialog', () => {
  test('DoD: the title, a lead, three facts and a Got it, with no wordmark', () => {
    render(<DeloadIntroDialog {...props} onDismiss={() => {}} />);

    expect(screen.getByText('Deload week')).toBeTruthy();
    expect(screen.getByText('The last week of your cycle.')).toBeTruthy();
    // Three facts, each a chip and one line — not a paragraph.
    expect(screen.getByText('50% load')).toBeTruthy();
    expect(screen.getByText('Fewer sets')).toBeTruthy();
    expect(screen.getByText('Easy sets')).toBeTruthy();
    expect(screen.queryByText(/RIR|reps left/)).toBeNull();
    expect(screen.getByText('Reps shown are a guide based on last week.')).toBeTruthy();
    expect(screen.queryByLabelText('Hybro')).toBeNull();
    expect(screen.getByText('Got it')).toBeTruthy();
  });

  test('a session of rounds alone has no reps to say anything about', () => {
    render(<DeloadIntroDialog visible exercises={[{ type: 'interval' }]} onDismiss={() => {}} />);

    expect(screen.getByText('Fewer rounds')).toBeTruthy();
    expect(screen.queryByText(/Reps shown/)).toBeNull();
  });

  test('Got it and the cross report the same dismissal', () => {
    const onDismiss = jest.fn();
    render(<DeloadIntroDialog {...props} onDismiss={onDismiss} />);

    fireEvent.press(screen.getByText('Got it'));
    fireEvent.press(screen.getByLabelText('Close'));

    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  test('draws nothing while hidden', () => {
    render(<DeloadIntroDialog {...props} visible={false} onDismiss={() => {}} />);

    expect(screen.queryByText('Got it')).toBeNull();
  });
});
