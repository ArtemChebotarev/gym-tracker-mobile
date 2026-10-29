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
  // drawn small (a 24pt disc); what the finger meets is the button plus its slop. The button is as
  // tall as the tap target and as wide as the disc, so it sits right after its label (Artem's
  // review, 18.10.2026), and the slop either side makes up the width.
  test('its touch area is at least 44 × 44 pt, Apple’s minimum', () => {
    render(<InfoGlyphButton accessibilityLabel="Finding your weight" open={false} onPress={() => {}} />);

    const button = screen.getByRole('button');
    const style = StyleSheet.flatten(button.props.style);
    const slop = button.props.hitSlop as { left: number; right: number };

    expect(SIZES['size/tap-target']).toBeGreaterThanOrEqual(44);
    expect(style.width + slop.left + slop.right).toBeGreaterThanOrEqual(44);
    expect(style.height).toBeGreaterThanOrEqual(44);
  });

  test('reports whether its plate is open to assistive technology', () => {
    render(<InfoGlyphButton accessibilityLabel="Finding your weight" open onPress={() => {}} />);

    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({ expanded: true });
  });
});
