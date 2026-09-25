import {
  armMenuDismissGuard,
  consumeMenuDismissPress,
  disarmMenuDismissGuard,
} from '@design/menuDismissGuard';

beforeEach(() => {
  disarmMenuDismissGuard();
});

describe('menuDismissGuard', () => {
  test('swallows the first press after a menu opened, and only the first', () => {
    armMenuDismissGuard();

    expect(consumeMenuDismissPress()).toBe(true);
    expect(consumeMenuDismissPress()).toBe(false);
  });

  test('with no menu opened, a press is the caller’s own', () => {
    expect(consumeMenuDismissPress()).toBe(false);
  });

  test('a menu closed on its own terms leaves no press to swallow', () => {
    armMenuDismissGuard();
    disarmMenuDismissGuard();

    expect(consumeMenuDismissPress()).toBe(false);
  });

  // The state is module-wide on purpose: the tap that closes a menu lands wherever the finger is,
  // which is rarely the row the menu came out of.
  test('arming twice still swallows one press', () => {
    armMenuDismissGuard();
    armMenuDismissGuard();

    expect(consumeMenuDismissPress()).toBe(true);
    expect(consumeMenuDismissPress()).toBe(false);
  });
});
