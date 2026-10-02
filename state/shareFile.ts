// Writes text to a file in the cache directory and hands it to the system share sheet — AirDrop,
// Files, mail, whatever the phone offers. Shared by the backup (task 070) and the log export
// (task 141.1): on a local-only app this is the only way either leaves the device.
//
// The file goes to the cache directory: it exists to be handed over, and the OS may reclaim it
// afterwards.

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** The device has no share sheet to offer — nothing the user can fix, and not worth a retry. */
export class SharingUnavailableError extends Error {
  constructor() {
    super('Sharing is not available on this device.');
    this.name = 'SharingUnavailableError';
  }
}

export type ShareFileOptions = {
  fileName: string;
  content: string;
  mimeType: string;
  /** Uniform Type Identifier, which iOS wants alongside the MIME type. */
  uti: string;
  dialogTitle: string;
};

export async function shareTextFile({
  fileName,
  content,
  mimeType,
  uti,
  dialogTitle,
}: ShareFileOptions): Promise<void> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(content);

  if (!(await Sharing.isAvailableAsync())) {
    throw new SharingUnavailableError();
  }
  await Sharing.shareAsync(file.uri, { mimeType, UTI: uti, dialogTitle });
}
