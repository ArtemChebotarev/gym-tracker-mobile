import { EmptyState } from '@design/components/EmptyState';
import { fireEvent, render, screen } from '@testing-library/react-native';

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
});
