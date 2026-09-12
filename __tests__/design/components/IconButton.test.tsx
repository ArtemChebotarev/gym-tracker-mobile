import { IconButton } from '@design/components/IconButton';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('IconButton', () => {
  test.each(['accent', 'neutral'] as const)('renders the %s variant', (variant) => {
    render(
      <IconButton accessibilityLabel="Close" onPress={() => {}} variant={variant}>
        <Text>×</Text>
      </IconButton>,
    );

    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  test('defaults to the neutral variant', () => {
    render(
      <IconButton accessibilityLabel="Close" onPress={() => {}}>
        <Text>×</Text>
      </IconButton>,
    );

    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(
      <IconButton accessibilityLabel="Close" onPress={onPress}>
        <Text>×</Text>
      </IconButton>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('disabled does not call onPress when pressed', () => {
    const onPress = jest.fn();
    render(
      <IconButton accessibilityLabel="Close" onPress={onPress} disabled>
        <Text>×</Text>
      </IconButton>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
