import { workoutHref } from '@components/workoutRoutes';

describe('workoutRoutes', () => {
  test('workoutHref points at workout/[sessionId] with the session id', () => {
    expect(workoutHref('session-1')).toEqual({
      pathname: '/workout/[sessionId]',
      params: { sessionId: 'session-1' },
    });
  });
});
