import { StyleSheet } from 'react-native';

import { Chip } from '@design/components/Chip';
import { COLORS } from '@design/tokens';
import { fireEvent, render, screen } from '@testing-library/react-native';

/** The chip's own box: the nearest ancestor of its label that has a fill. */
function boxOf(label: ReturnType<typeof screen.getByText>) {
  let node = label.parent;
  while (node && StyleSheet.flatten(node.props.style)?.backgroundColor === undefined) {
    node = node.parent;
  }
  return StyleSheet.flatten(node!.props.style);
}

describe('Chip', () => {
  test.each([true, false])('renders the selectable variant when selected=%s', (selected) => {
    render(<Chip variant="selectable" label="Chest" selected={selected} onPress={() => {}} />);

    expect(screen.getByRole('button', { name: 'Chest' })).toBeTruthy();
  });

  test('selectable calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Chip variant="selectable" label="Chest" selected={false} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Chest' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('renders the static variant without a group dot', () => {
    render(<Chip variant="static" label="Chest" />);
    expect(screen.getByText('Chest')).toBeTruthy();
  });

  test('renders the static variant with a group dot', () => {
    render(<Chip variant="static" label="Chest" dotColor="#F0A537" />);
    expect(screen.getByText('Chest')).toBeTruthy();
  });

  test('renders the counter variant with its count', () => {
    render(<Chip variant="counter" label="Exercises" count={12} />);
    expect(screen.getByText('Exercises 12')).toBeTruthy();
  });

  // 08.11: the first-weight ladder's rep counts carry the accent tint.
  test('a static chip can take the accent tint: dark green fill, green outline and text', () => {
    render(<Chip variant="static" label="12 reps" accent />);

    const label = screen.getByText('12 reps');

    expect(StyleSheet.flatten(label.props.style).color).toBe(COLORS.accent);
    expect(boxOf(label)).toMatchObject({
      backgroundColor: COLORS['accent/bg'],
      borderColor: COLORS['accent/border'],
    });
  });

  test('without it a static chip keeps its neutral look', () => {
    render(<Chip variant="static" label="12 reps" />);

    const label = screen.getByText('12 reps');

    expect(StyleSheet.flatten(label.props.style).color).toBe(COLORS['text/secondary']);
    expect(boxOf(label).backgroundColor).toBe(COLORS['surface/card']);
  });
});
