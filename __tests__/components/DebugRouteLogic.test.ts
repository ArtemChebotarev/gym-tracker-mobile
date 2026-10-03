import { exportErrorMessage } from '@components/DebugRouteLogic';
import { SharingUnavailableError } from '@state/shareFile';

describe('exportErrorMessage', () => {
  test('says what to do instead of showing the exception', () => {
    expect(exportErrorMessage(new Error('EACCES: permission denied'), 'data')).toBe(
      "Couldn't export your data. Try again.",
    );
    expect(exportErrorMessage(new Error('x'), 'log')).toBe("Couldn't export your log. Try again.");
  });

  test('a device without a share sheet gets its own words, since trying again will not help', () => {
    expect(exportErrorMessage(new SharingUnavailableError(), 'data')).toBe(
      "Sharing isn't available on this device.",
    );
  });
});
