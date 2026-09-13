import { BottomSheet } from '@design/components/BottomSheet';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ScrollView, Text } from 'react-native';

describe('BottomSheet', () => {
  test('renders nothing when not visible', () => {
    render(
      <BottomSheet visible={false} onClose={() => {}} title="Filters">
        <Text>Content</Text>
      </BottomSheet>,
    );

    expect(screen.queryByText('Filters')).toBeNull();
  });

  test('renders the title and content when visible', () => {
    render(
      <BottomSheet visible onClose={() => {}} title="Filters">
        <Text>Content</Text>
      </BottomSheet>,
    );

    expect(screen.getByText('Filters')).toBeTruthy();
    expect(screen.getByText('Content')).toBeTruthy();
  });

  test('closes by button when the backdrop is pressed', () => {
    const onClose = jest.fn();
    render(
      <BottomSheet visible onClose={onClose} title="Filters">
        <Text>Content</Text>
      </BottomSheet>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('closes by gesture when the grabber is dragged down past the threshold', () => {
    const onClose = jest.fn();
    render(
      <BottomSheet visible onClose={onClose} title="Filters">
        <Text>Content</Text>
      </BottomSheet>,
    );

    const grabber = screen.getByTestId('bottom-sheet-grabber-area');
    fireEvent(grabber, 'responderGrant', { nativeEvent: { pageY: 100 } });
    fireEvent(grabber, 'responderRelease', { nativeEvent: { pageY: 200 } });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('does not close on a short drag', () => {
    const onClose = jest.fn();
    render(
      <BottomSheet visible onClose={onClose} title="Filters">
        <Text>Content</Text>
      </BottomSheet>,
    );

    const grabber = screen.getByTestId('bottom-sheet-grabber-area');
    fireEvent(grabber, 'responderGrant', { nativeEvent: { pageY: 100 } });
    fireEvent(grabber, 'responderRelease', { nativeEvent: { pageY: 120 } });

    expect(onClose).not.toHaveBeenCalled();
  });

  test('renders content inside a scroll view so a long list is reachable', () => {
    render(
      <BottomSheet visible onClose={() => {}} title="Filters">
        <Text>Content</Text>
      </BottomSheet>,
    );

    expect(screen.UNSAFE_getByType(ScrollView)).toBeTruthy();
  });

  test('renders the optional action and footer', () => {
    render(
      <BottomSheet
        visible
        onClose={() => {}}
        title="Filters"
        action={<Text>Reset</Text>}
        footer={<Text>Apply</Text>}
      >
        <Text>Content</Text>
      </BottomSheet>,
    );

    expect(screen.getByText('Reset')).toBeTruthy();
    expect(screen.getByText('Apply')).toBeTruthy();
  });

  test('pads for the device bottom safe-area inset (e.g. the home indicator), on top of the base sheet padding — only the bottom edge, not top/left/right', () => {
    // The actual inset value is computed natively and isn't observable through a style prop
    // under the test renderer (SafeAreaView renders a native host component whose insets are
    // resolved on the device, not in JS) — so this asserts the sheet requests bottom-only
    // "additive" padding from it, which is what actually produces the fix on a real device.
    render(
      <BottomSheet visible onClose={() => {}} title="Filters">
        <Text>Content</Text>
      </BottomSheet>,
    );

    expect(screen.getByTestId('bottom-sheet').props.edges).toEqual({
      top: 'off',
      right: 'off',
      bottom: 'additive',
      left: 'off',
    });
  });
});
