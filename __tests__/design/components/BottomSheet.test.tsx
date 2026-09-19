import { BottomSheet } from '@design/components/BottomSheet';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { SPACING } from '@design/tokens';

// initialMetrics makes the provider resolve synchronously instead of waiting on a native
// onLayout that jest's test renderer never fires.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

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

  test('renders the subtitle under the title only when given', () => {
    const { rerender } = render(
      <BottomSheet visible onClose={() => {}} title="Upper/lower">
        <Text>Content</Text>
      </BottomSheet>,
    );
    expect(screen.queryByText('Week 2 of 5 · 4 days a week')).toBeNull();

    rerender(
      <BottomSheet
        visible
        onClose={() => {}}
        title="Upper/lower"
        subtitle="Week 2 of 5 · 4 days a week"
      >
        <Text>Content</Text>
      </BottomSheet>,
    );
    expect(screen.getByText('Week 2 of 5 · 4 days a week')).toBeTruthy();
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

  // Task 102: the inset comes from the root SafeAreaProvider, so it's there on the very first
  // opening — a SafeAreaView inside the Modal got a zero inset until the sheet was reopened.
  test.each(['modal', 'overlay'] as const)(
    '%s presentation: pads its bottom by the root safe-area inset on top of space/sheet',
    (presentation) => {
      render(
        <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
          <BottomSheet visible onClose={() => {}} title="Filters" presentation={presentation}>
            <Text>Content</Text>
          </BottomSheet>
        </SafeAreaProvider>,
      );

      const style = StyleSheet.flatten(screen.getByTestId('bottom-sheet').props.style);
      expect(style.paddingBottom).toBe(SPACING['space/sheet'] + 34);
      expect(style.paddingTop).toBeUndefined();
    },
  );

  test('without a SafeAreaProvider, pads by space/sheet alone', () => {
    render(
      <BottomSheet visible onClose={() => {}} title="Filters">
        <Text>Content</Text>
      </BottomSheet>,
    );

    const style = StyleSheet.flatten(screen.getByTestId('bottom-sheet').props.style);
    expect(style.paddingBottom).toBe(SPACING['space/sheet']);
  });

  // Task 082: a content-sized sheet only caps its height; a fixed one pins it, in both
  // presentations, so live-filtered content can't make the sheet jump.
  test.each(['modal', 'overlay'] as const)(
    '%s presentation: sizes to content by default, with only a max height',
    (presentation) => {
      render(
        <BottomSheet visible onClose={() => {}} title="Filters" presentation={presentation}>
          <Text>Content</Text>
        </BottomSheet>,
      );

      const style = StyleSheet.flatten(screen.getByTestId('bottom-sheet').props.style);
      expect(style.maxHeight).toBe('80%');
      expect(style.height).toBeUndefined();
    },
  );

  test.each(['modal', 'overlay'] as const)(
    '%s presentation: height="fixed" pins the sheet height regardless of content',
    (presentation) => {
      render(
        <BottomSheet
          visible
          onClose={() => {}}
          title="Add exercise"
          presentation={presentation}
          height="fixed"
        >
          <Text>Content</Text>
        </BottomSheet>,
      );

      const style = StyleSheet.flatten(screen.getByTestId('bottom-sheet').props.style);
      expect(style.height).toBe('80%');
    },
  );
});
