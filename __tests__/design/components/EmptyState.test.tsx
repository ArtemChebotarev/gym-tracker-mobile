import { EmptyState } from '@design/components/EmptyState';
import { CheckIcon } from '@design/icons/CheckIcon';
import { SPACING } from '@design/tokens';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

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

  describe('framed', () => {
    const renderFramed = (withSecondary: boolean) =>
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
          framed
        />,
      );

    test('puts the icon and the copy on a card, and the buttons outside it', () => {
      renderFramed(true);

      const card = screen.getByTestId('empty-state-card');
      expect(within(card).getByTestId('empty-state-icon')).toBeTruthy();
      expect(within(card).getByText('Plan your first training cycle')).toBeTruthy();
      expect(within(card).queryByRole('button')).toBeNull();
    });

    test('puts the primary action last, nearest the thumb', () => {
      renderFramed(true);

      const [first, last, ...rest] = within(screen.getByTestId('empty-state-actions')).getAllByRole(
        'button',
      );
      expect(rest).toHaveLength(0);
      expect(within(first!).getByText('Build from scratch')).toBeTruthy();
      expect(within(last!).getByText('Start from a template')).toBeTruthy();
    });

    test('pins the actions above the bottom inset', () => {
      renderFramed(false);

      const style = StyleSheet.flatten(screen.getByTestId('empty-state-actions').props.style);
      expect(style.position).toBe('absolute');
      expect(style.bottom).toBe(90 + SPACING['space/screen']);
    });

    test('centres the card in the same room whether one button is under it or two', () => {
      const { unmount } = renderFramed(false);
      const one = StyleSheet.flatten(screen.getByTestId('empty-state').props.style);
      unmount();
      renderFramed(true);
      const two = StyleSheet.flatten(screen.getByTestId('empty-state').props.style);

      expect(one.justifyContent).toBe('center');
      expect(two).toEqual(one);
    });
  });
});
