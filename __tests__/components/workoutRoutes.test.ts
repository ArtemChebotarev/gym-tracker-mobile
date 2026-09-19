import { workoutHref } from '@components/workoutRoutes';

describe('workoutRoutes', () => {
  test('workoutHref opens the session inside the Today tab', () => {
    expect(workoutHref('session-1')).toEqual({
      pathname: '/',
      params: { sessionId: 'session-1' },
    });
  });
});
