import { File } from 'expo-file-system';

import { pickBackupFile } from '@state/useImportBackup';

// The hook half needs the migration bundle (.sql modules only Metro transforms); the pick step does not.
jest.mock('@state/backupStore', () => ({ useBackupDeps: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: { pickFileAsync: jest.fn() } }));

const pickFileAsync = File.pickFileAsync as jest.Mock;

describe('pickBackupFile', () => {
  test('is null when the picker is dismissed — not a failure', async () => {
    pickFileAsync.mockResolvedValue({ canceled: true, result: null });

    await expect(pickBackupFile()).resolves.toBeNull();
  });

  test('returns the chosen file name and its text, and asks only for JSON', async () => {
    pickFileAsync.mockResolvedValue({
      canceled: false,
      result: { name: 'hybro-backup-2026-10-12.json', text: async () => '{"kind":"x"}' },
    });

    await expect(pickBackupFile()).resolves.toEqual({
      fileName: 'hybro-backup-2026-10-12.json',
      json: '{"kind":"x"}',
    });
    expect(pickFileAsync).toHaveBeenCalledWith({ mimeTypes: ['application/json'] });
  });
});
