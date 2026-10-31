import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { OptionCard, OptionCardGroup } from '@design/components/OptionCard';

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

  test('a disabled card can not be chosen, and says so to assistive tech', () => {
    const onPress = jest.fn();
    render(
      <OptionCard title="Power" description="Why not." selected={false} onPress={onPress} disabled />,
    );

    const card = screen.getByRole('radio', { name: 'Power' });
    expect(card).toBeDisabled();

    fireEvent.press(card);
    expect(onPress).not.toHaveBeenCalled();
  });

  test('a disabled card dims its title, not the line that explains it', () => {
    render(
      <OptionCard title="Power" description="Why not." selected={false} onPress={jest.fn()} disabled />,
    );

    const opacityOf = (text: string) =>
      Object.assign({}, ...[screen.getByText(text).props.style].flat().filter(Boolean)).opacity;
    expect(opacityOf('Power')).toBe(0.5);
    expect(opacityOf('Why not.')).toBeUndefined();
  });
});

describe('OptionCardGroup', () => {
  test('holds its cards as one radiogroup', () => {
    render(
      <OptionCardGroup>
        <OptionCard title="Power" description="Explosive." selected onPress={jest.fn()} />
      </OptionCardGroup>,
    );

    expect(screen.UNSAFE_getByProps({ accessibilityRole: 'radiogroup' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Power' })).toBeTruthy();
  });
});
