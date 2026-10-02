import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppErrorBoundary } from '@components/AppErrorBoundary';
import type { LogEntry } from '@domain/logging';
import { setLogSinks } from '@state/logger';

afterEach(() => setLogSinks([]));

describe('AppErrorBoundary', () => {
  test('says the data is safe and offers to try again', () => {
    const retry = jest.fn().mockResolvedValue(undefined);
    render(<AppErrorBoundary error={new Error('render blew up')} retry={retry} />);

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Your data is safe. Try again, or restart the app.')).toBeTruthy();
    // The exception's own text is for the log, not for the user.
    expect(screen.queryByText(/render blew up/)).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  test('writes the cause to the log', () => {
    const written: LogEntry[] = [];
    setLogSinks([{ write: (entry) => written.push(entry) }]);

    render(<AppErrorBoundary error={new Error('render blew up')} retry={jest.fn()} />);

    expect(written).toMatchObject([
      { level: 'error', event: 'render.boundary', message: 'render blew up' },
    ]);
  });
});
