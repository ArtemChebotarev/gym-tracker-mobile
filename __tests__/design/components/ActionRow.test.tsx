import { fireEvent, render, screen } from '@testing-library/react-native';

import { ActionRow } from '@design/components/ActionRow';
import { PlusIcon } from '@design/icons/PlusIcon';
import { COLORS } from '@design/tokens';

describe('ActionRow', () => {
  test('is a button named by its label that calls onPress', () => {
    const onPress = jest.fn();
    render(<ActionRow icon={PlusIcon} label="Add exercise" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Add exercise' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('danger tints the label red', () => {
    render(
      <ActionRow icon={PlusIcon} label="Stop mesocycle" onPress={jest.fn()} variant="danger" />,
    );

    expect(screen.getByText('Stop mesocycle')).toHaveStyle({ color: COLORS.danger });
  });

  test('a disabled reason disables the row and shows the reason', () => {
    const onPress = jest.fn();
    render(
      <ActionRow
        icon={PlusIcon}
        label="Move up"
        onPress={onPress}
        disabledReason="Already first"
      />,
    );

    const row = screen.getByRole('button', { name: 'Move up' });
    expect(row).toBeDisabled();
    expect(screen.getByText('Already first')).toBeTruthy();
    expect(screen.getByText('Move up')).toHaveStyle({ color: COLORS['text/disabled'] });
    fireEvent.press(row);
    expect(onPress).not.toHaveBeenCalled();
  });

  test('a caption sits under the label', () => {
    render(
      <ActionRow
        icon={PlusIcon}
        label="From scratch"
        caption="Build the week yourself"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Build the week yourself')).toBeTruthy();
  });

  // A row whose caption carries the reason turns off without a right-hand one.
  test('disabled without a reason still turns the row off and greys the caption', () => {
    const onPress = jest.fn();
    render(
      <ActionRow
        icon={PlusIcon}
        label="Copy a mesocycle"
        caption="Nothing to copy yet"
        onPress={onPress}
        disabled
      />,
    );

    const row = screen.getByRole('button', { name: 'Copy a mesocycle' });
    expect(row).toBeDisabled();
    expect(screen.getByText('Nothing to copy yet')).toHaveStyle({
      color: COLORS['text/disabled'],
    });
    fireEvent.press(row);
    expect(onPress).not.toHaveBeenCalled();
  });
});
