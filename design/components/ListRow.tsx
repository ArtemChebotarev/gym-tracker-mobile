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
// `trailing: { type: 'actions' }` is the pill-plus-`⋯` pair from task 074, as 117 left it: the
// pill is the row's one primary action (08.3's `Start` on a Planned mesocycle) and the `⋯` is an
// `ActionMenu` — the same native menu every other `⋯` in the app opens, never a sheet this row
// rolls itself. Both halves are optional: a row can carry only a menu (08.3's Completed rows,
// whose Copy lives in it). The menu is described rather than passed in as a rendered element, so
// a row cannot quietly get a different kind of `⋯` than the rest of the app; its trigger is
// labeled and its sheet titled from the row's own title, which also keeps several rows' menus
// apart for a screen reader.
//
// An `actions` row may also be tappable. Then the row's own content — leading, title, badge — is
// the tap target and the accessories sit *outside* it, rather than the whole row being pressable
// with buttons nested inside it: 08.3 wants a tap on a Planned row to open the editor and a tap
// on its `Start` to start the block, and one press region containing another is how a tap lands
// on both (the `⋯` is a native menu hosted in its own view, which would open *and* navigate).
// Every other row keeps the whole-row Pressable it had.
//
// `titleSuffix` is task 081's secondary qualifier on the title line (`Bench Press · Dumbbell`),
// for rows whose titles alone collide. Rendered as a sibling Text in `text/faint` — the subtitle's
// color at the title's size — rather than nested inside the title Text, so the title keeps its own
// text node (and exact-match lookups) and truncates first while the short suffix stays whole.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { square, tapTargetSlop } from '../shapes';
import { ActionMenu, type ActionMenuItem } from './ActionMenu';
import { Badge, type BadgeVariant } from './Badge';

export type ListRowActionVariant = 'primary' | 'secondary';

/** The row's primary action, drawn as a pill beside it. */
export type ListRowAction = {
  label: string;
  variant: ListRowActionVariant;
  onPress: () => void;
};

/** The row's `⋯` — an ActionMenu built from these items. */
export type ListRowMenu = {
  items: ActionMenuItem[];
  /** Names the menu and its items in tests; rows of one list pass something that tells them apart. */
  testID?: string;
};

export type ListRowTrailing =
  | { type: 'chevron' }
  | { type: 'value'; value: string }
  | { type: 'actions'; action?: ListRowAction; menu?: ListRowMenu };

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
  subtitle,
  leading,
  badge,
  trailing,
  onPress,
}: ListRowProps) {
  const body = (
    <>
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
      {badge !== undefined && (
        // Badge pins itself to the top (alignSelf), which in this row would leave it riding above
        // the pill and `⋯` beside it; the wrapper takes the row's own centring instead, the same
        // way the workout header wraps its Deload badge.
        <View>
          <Badge label={badge.label} variant={badge.variant} />
        </View>
      )}
    </>
  );

  const accessibility = {
    accessibilityRole: leading?.type === 'checkbox' ? ('checkbox' as const) : ('button' as const),
    accessibilityLabel: title,
    accessibilityState:
      leading?.type === 'checkbox' ? { checked: leading.checked } : undefined,
  };

  // An actions row keeps its accessories out of the tap target — see the note at the top.
  if (trailing?.type === 'actions') {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          {onPress === undefined ? (
            <View style={styles.body}>{body}</View>
          ) : (
            <Pressable
              {...accessibility}
              onPress={onPress}
              style={({ pressed }) => [styles.body, pressed && styles.pressed]}
            >
              {body}
            </Pressable>
          )}
          <Trailing title={title} trailing={trailing} />
        </View>
      </View>
    );
  }

  const content = (
    <View style={styles.row}>
      {body}
      {trailing !== undefined && <Trailing title={title} trailing={trailing} />}
    </View>
  );

  if (onPress !== undefined) {
    return (
      <Pressable
        {...accessibility}
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
  return (
    <View style={styles.actions}>
      {trailing.action !== undefined && <ActionPill title={title} action={trailing.action} />}
      {trailing.menu !== undefined && (
        <ActionMenu
          testID={trailing.menu.testID}
          accessibilityLabel={`More actions for ${title}`}
          title={title}
          items={trailing.menu.items}
        />
      )}
    </View>
  );
}

function ActionPill({ title, action }: { title: string; action: ListRowAction }) {
  const isPrimary = action.variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${action.label} ${title}`}
      onPress={action.onPress}
      hitSlop={tapTargetSlop(SIZES['size/pill'])}
      style={({ pressed }) => [
        styles.pill,
        isPrimary ? styles.pillPrimary : styles.pillSecondary,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.pillLabel, isPrimary ? styles.pillLabelPrimary : styles.pillLabelSecondary]}
      >
        {action.label}
      </Text>
    </Pressable>
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
  // The tap target of an actions row: everything but the accessories, laid out as the row itself
  // is so nothing moves when a row becomes tappable.
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
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
  // A step under the title (Subheadline under Body), so the two lines don't read as one size.
  subtitle: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
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
    height: SIZES['size/pill'],
    justifyContent: 'center',
    borderRadius: RADII['radius/pill'],
    borderWidth: BORDER_WIDTHS['border/default'],
    paddingHorizontal: SPACING['space/row'],
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
  checkmark: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['accent/on'],
  },
});
