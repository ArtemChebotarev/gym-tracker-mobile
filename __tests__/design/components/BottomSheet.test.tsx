import { BottomSheet } from '@design/components/BottomSheet';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

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
});
