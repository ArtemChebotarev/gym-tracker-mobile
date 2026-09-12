// ListRow — see 08.0 · Design SDK, "Компоненты": title with an optional subtitle, an optional
// badge, and one of two trailing accessories (chevron for navigation, value for a read-only
// fact). Rows are separated by a bottom border rather than each row getting its own full
// border (08.0: "Разделитель между строками, а не рамка вокруг каждой"). The badge is modeled
// as { label, variant? } and rendered through the shared Badge component rather than accepting
// arbitrary children, so every badge in a list stays visually identical to badges elsewhere.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../tokens';
import { Badge, type BadgeVariant } from './Badge';

export type ListRowTrailing = { type: 'chevron' } | { type: 'value'; value: string };

export type ListRowBadge = { label: string; variant?: BadgeVariant };

export type ListRowProps = {
  title: string;
  subtitle?: string;
  badge?: ListRowBadge;
  trailing?: ListRowTrailing;
  onPress?: () => void;
};

export function ListRow({ title, subtitle, badge, trailing, onPress }: ListRowProps) {
  const content = (
    <View style={styles.row}>
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {badge !== undefined && <Badge label={badge.label} variant={badge.variant} />}
      {trailing !== undefined && <Trailing trailing={trailing} />}
    </View>
  );

  if (onPress !== undefined) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

function Trailing({ trailing }: { trailing: ListRowTrailing }) {
  if (trailing.type === 'chevron') {
    return <Text style={styles.chevron}>›</Text>;
  }
  return <Text style={styles.value}>{trailing.value}</Text>;
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS['border/divider'],
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
    paddingVertical: SPACING['space/row'],
  },
  main: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  subtitle: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/faint'],
  },
  chevron: {
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    color: COLORS['text/faint'],
  },
  value: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
  },
});
