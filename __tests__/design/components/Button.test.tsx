import { Button } from '@design/components/Button';
import { fireEvent, render, screen } from '@testing-library/react-native';

describe('Button', () => {
  test.each(['primary', 'secondary', 'danger'] as const)('renders the %s variant', (variant) => {
    render(<Button label="Create exercise" onPress={() => {}} variant={variant} />);
    expect(screen.getByRole('button', { name: 'Create exercise' })).toBeTruthy();
  });

  test('defaults to the primary variant', () => {
    render(<Button label="Create exercise" onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Create exercise' })).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button label="Create exercise" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Create exercise' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('disabled does not call onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button label="Create exercise" onPress={onPress} disabled />);

    fireEvent.press(screen.getByRole('button', { name: 'Create exercise' }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
