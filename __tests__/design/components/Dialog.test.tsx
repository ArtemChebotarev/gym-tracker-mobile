import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Dialog } from '@design/components/Dialog';

describe('Dialog', () => {
  test('shows what it is given while visible', () => {
    render(
      <Dialog visible>
        <Text>Deload week</Text>
      </Dialog>,
    );

    expect(screen.getByTestId('dialog')).toBeTruthy();
    expect(screen.getByText('Deload week')).toBeTruthy();
  });

  test('renders nothing while hidden', () => {
    render(
      <Dialog visible={false}>
        <Text>Deload week</Text>
      </Dialog>,
    );

    expect(screen.queryByText('Deload week')).toBeNull();
  });

  test('has no way out of its own — no close control, and the scrim does not respond', () => {
    render(
      <Dialog visible>
        <Text>Deload week</Text>
      </Dialog>,
    );

    expect(screen.queryByLabelText('Close')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    // Nothing to tap on the scrim: pressing the card changes nothing and the content stays.
    fireEvent.press(screen.getByTestId('dialog'));
    expect(screen.getByText('Deload week')).toBeTruthy();
  });
});
