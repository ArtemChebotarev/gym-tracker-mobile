// A message that takes the whole screen (task 141.2) — what the app shows when nothing it could
// render is trustworthy: the storage did not open (StorageGate) or a screen threw while rendering
// (AppErrorBoundary). Plain on purpose: it renders above or outside most providers, so it uses no
// context, only the design tokens.

import type { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

import { styles } from './FullScreenMessageStyles';

export type FullScreenMessageProps = PropsWithChildren<{
  title: string;
  description: string;
  testID?: string;
}>;

/** `children` is the way forward, if there is one — a button; without it the user restarts. */
export function FullScreenMessage({
  title,
  description,
  testID,
  children,
}: FullScreenMessageProps) {
  return (
    <View style={styles.screen} testID={testID}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {children !== undefined && <View style={styles.action}>{children}</View>}
    </View>
  );
}
