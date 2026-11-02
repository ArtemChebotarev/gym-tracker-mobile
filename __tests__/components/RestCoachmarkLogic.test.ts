import { restCoachmarkCopy } from '@components/RestCoachmarkLogic';
import { restNotificationsView } from '@components/RestNotificationsSectionLogic';

const said = (status: Parameters<typeof restCoachmarkCopy>[0]) =>
  restCoachmarkCopy(status)
    .paragraph.map((part) => (typeof part === 'string' ? part : 'strong' in part ? part.strong : ''))
    .join('');

describe('restCoachmarkCopy', () => {
  test('not asked yet, it offers the notification', () => {
    expect(said('undetermined')).toBe(
      'Change the time or turn it off in Settings. Want a notification when rest ends, even with your phone locked?',
    );
    expect(restCoachmarkCopy('undetermined')).toMatchObject({
      primaryLabel: 'Turn on',
      secondaryLabel: 'Not now',
    });
  });

  test('allowed, it only says where the settings are', () => {
    expect(said('granted')).toBe('Change the time or turn it off in Settings.');
    expect(restCoachmarkCopy('granted').primaryLabel).toBe('Got it');
    expect(restCoachmarkCopy('granted').secondaryLabel).toBeUndefined();
  });

  test('refused, it says the signal stays in the app', () => {
    expect(said('denied')).toBe(
      "Change the time or turn it off in Settings. Notifications are off, so you'll hear it only in the app.",
    );
    expect(restCoachmarkCopy('denied').primaryLabel).toBe('Got it');
    expect(restCoachmarkCopy('denied').secondaryLabel).toBeUndefined();
  });
});

describe('restNotificationsView', () => {
  test.each([
    ['undetermined', false, 'plate'],
    ['denied', false, 'plate'],
    ['undetermined', true, 'off'],
    ['denied', true, 'off'],
    ['granted', false, 'on'],
    ['granted', true, 'on'],
  ] as const)('%s, plate hidden %s: %s', (status, hidden, view) => {
    expect(restNotificationsView(status, hidden)).toBe(view);
  });
});
