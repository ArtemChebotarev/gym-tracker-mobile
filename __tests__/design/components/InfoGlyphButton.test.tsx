import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { InfoGlyphButton } from '@design/components/InfoGlyphButton';
import { SIZES } from '@design/tokens';

describe('InfoGlyphButton', () => {
  test('is named for what its plate says and reports presses', () => {
    const onPress = jest.fn();
    render(<InfoGlyphButton accessibilityLabel="Finding your weight" open={false} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Finding your weight' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // Apple's Human Interface Guidelines: a control's touch area is at least 44 × 44 pt. The glyph is
  // drawn small (a 24pt disc); the button around it is what the finger meets, so it is the button
  // that has to be that big — and nothing in it may be smaller than the tap target.
  test('its touch area is at least 44 × 44 pt, Apple’s minimum', () => {
    render(<InfoGlyphButton accessibilityLabel="Finding your weight" open={false} onPress={() => {}} />);

    const style = StyleSheet.flatten(screen.getByRole('button').props.style);

    expect(SIZES['size/tap-target']).toBeGreaterThanOrEqual(44);
    expect(style.width).toBeGreaterThanOrEqual(44);
    expect(style.height).toBeGreaterThanOrEqual(44);
  });

  test('reports whether its plate is open to assistive technology', () => {
    render(<InfoGlyphButton accessibilityLabel="Finding your weight" open onPress={() => {}} />);

    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({ expanded: true });
  });
});
