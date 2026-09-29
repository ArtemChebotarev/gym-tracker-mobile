import { EmptyState } from '@design/components/EmptyState';
import { CheckIcon } from '@design/icons/CheckIcon';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

describe('EmptyState', () => {
  test('renders the title, description, and action', () => {
    render(
      <EmptyState
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
      <EmptyState title="No exercises" description="Add your first one" actionLabel="Create exercise" onAction={onAction} />,
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

  test('draws no icon circle without one', () => {
    render(<EmptyState title="Nothing" description="Here" actionLabel="Go" onAction={() => {}} />);

    expect(screen.queryByTestId('empty-state-icon')).toBeNull();
  });

  test('fills the room it is given and leaves the bottom inset clear', () => {
    render(
      <EmptyState
        title="Plan"
        description="Here"
        actionLabel="Go"
        onAction={() => {}}
        bottomInset={90}
      />,
    );

    const style = StyleSheet.flatten(screen.getByTestId('empty-state').props.style);
    expect(style.flex).toBe(1);
    expect(style.paddingBottom).toBe(90);
  });
});
