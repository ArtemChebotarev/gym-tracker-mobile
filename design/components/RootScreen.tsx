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
//
// The optional title parts exist for the workout screen's header (08.7 · Тренировка, "Шапка",
// shown by the Today tab): a faint `titleSuffix` in the same `type/screen-title` line (`Week 6` +
// `Day 2`), a `titleAccessory` right after the title (the completed check), and a `subtitle` line
// under it. They stay generic — the caller resolves their content.

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, SPACING, TYPOGRAPHY } from '../tokens';

export type RootScreenProps = {
  title: string;
  /** Rendered after `title` in the same line, in `text/faint`. */
  titleSuffix?: string;
  /** Rendered right after the title line, e.g. a status mark. */
  titleAccessory?: ReactNode;
  /** A secondary line under the title. */
  subtitle?: string;
  trailing?: ReactNode;
  children?: ReactNode;
};

export function RootScreen({
  title,
  titleSuffix,
  titleAccessory,
  subtitle,
  trailing,
  children,
}: RootScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {title}
              {titleSuffix !== undefined && (
                <Text style={styles.titleSuffix}>{` ${titleSuffix}`}</Text>
              )}
            </Text>
            {titleAccessory}
          </View>
          {subtitle !== undefined && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
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
    gap: SPACING['space/gap'],
  },
  heading: {
    flexShrink: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
  },
  title: {
    flexShrink: 1,
    fontSize: TYPOGRAPHY['type/screen-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/screen-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  titleSuffix: {
    color: COLORS['text/faint'],
  },
  subtitle: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/muted'],
  },
});
