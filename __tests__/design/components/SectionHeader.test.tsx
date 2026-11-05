import { SectionHeader } from '@design/components/SectionHeader';
import { COLORS, SPACING } from '@design/tokens';
import { StyleSheet } from 'react-native';
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

  test("a label header sits on its container's surface, text a hair in, the count set like the title", () => {
    // GT-222: over a list of blocks there is no raised band. Still opaque, so a sticky header
    // covers the blocks scrolling under it — the screen's surface on a screen, the sheet's in a sheet.
    const { rerender } = render(<SectionHeader title="Back" count={8} variant="label" />);
    const container = StyleSheet.flatten(screen.getByTestId('section-header').props.style);
    expect(container.backgroundColor).toBe(COLORS['surface/page']);
    expect(container.paddingHorizontal).toBe(SPACING['space/screen'] + SPACING['space/xs']);
    expect(StyleSheet.flatten(screen.getByText('8').props.style)).toEqual(
      StyleSheet.flatten(screen.getByText('Back').props.style),
    );

    rerender(<SectionHeader title="Back" count={8} variant="label" edge="sheet" />);
    const inSheet = StyleSheet.flatten(screen.getByTestId('section-header').props.style);
    expect(inSheet.backgroundColor).toBe(COLORS['surface/sheet']);
  });

  test('a label header takes no space above or below it, so every label sticks at the same height', () => {
    // GT-222: the space between groups is SectionGap's, at the end of the group before. Inside the
    // header it rode along when the header stuck, and labels after the first stuck lower.
    render(<SectionHeader title="Back" count={8} variant="label" />);
    const style = StyleSheet.flatten(screen.getByTestId('section-header').props.style);
    expect(style.paddingTop).toBe(0);
    expect(style.paddingBottom).toBe(0);
  });
});
