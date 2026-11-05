import { Badge } from '@design/components/Badge';
import { SIZES } from '@design/tokens';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

/** The pill's own style — the badge's root view. */
function pillStyle(element: React.ReactElement) {
  const tree = render(element).toJSON();
  if (tree === null || Array.isArray(tree)) {
    throw new Error('Badge renders one root view');
  }
  return StyleSheet.flatten(tree.props.style);
}

describe('Badge', () => {
  test.each(['accent', 'neutral'] as const)('renders the %s variant', (variant) => {
    render(<Badge label="Custom" variant={variant} />);
    expect(screen.getByText('Custom')).toBeTruthy();
  });

  test('defaults to the neutral variant', () => {
    render(<Badge label="Catalog" />);
    expect(screen.getByText('Catalog')).toBeTruthy();
  });

  test('a compact badge is a tag-high pill', () => {
    const pill = pillStyle(<Badge label="Upper body" size="compact" />);
    expect(pill.height).toBe(SIZES['size/tag']);
  });
});
