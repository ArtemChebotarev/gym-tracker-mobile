import { SectionHeader } from '@design/components/SectionHeader';
import { render, screen } from '@testing-library/react-native';

describe('SectionHeader', () => {
  test('renders the title and count', () => {
    render(<SectionHeader title="Back" count={8} />);
    expect(screen.getByText('Back')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
  });

  test('renders the family dot in the given color', () => {
    render(<SectionHeader title="Back" count={8} dotColor="#5B9CF8" />);

    const dot = screen.getByTestId('section-header-dot');

    expect(dot.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: '#5B9CF8' })]),
    );
  });

  test('renders no dot when no color is given', () => {
    render(<SectionHeader title="Back" count={8} />);
    expect(screen.queryByTestId('section-header-dot')).toBeNull();
  });
});
