import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { HybroWordmark } from '@design/components/HybroWordmark';

describe('HybroWordmark', () => {
  test('is announced as the app name', () => {
    render(<HybroWordmark />);

    expect(screen.getByLabelText('Hybro')).toBeTruthy();
  });

  test('takes a width and keeps the artwork proportions through the aspect ratio', () => {
    render(<HybroWordmark width={100} />);

    const wordmark = screen.getByTestId('hybro-wordmark');
    expect(wordmark.props.width).toBe(100);
    expect(StyleSheet.flatten(wordmark.props.style).aspectRatio).toBeCloseTo(1620 / 650);
  });
});
