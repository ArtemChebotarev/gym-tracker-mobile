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
});
