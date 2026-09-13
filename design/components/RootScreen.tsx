// RootScreen — the shared frame for a root tab screen (Today, Mesocycles, Library). Owns the
// top safe-area inset, the screen padding, and the title row using `type/screen-title` — the
// typography token's own "Где используется" entry in 08.0 · Design SDK is literally "Заголовок
// корневого экрана" (singular: the root screen title), i.e. the same title treatment across all
// three tabs is the documented intent, not a per-screen choice. Every root screen composing its
// own header/SafeAreaView by hand risked the title drifting a few points between tabs the moment
// one of them used a different padding or forgot the safe-area wrap; owning both here means the
// title lands in the exact same place on every tab with no per-screen alignment to get right.
//
// The native per-tab header is hidden (see app/(tabs)/_layout.tsx) specifically so this is the
// only header a root screen shows — see that file's comment for why.

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, SPACING, TYPOGRAPHY } from '../tokens';

export type RootScreenProps = {
  title: string;
  trailing?: ReactNode;
  children?: ReactNode;
};

export function RootScreen({ title, trailing, children }: RootScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {trailing}
      </View>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS['surface/page'],
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: SPACING['space/screen'],
    gap: SPACING['space/gap'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: TYPOGRAPHY['type/screen-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/screen-title'].fontWeight,
    color: COLORS['text/primary'],
  },
});
