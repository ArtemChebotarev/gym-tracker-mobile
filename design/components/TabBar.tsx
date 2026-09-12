// TabBar — see 08.0 · Design SDK, "Компоненты": 3 tabs, active tab in accent with icon and
// label together (08.0: "Активная — акцентом, иконка и подпись вместе"). Background reuses
// `surface/raised`, the same "sticky, don't blend during scroll" surface SectionHeader uses
// (08.0: "surface/raised: Липкие заголовки секций, таб-бар"). Like IconButton, the project has
// no icon library yet, so `icon` is a render function of the active state — the caller supplies
// an icon that already matches the tab's active/inactive look, the same contract IconButton
// documents for its own icon slot.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../tokens';

export type TabBarItem = {
  key: string;
  label: string;
  icon: (active: boolean) => ReactNode;
};

export type TabBarProps = {
  items: readonly TabBarItem[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function TabBar({ items, activeKey, onChange }: TabBarProps) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            style={styles.tab}
          >
            {item.icon(active)}
            <Text style={active ? styles.activeLabel : styles.inactiveLabel}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS['surface/raised'],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['space/gap-tight'],
    paddingVertical: SPACING['space/row'],
  },
  activeLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS.accent,
  },
  inactiveLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/muted'],
  },
});
