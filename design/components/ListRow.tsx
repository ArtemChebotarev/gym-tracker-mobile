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
//
// `trailing: { type: 'actions' }` is task 074's pill-plus-`⋯` pair (08.3 · Мезоциклы — список:
// Planned rows get a primary `Start` pill, Completed rows a secondary outlined `Copy` pill, both
// followed by a `⋯` IconButton). These rows are deliberately not tappable as a whole — 08.3 moved
// away from row taps because they competed with the adjacent action — so each accessory owns its
// own press handler instead of the row's `onPress`. Both carry the row title in their accessibility
// label so several rows' `Start`/`⋯` buttons stay distinguishable to a screen reader.
//
// `titleSuffix` is task 081's secondary qualifier on the title line (`Bench Press · Dumbbell`),
// for rows whose titles alone collide. Rendered as a sibling Text in `text/faint` — the subtitle's
// color at the title's size — rather than nested inside the title Text, so the title keeps its own
// text node (and exact-match lookups) and truncates first while the short suffix stays whole.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { square } from '../shapes';
import { Badge, type BadgeVariant } from './Badge';
import { IconButton } from './IconButton';

export type ListRowActionVariant = 'primary' | 'secondary';

export type ListRowTrailing =
  | { type: 'chevron' }
  | { type: 'value'; value: string }
  | {
      type: 'actions';
      actionLabel: string;
      actionVariant: ListRowActionVariant;
      onAction: () => void;
      onMenu: () => void;
    };

export type ListRowLeading = { type: 'checkbox'; checked: boolean };

export type ListRowBadge = { label: string; variant?: BadgeVariant };

export type ListRowProps = {
  title: string;
  titleSuffix?: string;
  subtitle?: string;
  leading?: ListRowLeading;
  badge?: ListRowBadge;
  trailing?: ListRowTrailing;
  onPress?: () => void;
};

export function ListRow({
  title,
  titleSuffix,
  subtitle,   leading,
  badge,
  trailing,
  onPress,
}: ListRowProps) {
  const content = (
    <View style={styles.row}>
      {leading !== undefined && <Leading leading={leading} />}
      <View style={styles.main}>
        <View style={styles.titleLine}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {titleSuffix !== undefined && (
            <Text style={styles.titleSuffix} numberOfLines={1}>
              {` · ${titleSuffix}`}
            </Text>
          )}
        </View>
        {subtitle !== undefined && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {badge !== undefined && <Badge label={badge.label} variant={badge.variant} />}
      {trailing !== undefined && <Trailing title={title} trailing={trailing} />}
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

function Trailing({ title, trailing }: { title: string; trailing: ListRowTrailing }) {
  if (trailing.type === 'chevron') {
    return <Text style={styles.chevron}>›</Text>;
  }
  if (trailing.type === 'value') {
    return <Text style={styles.value}>{trailing.value}</Text>;
  }
  const isPrimary = trailing.actionVariant === 'primary';
  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${trailing.actionLabel} ${title}`}
        onPress={trailing.onAction}
        style={({ pressed }) => [
          styles.pill,
          isPrimary ? styles.pillPrimary : styles.pillSecondary,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.pillLabel,
            isPrimary ? styles.pillLabelPrimary : styles.pillLabelSecondary,
          ]}
        >
          {trailing.actionLabel}
        </Text>
      </Pressable>
      <IconButton accessibilityLabel={`More actions for ${title}`} onPress={trailing.onMenu}>
        <Text style={styles.menuIcon}>⋯</Text>
      </IconButton>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    borderBottomWidth: BORDER_WIDTHS['border/default'],
    borderBottomColor: COLORS['border/divider'],
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
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
  titleLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  title: {
    flexShrink: 1,
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  titleSuffix: {
    flexShrink: 0,
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/faint'],
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
    ...square(SIZES['size/checkbox']),
    borderRadius: RADII['radius/small'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
  },
  pill: {
    borderRadius: RADII['radius/pill'],
    borderWidth: BORDER_WIDTHS['border/default'],
    paddingHorizontal: SPACING['space/row'],
    paddingVertical: SPACING['space/gap-tight'],
  },
  pillPrimary: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  pillSecondary: {
    borderColor: COLORS['border/default'],
  },
  pillLabel: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
  },
  pillLabelPrimary: {
    color: COLORS['accent/on'],
  },
  pillLabelSecondary: {
    color: COLORS['text/secondary'],
  },
  menuIcon: {
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    color: COLORS['text/secondary'],
  },
  checkmark: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['accent/on'],
  },
});
