import { EmptyState } from '@design/components/EmptyState';
import { CheckIcon } from '@design/icons/CheckIcon';
import { SPACING, TYPOGRAPHY } from '@design/tokens';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

const UNCOVERED = {
  ref: { current: null },
  onLayout: () => {},
  keyboardOverlap: 0,
  safeAreaShortfall: 0,
};
const mockBottomEdge = jest.fn(() => UNCOVERED);
jest.mock('@design/useBottomEdge', () => ({
  useBottomEdge: () => mockBottomEdge(),
}));

describe('EmptyState', () => {
  test('renders the title, description, and action', () => {
    render(
      <EmptyState
        icon={CheckIcon}
        title='No exercises match "row"'
        description="Try a different search or create it"
        actionLabel='Create "row"'
        onAction={() => {}}
      />,
    );

    expect(screen.getByText('No exercises match "row"')).toBeTruthy();
    expect(screen.getByText('Try a different search or create it')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create "row"' })).toBeTruthy();
  });

  test('always renders the action and calls onAction when pressed', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        icon={CheckIcon}
        title="No exercises"
        description="Add your first one"
        actionLabel="Create exercise"
        onAction={onAction}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Create exercise' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test('draws the icon above the title when given one', () => {
    render(
      <EmptyState
        icon={CheckIcon}
        title="Training cycle complete"
        description="Every workout is done."
        actionLabel="Finish cycle"
        onAction={() => {}}
      />,
    );

    expect(screen.getByTestId('empty-state-icon')).toBeTruthy();
  });

  test('fills the room it is given and leaves the bottom inset clear', () => {
    render(
      <EmptyState
        icon={CheckIcon}
        title="Plan"
        description="Here"
        actionLabel="Go"
        onAction={() => {}}
        bottomInset={90}
      />,
    );

    const style = StyleSheet.flatten(screen.getByTestId('empty-state').props.style);
    expect(style.flex).toBe(1);
    expect(style.paddingBottom).toBe(90 + SPACING['space/empty-lift']);
  });

  describe('layout', () => {
    const renderWith = (withSecondary: boolean) =>
      render(
        <EmptyState
          icon={CheckIcon}
          title="Plan your first training cycle"
          description="Pick your days and exercises, then start."
          actionLabel="Start from a template"
          onAction={() => {}}
          secondaryAction={
            withSecondary ? { label: 'Build from scratch', onPress: () => {} } : undefined
          }
          bottomInset={90}
        />,
      );

    test('keeps the buttons apart from the message, which is set large on the page', () => {
      renderWith(true);

      const message = screen.getByTestId('empty-state-message');
      expect(within(message).getByTestId('empty-state-icon')).toBeTruthy();
      expect(within(message).queryByRole('button')).toBeNull();
      expect(StyleSheet.flatten(message.props.style).backgroundColor).toBeUndefined();
      const title = StyleSheet.flatten(
        screen.getByText('Plan your first training cycle').props.style,
      );
      expect(title.fontSize).toBe(TYPOGRAPHY['type/sheet-title'].fontSize);
      const line = StyleSheet.flatten(
        screen.getByText('Pick your days and exercises, then start.').props.style,
      );
      expect(line.fontSize).toBe(TYPOGRAPHY['type/body'].fontSize);
      expect(line.maxWidth).toBeUndefined();
    });

    test('puts the primary action last, nearest the thumb', () => {
      renderWith(true);

      const [first, last, ...rest] = within(screen.getByTestId('empty-state-actions')).getAllByRole(
        'button',
      );
      expect(rest).toHaveLength(0);
      expect(within(first!).getByText('Build from scratch')).toBeTruthy();
      expect(within(last!).getByText('Start from a template')).toBeTruthy();
    });

    test('pins the actions above the bottom inset', () => {
      renderWith(false);

      const style = StyleSheet.flatten(screen.getByTestId('empty-state-actions').props.style);
      expect(style.position).toBe('absolute');
      expect(style.bottom).toBe(90 + SPACING['space/screen']);
    });

    test('centres the card in the same room whether one button is under it or two', () => {
      const { unmount } = renderWith(false);
      const one = StyleSheet.flatten(screen.getByTestId('empty-state').props.style);
      unmount();
      renderWith(true);
      const two = StyleSheet.flatten(screen.getByTestId('empty-state').props.style);

      expect(one.justifyContent).toBe('center');
      expect(two).toEqual(one);
    });
  });

  describe('what covers the bottom', () => {
    const renderCovered = (edge: { keyboardOverlap: number; safeAreaShortfall: number }) => {
      mockBottomEdge.mockReturnValue({ ref: { current: null }, onLayout: () => {}, ...edge });
      return render(
        <EmptyState
          icon={CheckIcon}
          title='No exercises match "row"'
          description="Check the spelling or add it as a new exercise."
          actionLabel='Create "row"'
          onAction={() => {}}
          bottomInset={90}
        />,
      );
    };

    afterEach(() => mockBottomEdge.mockReturnValue(UNCOVERED));

    test('with the keyboard up, drops the circle and stacks card and button above the keyboard', () => {
      renderCovered({ keyboardOverlap: 300, safeAreaShortfall: 0 });

      expect(screen.queryByTestId('empty-state-icon')).toBeNull();
      const room = StyleSheet.flatten(screen.getByTestId('empty-state').props.style);
      expect(room.justifyContent).toBe('flex-end');
      expect(room.paddingBottom).toBe(300 + SPACING['space/screen']);
      const actions = StyleSheet.flatten(screen.getByTestId('empty-state-actions').props.style);
      expect(actions.position).toBeUndefined();
    });

    test('keeps the actions off the home indicator when the screen reaches it', () => {
      mockBottomEdge.mockReturnValue({
        ref: { current: null },
        onLayout: () => {},
        keyboardOverlap: 0,
        safeAreaShortfall: 34,
      });
      render(
        <EmptyState
          icon={CheckIcon}
          title="Exercise not found"
          description="It isn't in the library any more."
          actionLabel="Go back"
          onAction={() => {}}
        />,
      );

      const actions = StyleSheet.flatten(screen.getByTestId('empty-state-actions').props.style);
      expect(actions.bottom).toBe(34 + SPACING['space/screen']);
    });

    test('lets the tab bar clearance stand when it already clears the home indicator', () => {
      renderCovered({ keyboardOverlap: 0, safeAreaShortfall: 34 });

      const actions = StyleSheet.flatten(screen.getByTestId('empty-state-actions').props.style);
      expect(actions.bottom).toBe(90 + SPACING['space/screen']);
    });
  });
});
