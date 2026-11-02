import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { PlateBox } from '@design/components/PlateBox';
import { COLORS } from '@design/tokens';

describe('PlateBox', () => {
  test('puts its label over the box, and what it holds in the box', () => {
    render(
      <PlateBox label="Working set">
        <Text>Do one set.</Text>
      </PlateBox>,
    );

    expect(screen.getByText('Working set')).toBeTruthy();
    expect(screen.getByTestId('plate-box')).toHaveTextContent('Do one set.');
    expect(screen.getByTestId('plate-box')).not.toHaveTextContent('Working set');
  });

  test('is a tone darker than the plate, and in the accent where the plate says so', () => {
    const { rerender } = render(<PlateBox label="Warm up" />);
    expect(screen.getByTestId('plate-box')).toHaveStyle({
      backgroundColor: COLORS['surface/plate-box'],
      borderColor: COLORS['border/plate-box'],
    });

    rerender(<PlateBox label="Working set" accent />);
    expect(screen.getByTestId('plate-box')).toHaveStyle({
      backgroundColor: COLORS['accent/bg'],
      borderColor: COLORS['accent/border'],
    });
    expect(screen.getByText('Working set')).toHaveStyle({ color: COLORS.accent });
  });
});
