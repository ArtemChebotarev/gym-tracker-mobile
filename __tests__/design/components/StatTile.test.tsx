import { StatTile } from '@design/components/StatTile';
import { render, screen } from '@testing-library/react-native';

describe('StatTile', () => {
  test('renders the label and value', () => {
    render(<StatTile label="Volume" value="4.2 t" />);
    expect(screen.getByText('Volume')).toBeTruthy();
    expect(screen.getByText('4.2 t')).toBeTruthy();
  });
});

describe('StatTile with a total', () => {
  test('reads value / total', () => {
    render(<StatTile label="Workouts" value="26" total="28" />);
    expect(screen.getByText('26 / 28')).toBeTruthy();
  });
});
