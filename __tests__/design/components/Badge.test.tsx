import { Badge } from '@design/components/Badge';
import { render, screen } from '@testing-library/react-native';

describe('Badge', () => {
  test.each(['accent', 'neutral'] as const)('renders the %s variant', (variant) => {
    render(<Badge label="Custom" variant={variant} />);
    expect(screen.getByText('Custom')).toBeTruthy();
  });

  test('defaults to the neutral variant', () => {
    render(<Badge label="Catalog" />);
    expect(screen.getByText('Catalog')).toBeTruthy();
  });
});
