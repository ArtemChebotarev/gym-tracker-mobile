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

    const wordmark = screen.getByTestId('hyperbro-wordmark');
    expect(wordmark.props.width).toBe(100);
    expect(StyleSheet.flatten(wordmark.props.style).aspectRatio).toBeCloseTo(2576 / 650);
  });
});
