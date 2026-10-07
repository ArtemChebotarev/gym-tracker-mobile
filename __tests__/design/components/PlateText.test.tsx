import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { PlateText } from '@design/components/PlateText';
import { InfoIcon } from '@design/icons/InfoIcon';
import { COLORS, TYPOGRAPHY } from '@design/tokens';

describe('PlateText', () => {
  test('reads as one sentence, with its strong words a piece of their own', () => {
    render(<PlateText parts={['Tap to see ', { strong: 'the reps' }, '.']} />);

    expect(screen.getByText('Tap to see the reps.')).toBeTruthy();
    expect(screen.getByText('the reps')).toBeTruthy();
  });

  test('a strong word is heavier and lighter in colour than the plain text around it', () => {
    render(<PlateText parts={['Plain ', { strong: 'strong' }]} />);

    const strong = StyleSheet.flatten(screen.getByText('strong').props.style);
    const plain = StyleSheet.flatten(screen.getByText('Plain strong').props.style);

    expect(strong.fontWeight).toBe(TYPOGRAPHY['type/card-title'].fontWeight);
    expect(strong.color).toBe(COLORS['text/primary']);
    expect(plain.color).toBe(COLORS['text/secondary']);
  });

  test('an icon stands in the line where a symbol would not do', () => {
    render(<PlateText parts={['Tap ', { icon: InfoIcon }, ' for a way.']} />);

    expect(screen.getByTestId('plate-text-icon')).toBeTruthy();
  });
});
