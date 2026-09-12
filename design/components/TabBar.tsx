// TabBar — see 08.0 · Design SDK, "Компоненты": 3 tabs, active tab in accent with icon and
// label together (08.0: "Активная — акцентом, иконка и подпись вместе"). Background reuses
// `surface/raised`, the same "sticky, don't blend during scroll" surface SectionHeader uses
// (08.0: "surface/raised: Липкие заголовки секций, таб-бар"). Like IconButton, the project has
// no icon library yet, so `icon` is caller-supplied — the caller renders an icon that already
// matches the tab's active/inactive look, the same contract IconButton documents for its own
// icon slot. `icon` accepts either a plain node (same icon regardless of state) or a function of
// the active state, so a tab whose icon never changes look doesn't need to write a closure.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../tokens';

export type TabBarItem = {
  key: string;
  label: string;
  icon: ReactNode | ((active: boolean) => ReactNode);
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
        const icon = typeof item.icon === 'function' ? item.icon(active) : item.icon;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            {icon}
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
  pressed: {
    opacity: 0.7,
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
