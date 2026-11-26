import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { Snackbar } from '@design/components/Snackbar';
import { DURATIONS } from '@design/tokens';

const SNACKBAR_DURATION_MS = DURATIONS['duration/snackbar'];

describe('Snackbar (GT-270)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('says what happened and offers to take it back', () => {
    render(
      <Snackbar
        message="Days reordered"
        actionLabel="Undo"
        onAction={jest.fn()}
        onHide={jest.fn()}
      />,
    );

    expect(screen.getByText('Days reordered')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeTruthy();
  });

  test('goes away on its own after 5 seconds, not before', () => {
    const onHide = jest.fn();
    render(
      <Snackbar message="Days reordered" actionLabel="Undo" onAction={jest.fn()} onHide={onHide} />,
    );

    act(() => jest.advanceTimersByTime(SNACKBAR_DURATION_MS - 1));
    expect(onHide).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(onHide).toHaveBeenCalledTimes(1);
    expect(SNACKBAR_DURATION_MS).toBe(5000);
  });

  test('its action runs, then it goes away', () => {
    const calls: string[] = [];
    render(
      <Snackbar
        message="Days reordered"
        actionLabel="Undo"
        onAction={() => calls.push('action')}
        onHide={() => calls.push('hide')}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

    expect(calls).toEqual(['action', 'hide']);
  });

  test('a re-render does not restart its clock', () => {
    const onHide = jest.fn();
    const { rerender } = render(
      <Snackbar message="Days reordered" actionLabel="Undo" onAction={jest.fn()} onHide={onHide} />,
    );

    act(() => jest.advanceTimersByTime(3000));
    rerender(
      <Snackbar
        message="Days reordered"
        actionLabel="Undo"
        onAction={jest.fn()}
        onHide={() => onHide()}
      />,
    );
    act(() => jest.advanceTimersByTime(2000));

    expect(onHide).toHaveBeenCalledTimes(1);
  });
});
