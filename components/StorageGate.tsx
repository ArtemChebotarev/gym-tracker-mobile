// The gate every screen renders behind (task 111). Storage is a file now, and opening and
// migrating it takes time no render can wait for — so nothing that reads data is mounted until
// it is ready. A screen that mounted earlier would not show "loading": it would show an empty
// library and no mesocycles, which is what the app looks like when there is genuinely nothing,
// and the user cannot tell the two apart.
//
// The native splash is held for the whole wait (`preventAutoHideAsync`) and let go only once the
// bootstrap has settled, so the wait looks like the app starting rather than like a blank screen
// with a spinner on it. The spinner underneath is what shows if the wait outlasts the splash —
// on a reload in development, or behind a splash the OS has already dismissed.
//
// It is also where the repository set enters the tree (task 115): the gate already owns the
// bootstrap's result and already refuses to mount anything until it has one, so it is the one
// place that can hand storage down knowing it exists. Nothing below reaches storage any other
// way — `useRepositories` has no fallback.
//
// A failure is terminal by design: no retry button, and no error text. `StorageUnavailable` means
// the database cannot be opened or migrated (07 · Persistence Layer Contract, rule 5; the
// "written by a newer build" refusal of 069), and there is nothing the user could do about it
// from inside the app — a second attempt fails the same way. Restarting is the honest advice.

import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type PropsWithChildren } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { COLORS } from '@design/tokens';
import { RepositoriesProvider } from '@state/repositories';
import { useStorageBootstrap } from '@state/useStorageBootstrap';

import { styles } from './StorageGateStyles';

// Module scope, not an effect: the splash has to be claimed before React renders anything, which
// is already too late once a component's effect runs. Both calls swallow their rejection, which
// only ever means the splash was gone before we asked — on a reload in development, say. Nothing
// to do about it, and an unhandled rejection at startup is worse than no splash.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function StorageGate({ children }: PropsWithChildren) {
  const bootstrap = useStorageBootstrap();
  const { status } = bootstrap;

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [status]);

  if (bootstrap.status === 'loading') {
    return (
      <View style={styles.screen} testID="storage-gate-loading">
        <ActivityIndicator color={COLORS['text/secondary']} />
      </View>
    );
  }

  if (bootstrap.status === 'failed') {
    return (
      <View style={styles.screen} testID="storage-gate-error">
        <Text style={styles.title}>Can’t open your data</Text>
        <Text style={styles.description}>Please restart the app.</Text>
      </View>
    );
  }

  return <RepositoriesProvider repositories={bootstrap.repositories}>{children}</RepositoriesProvider>;
}
