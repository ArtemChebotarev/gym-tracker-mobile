// The Exercise screen — 08.6 · Библиотека упражнений, "Exercise — вкладка Overview" (task 065).
// A pushed screen: back and `⋯` in the header, then the exercise's name with its muscle-group chip
// in the group's own tint and a `Catalog`/`Custom` badge, then the Overview / History switcher.
//
// Overview answers one question — what did I do last time, before I get under the bar: three
// tiles (Best set, Sessions, Last done), the last completed session's sets, and a row into the
// History tab carrying the two all-time counts. With nothing ever logged, all of it is replaced by
// a line saying so (08.6, "Пустое состояние") — tiles of zeros would be worse than no tiles.
//
// The switcher is the only way into History (08.6: "Единственная точка входа — переключатель
// Overview / History на самом экране Exercise"), and Overview always opens first, from wherever
// the screen was entered — including from a workout, where the last-session block is exactly what
// you came for. So the tab is this component's own state rather than a prop: the screen
// deliberately doesn't remember it ("Экран не запоминает, на какой вкладке был в прошлый раз"),
// and leaving and re-entering remounts it back on Overview. History itself is still the deep
// screen of 06 · History & Analytics, not yet built — its tab says so.
//
// Presentational otherwise: the overview model and what back and `⋯` do come in as props from
// app/exercise/[id]/index.tsx. JSX/rendering only — styles live in ExerciseDetailScreenStyles.ts
// and pure helpers in ExerciseDetailScreenLogic.ts, per the code-style skill.

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Equipment, MuscleGroup } from '@domain/catalog';
import type { ExerciseLastSession, ExerciseOverview } from '@domain/exerciseOverview';
import { Badge } from '@design/components/Badge';
import { EmptyState } from '@design/components/EmptyState';
import { IconButton } from '@design/components/IconButton';
import { ListRow } from '@design/components/ListRow';
import { SegmentedControl } from '@design/components/SegmentedControl';
import { StatTile } from '@design/components/StatTile';
import { BackIcon } from '@design/icons/BackIcon';
import { MoreIcon } from '@design/icons/MoreIcon';
import { getMuscleGroupChipColors } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import { COLORS, ICON_SIZES } from '@design/tokens';

import {
  EXERCISE_DETAIL_TABS,
  formatBestSet,
  formatLastDone,
  formatLastSessionTitle,
  formatMesocyclesUsed,
  formatOverviewSet,
  formatSetsLogged,
  type ExerciseDetailTab,
} from './ExerciseDetailScreenLogic';
import { styles } from './ExerciseDetailScreenStyles';
import { sourceLabel } from './ExerciseLibraryScreenLogic';

export type ExerciseDetailScreenProps = {
  /** `undefined` while it loads, `null` when no such exercise exists. */
  overview: ExerciseOverview | undefined | null;
  isPending: boolean;
  onBack: () => void;
  /** Opens the `⋯` menu (08.6, "Меню и действия"). */
  onOpenMenu: () => void;
};

export function ExerciseDetailScreen({
  overview,
  isPending,
  onBack,
  onOpenMenu,
}: ExerciseDetailScreenProps) {
  const [tab, setTab] = useState<ExerciseDetailTab>('overview');

  if (isPending || !overview) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <IconButton accessibilityLabel="Back" onPress={onBack}>
            <BackIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
          </IconButton>
        </View>
        {isPending ? (
          <Text style={styles.status}>Loading…</Text>
        ) : (
          <EmptyState
            title="Exercise not found"
            description="It isn't in the library any more."
            actionLabel="Go back"
            onAction={onBack}
          />
        )}
      </SafeAreaView>
    );
  }

  const { exercise, stats, lastSession } = overview;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Back" onPress={onBack}>
          <BackIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
        </IconButton>
        <IconButton accessibilityLabel="Exercise menu" onPress={onOpenMenu}>
          <MoreIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
        </IconButton>
      </View>

      <View style={styles.heading}>
        <Text style={styles.title}>{exercise.name}</Text>
        <View style={styles.headingMeta}>
          <GroupChip muscleGroup={exercise.muscleGroup} />
          <Badge label={sourceLabel(exercise.source)} />
        </View>
      </View>

      <SegmentedControl
        options={EXERCISE_DETAIL_TABS}
        value={tab}
        onChange={(value) => setTab(value as ExerciseDetailTab)}
      />

      {tab === 'history' ? (
        <Text style={styles.status}>
          Charts and every session, exercise by exercise, land here next.
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {stats === null ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No sets logged yet</Text>
              <Text style={styles.emptyDescription}>
                Your first workout with this exercise fills this in.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.tiles}>
                <StatTile label="Best set" value={formatBestSet(stats.bestSet)} />
                <StatTile label="Sessions" value={String(stats.sessionCount)} />
                <StatTile label="Last done" value={formatLastDone(stats.lastDoneAt)} />
              </View>

              {lastSession !== null && (
                <LastSessionCard lastSession={lastSession} equipment={exercise.equipment} />
              )}

              <ListRow
                title={formatMesocyclesUsed(stats.mesocycleCount)}
                subtitle={formatSetsLogged(stats.setCount)}
                trailing={{ type: 'chevron' }}
                onPress={() => setTab('history')}
              />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function GroupChip({ muscleGroup }: { muscleGroup: MuscleGroup }) {
  const colors = getMuscleGroupChipColors(muscleGroup);

  return (
    <View
      testID="exercise-group-chip"
      style={[styles.groupChip, { backgroundColor: colors.tint ?? COLORS['surface/card'] }]}
    >
      {colors.dot !== undefined && (
        <View style={[styles.groupDot, { backgroundColor: colors.dot }]} />
      )}
      <Text style={[styles.groupLabel, { color: colors.text ?? COLORS['text/secondary'] }]}>
        {getMuscleGroupLabel(muscleGroup)}
      </Text>
    </View>
  );
}

function LastSessionCard({
  lastSession,
  equipment,
}: {
  lastSession: ExerciseLastSession;
  equipment?: Equipment;
}) {
  return (
    <View testID="exercise-last-session" style={styles.card}>
      <Text style={styles.cardTitle}>{formatLastSessionTitle(lastSession)}</Text>
      {lastSession.setLogs.map((setLog) => (
        <View key={setLog.id} style={styles.setRow}>
          <Text style={styles.setNumber}>{setLog.setNumber}</Text>
          <Text style={styles.setValue}>{formatOverviewSet(setLog, equipment)}</Text>
        </View>
      ))}
    </View>
  );
}
