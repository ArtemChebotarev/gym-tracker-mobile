import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { OptionCard } from '@design/components/OptionCard';

function renderCard(selected: boolean, onPress = jest.fn()) {
  render(
    <OptionCard
      title="Power"
      description="Explosive."
      selected={selected}
      onPress={onPress}
      icon={<Text>icon</Text>}
    />,
  );
  return onPress;
}

describe('OptionCard', () => {
  test('shows its title and description', () => {
    renderCard(false);

    expect(screen.getByText('Power')).toBeTruthy();
    expect(screen.getByText('Explosive.')).toBeTruthy();
  });

  test('reports the selected state to assistive tech', () => {
    renderCard(true);

    expect(screen.getByRole('radio', { name: 'Power' }).props.accessibilityState.checked).toBe(true);
  });

  test('calls onPress when tapped', () => {
    const onPress = renderCard(false);

    fireEvent.press(screen.getByRole('radio', { name: 'Power' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('is one fixed height, and its explanation holds to two lines', () => {
    renderCard(false);

    expect(screen.getByText('Explosive.').props.numberOfLines).toBe(2);
    const card = screen.getByRole('radio', { name: 'Power' });
    const style = Object.assign({}, ...[card.props.style].flat().filter(Boolean));
    expect(style.height).toBe(92);
  });
});
