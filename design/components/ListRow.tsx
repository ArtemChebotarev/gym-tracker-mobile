// ListRow — see 08.0 · Design SDK, "Компоненты": title with an optional subtitle, an optional
// badge, and one of two trailing accessories (chevron for navigation, value for a read-only
// fact). Rows are separated by a bottom border rather than each row getting its own full
// border (08.0: "Разделитель между строками, а не рамка вокруг каждой"). The badge is modeled
// as { label, variant? } and rendered through the shared Badge component rather than accepting
// arbitrary children, so every badge in a list stays visually identical to badges elsewhere.
//
// `leading` adds a checkbox accessory ahead of the title (task 077's "Add exercise" sheet,
// 08.5 · Редактор мезоцикла — Flow A, "Шаг 2a": "чекбокс слева у каждой строки вместо перехода в
// деталь"). Modeled as a discriminated union of one variant, the same shape as `trailing`, so a
// future second leading accessory slots in the same way rather than this becoming a bag of
// unrelated boolean props. A checkbox row's whole row is the tap target and toggles via the same
// `onPress` chevron rows use for navigation — only the accessibility role/state differs, since a
// checkbox row selects rather than navigates. No component for this exists yet in 08.0's table
// (it predates task 077), so this stays a leading accessory on ListRow rather than a new
// `Checkbox` design/components file.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../tokens';
import { Badge, type BadgeVariant } from './Badge';

export type ListRowTrailing = { type: 'chevron' } | { type: 'value'; value: string };

export type ListRowLeading = { type: 'checkbox'; checked: boolean };

export type ListRowBadge = { label: string; variant?: BadgeVariant };

export type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: ListRowLeading;
  badge?: ListRowBadge;
  trailing?: ListRowTrailing;
  onPress?: () => void;
};

export function ListRow({ title, subtitle, leading, badge, trailing, onPress }: ListRowProps) {
  const content = (
    <View style={styles.row}>
      {leading !== undefined && <Leading leading={leading} />}
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
        accessibilityRole={leading?.type === 'checkbox' ? 'checkbox' : 'button'}
        accessibilityLabel={title}
        accessibilityState={leading?.type === 'checkbox' ? { checked: leading.checked } : undefined}
        onPress={onPress}
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

function Leading({ leading }: { leading: ListRowLeading }) {
  return (
    <View style={[styles.checkbox, leading.checked && styles.checkboxChecked]}>
      {leading.checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );
}

function Trailing({ trailing }: { trailing: ListRowTrailing }) {
  if (trailing.type === 'chevron') {
    return <Text style={styles.chevron}>›</Text>;
  }
  return <Text style={styles.value}>{trailing.value}</Text>;
}

// No token exists yet for a checkbox's own size/corner radius — same exception
// design/components/IconButton.tsx takes for its DIAMETER.
const CHECKBOX_SIZE = 20;
const CHECKBOX_BORDER_WIDTH = 1;
const CHECKBOX_RADIUS = 4;

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
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: CHECKBOX_RADIUS,
    borderWidth: CHECKBOX_BORDER_WIDTH,
    borderColor: COLORS['border/default'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  checkmark: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['accent/on'],
  },
});
