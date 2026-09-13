import { Alert } from 'react-native';

import { handleRequestCreate, handleRequestFilters } from '@components/LibraryScreenLogic';

describe('handleRequestCreate', () => {
  test('mentions the prefilled name when one is given', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    handleRequestCreate('Zercher Squat');

    expect(alertSpy).toHaveBeenCalledWith('Coming soon', expect.stringContaining('Zercher Squat'));
  });

  test('falls back to a generic message with no prefilled name', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    handleRequestCreate();

    expect(alertSpy).toHaveBeenCalledWith('Coming soon', expect.stringContaining('a new exercise'));
  });
});

describe('handleRequestFilters', () => {
  test('shows a coming-soon message', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    handleRequestFilters();

    expect(alertSpy).toHaveBeenCalledWith('Coming soon', expect.stringContaining('Filters sheet'));
  });
});
