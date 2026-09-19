// TabBar — see 08.0 · Design SDK, "Компоненты": 3 tabs, active tab in accent with icon and
// label together (08.0: "Активная — акцентом, иконка и подпись вместе"). Background reuses
// `surface/raised`, the same "sticky, don't blend during scroll" surface SectionHeader uses
// (08.0: "surface/raised: Липкие заголовки секций, таб-бар"). `icon` is one of the design/icons/
// components (e.g. `TabTodayIcon`), not a rendered element: TabBar renders it itself at
// `ICON_SIZES['icon/tab']` and in the same color as the label — `accent` when active,
// `text/faint` when not — because 08.0 ("Иконки") sets an icon's state through its parent's
// color rather than a separate active version of the icon.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { IconComponent } from '../icons/IconFrame';
import { COLORS, ICON_SIZES, OPACITY, SPACING, TYPOGRAPHY } from '../tokens';

export type TabBarItem = {
  key: string;
  label: string;
  icon: IconComponent;
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
        const Icon = item.icon;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <Icon size={ICON_SIZES['icon/tab']} color={active ? COLORS.accent : COLORS['text/faint']} />
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
    opacity: OPACITY['opacity/pressed'],
  },
  activeLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS.accent,
  },
  inactiveLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/faint'],
  },
});
