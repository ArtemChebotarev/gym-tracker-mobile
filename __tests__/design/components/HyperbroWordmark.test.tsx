import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { HyperbroWordmark } from '@design/components/HyperbroWordmark';

describe('HyperbroWordmark', () => {
  test('is announced as the app name', () => {
    render(<HyperbroWordmark />);

    expect(screen.getByLabelText('Hyperbro')).toBeTruthy();
  });

  test('takes a width and keeps the artwork proportions through the aspect ratio', () => {
    render(<HyperbroWordmark width={100} />);

    const style = StyleSheet.flatten(screen.getByTestId('hyperbro-wordmark').props.style);
    expect(style.width).toBe(100);
    expect(style.aspectRatio).toBeCloseTo(2576 / 650);
  });

  test('never grows past its container, so a narrow dialog shrinks it', () => {
    render(<HyperbroWordmark />);

    const style = StyleSheet.flatten(screen.getByTestId('hyperbro-wordmark').props.style);
    expect(style.maxWidth).toBe('100%');
  });
});
