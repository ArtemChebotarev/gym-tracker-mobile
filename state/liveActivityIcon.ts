import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';

// The app's icon on the interval timer's Live Activity (canvas 2.6, GT-99) — the icon every app's
// Live Activity carries, not a drawing of one (Artem, 20.10.2026).
//
// The activity is drawn by the widget extension, which can't read the app's bundled assets: it
// reads files from the App Group's shared directory (expo-widgets' `widgetsDirectory`). So the
// icon — the app icon at 84 px, 28 pt at 3× — is copied there once, and the activity is handed
// its path.

const ICON = require('../assets/live-activity-icon.png');
const FILE_NAME = 'live-activity-icon.png';

/**
 * The icon's file in the shared directory, as a `file://` URI — copied there on the first call.
 * `undefined` where there is no shared directory (no App Group: a build without widgets) or the
 * copy failed: the activity then goes without it.
 */
export async function liveActivityIconUri(): Promise<string | undefined> {
  if (!widgetsDirectory) {
    return undefined;
  }
  try {
    const target = new File(widgetsDirectory, FILE_NAME);
    if (!target.exists) {
      const asset = await Asset.fromModule(ICON).downloadAsync();
      if (asset.localUri === null) {
        return undefined;
      }
      new File(asset.localUri).copy(target);
    }
    return target.uri;
  } catch {
    return undefined;
  }
}
