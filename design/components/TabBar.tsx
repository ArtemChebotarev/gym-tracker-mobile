// TabBar — see 08.0 · Design SDK, "Таб-бар" (task 151): a floating capsule in the iOS 26 style,
// set in from the screen edges, translucent over a blur. Built for 3 or 4 tabs: every tab is
// `flex: 1` inside the same padded capsule, so adding one never changes another's geometry.
// The active tab is accent (icon and label together, 08.0: "Активная — акцентом, иконка и подпись
// вместе") on its own lighter capsule; the rest are `text/faint`. `icon` is one of the
// design/icons/ components (e.g. `TabTodayIcon`), not a rendered element: TabBar renders it
// itself at `ICON_SIZES['icon/tab']` and in the label's color, because 08.0 ("Иконки") sets an
// icon's state through its parent's color rather than a separate active version of the icon.
// The glass — tint, edge, shadow, blur strength — is tokens; the blur itself is expo-blur.

import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { IconComponent } from '../icons/IconFrame';
import {
  BORDER_WIDTHS,
  COLORS,
  ICON_SIZES,
  OPACITY,
  RADII,
  SHADOWS,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '../tokens';

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
    <View style={styles.outer}>
      <View style={styles.bar}>
        <BlurView
          tint="dark"
          intensity={SIZES['size/glass-blur']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tabs}>
          {items.map((item) => {
            const active = item.key === activeKey;
            const Icon = item.icon;
            const color = active ? COLORS.accent : COLORS['text/faint'];
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                onPress={() => onChange(item.key)}
                style={({ pressed }) => [
                  styles.tab,
                  active && styles.activeTab,
                  pressed && styles.pressed,
                ]}
              >
                <Icon size={ICON_SIZES['icon/tab']} color={color} />
                <Text style={[styles.label, { color }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const CAPTION = TYPOGRAPHY['type/caption'];

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: SPACING['space/screen'],
    paddingBottom: SPACING['space/gap-tight'],
  },
  bar: {
    height: SIZES['size/tabbar'],
    borderRadius: RADII['radius/capsule'],
    overflow: 'hidden',
    backgroundColor: COLORS['glass/fill'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['glass/edge'],
    ...SHADOWS['shadow/tabbar'],
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    padding: SPACING['space/xs'],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['space/xxs'],
    minHeight: SIZES['size/tap-target'],
    borderRadius: RADII['radius/capsule'],
  },
  activeTab: {
    backgroundColor: COLORS['glass/active'],
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  label: {
    fontSize: CAPTION.fontSize,
    fontWeight: CAPTION.fontWeight,
  },
});
