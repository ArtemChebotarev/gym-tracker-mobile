// "Мезоцикл (деталь)" — 08.9, task 129, laid out after its mockup 08.9-meso-detail.html. A pushed
// screen: back and `⋯` in the header, then the block's name with its `Active` / `Stopped` badge,
// the subtitle for its status, three tiles (Workouts, Sets, Weeks) and the `WEEKLY SETS` card —
// sets per muscle group per week, on the group's category color.
//
// There is no tonnage anywhere (Artem's call, 25.09.2026). `Weeks` always carries its denominator,
// a finished block included: `7 / 7` is the motivation to get there (26.09.2026). `Workouts` of a
// stopped block has none — the weeks after the Stop were never in the plan. Both come decided from
// the domain (055); this screen only draws what it gets.
//
// The workout grid of a closed block is task 130 and not drawn here yet.
//
// A block without a single set replaces the card with a line saying so. It isn't the Design SDK's
// EmptyState, which always renders an action ("EmptyState всегда рендерит действие") and has none
// to offer here — the same call the Exercise screen made (08.6). A block that doesn't exist is an
// EmptyState, whose action is the way back.
//
// Presentational: the detail and what back and the menu do come in as props from
// app/meso/[id].tsx. JSX/rendering only — styles live in MesocycleDetailScreenStyles.ts and pure
// helpers in MesocycleDetailScreenLogic.ts, per the code-style skill.

import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionMenu, type ActionMenuItem } from '@design/components/ActionMenu';
import { Badge } from '@design/components/Badge';
import { EmptyState } from '@design/components/EmptyState';
import { IconButton } from '@design/components/IconButton';
import { StatTile } from '@design/components/StatTile';
import { BackIcon } from '@design/icons/BackIcon';
import { COLORS, ICON_SIZES } from '@design/tokens';
import type { MesoWeeklySetsRow } from '@domain/mesoSummary';
import type { MesocycleDetail } from '@usecases/mesocycleDetail';

import {
  formatMesocycleDetailSubtitle,
  formatSummaryCount,
  mesocycleDetailBadge,
  weekColumnLabels,
  weeklySetsRowViews,
} from './MesocycleDetailScreenLogic';
import { styles } from './MesocycleDetailScreenStyles';

export type MesocycleDetailScreenProps = {
  /** `undefined` while it loads, `null` when no such mesocycle exists. */
  detail: MesocycleDetail | undefined | null;
  isPending: boolean;
  onBack: () => void;
  /** What the header's `⋯` offers — Rename, and Copy for a closed block. */
  menuItems: ActionMenuItem[];
};

export function MesocycleDetailScreen({
  detail,
  isPending,
  onBack,
  menuItems,
}: MesocycleDetailScreenProps) {
  const backButton = (
    <IconButton accessibilityLabel="Back" onPress={onBack}>
      <BackIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
    </IconButton>
  );

  if (isPending || !detail) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>{backButton}</View>
        {isPending ? (
          <Text style={styles.status}>Loading…</Text>
        ) : (
          <EmptyState
            title="Mesocycle not found"
            description="It may have been removed."
            actionLabel="Go back"
            onAction={onBack}
          />
        )}
      </SafeAreaView>
    );
  }

  const { mesocycle, summary, weekNumber } = detail;
  const badge = mesocycleDetailBadge(mesocycle.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {backButton}
        <ActionMenu accessibilityLabel="Mesocycle menu" title={mesocycle.name} items={menuItems} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{mesocycle.name}</Text>
            {badge && <Badge label={badge.label} variant={badge.variant} />}
          </View>
          <Text style={styles.subtitle}>
            {formatMesocycleDetailSubtitle(mesocycle, weekNumber)}
          </Text>
        </View>

        <View style={styles.tiles}>
          <StatTile label="Workouts" {...formatSummaryCount(summary.workouts)} />
          <StatTile label="Sets" value={String(summary.strengthSets)} />
          <StatTile label="Weeks" {...formatSummaryCount(summary.weeks)} />
        </View>

        <View style={styles.block}>
          <Text style={styles.blockLabel}>Weekly sets</Text>
          {summary.weeklySets.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No sets logged in this block</Text>
            </View>
          ) : (
            <WeeklySetsCard rows={summary.weeklySets} lengthWeeks={mesocycle.lengthWeeks} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function WeeklySetsCard({
  rows,
  lengthWeeks,
}: {
  rows: readonly MesoWeeklySetsRow[];
  lengthWeeks: number;
}) {
  return (
    <View testID="weekly-sets" style={styles.card}>
      <View style={styles.volumeRow}>
        <View style={styles.groupColumn} />
        {weekColumnLabels(lengthWeeks).map((label) => (
          <Text key={label} style={styles.weekHeader}>
            {label}
          </Text>
        ))}
      </View>
      {weeklySetsRowViews(rows).map((row) => (
        <View key={row.muscleGroup} style={styles.volumeRow}>
          <View style={[styles.groupColumn, styles.group]}>
            {row.dotColor !== undefined && (
              <View style={[styles.groupDot, { backgroundColor: row.dotColor }]} />
            )}
            <Text style={styles.groupLabel} numberOfLines={1}>
              {row.label}
            </Text>
          </View>
          {row.cells.map((cell) =>
            cell.fill === undefined ? (
              <View key={cell.weekNumber} style={[styles.volumeCell, styles.volumeCellEmpty]}>
                <Text style={styles.volumeCellEmptyLabel}>{cell.label}</Text>
              </View>
            ) : (
              <View
                key={cell.weekNumber}
                style={[styles.volumeCell, { backgroundColor: cell.fill }]}
              >
                <Text style={styles.volumeCellLabel}>{cell.label}</Text>
              </View>
            ),
          )}
        </View>
      ))}
    </View>
  );
}
