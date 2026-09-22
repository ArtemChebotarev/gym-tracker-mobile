// The Exercise screen — 08.6 · Библиотека упражнений, "Exercise — вкладка Overview" (task 065),
// laid out after its mockup 02-exercise-detail.html. A pushed screen: back and `⋯` in the header,
// then the exercise's name with its muscle-group chip in the group's own tint and a
// `Catalog`/`Custom` badge, then the Overview / History switcher.
//
// Overview answers one question — what did I do last time, before I get under the bar: three
// tiles (Best set, Sessions, Last done), the last completed session set by set, then `Earlier` —
// the few sessions before it as one line each, heaviest set and how many sets, which is where you
// see the weight actually moving. `See full history` under them goes to the History tab for the
// rest (ExerciseHistoryTab, task 108). With nothing ever logged, both tabs are replaced by a line
// saying so (08.6, "Пустое состояние") — tiles of zeros would be worse than no tiles, and with no
// set logged there is no history either.
//
// The switcher is the only way into History (08.6: "Единственная точка входа — переключатель
// Overview / History на самом экране Exercise"), and Overview always opens first, from wherever
// the screen was entered — including from a workout, where the last-session block is exactly what
// you came for. So the tab is this component's own state rather than a prop: the screen
// deliberately doesn't remember it ("Экран не запоминает, на какой вкладке был в прошлый раз"),
// and leaving and re-entering remounts it back on Overview. `onTabChange` only reports the switch
// outward, so the route can start loading the history the first time it's actually asked for —
// the tab still belongs to this component.
//
// Presentational otherwise: the overview model and what back and `⋯` do come in as props from
// app/exercise/[id]/index.tsx. JSX/rendering only — styles live in ExerciseDetailScreenStyles.ts
// and pure helpers in ExerciseDetailScreenLogic.ts, per the code-style skill.

import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Equipment, MuscleGroup } from '@domain/catalog';
import type { ExerciseHistoryMesocycle } from '@domain/exerciseHistory';
import type {
  ExerciseLastSession,
  ExerciseOverview,
  ExerciseSessionSummary,
} from '@domain/exerciseOverview';
import { Badge } from '@design/components/Badge';
import { EmptyState } from '@design/components/EmptyState';
import { ActionMenu, type ActionMenuItem } from '@design/components/ActionMenu';
import { IconButton } from '@design/components/IconButton';
import { SegmentedControl } from '@design/components/SegmentedControl';
import { StatTile } from '@design/components/StatTile';
import { BackIcon } from '@design/icons/BackIcon';
import { getMuscleGroupChipColors } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import { COLORS, ICON_SIZES } from '@design/tokens';

import { ExerciseDetailCard, ExerciseDetailCardRow } from './ExerciseDetailCard';
import {
  EXERCISE_DETAIL_TABS,
  formatBestSet,
  formatEarlierSessionLabel,
  formatEarlierSessionTail,
  formatEarlierSessionValue,
  formatLastDone,
  formatLastSessionMeta,
  formatSetLabel,
  formatSetRirTail,
  formatSetValue,
  type ExerciseDetailTab,
} from './ExerciseDetailScreenLogic';
import { styles } from './ExerciseDetailScreenStyles';
import { ExerciseHistoryTab } from './ExerciseHistoryTab';
import { sourceLabel } from './ExerciseLibraryScreenLogic';

export type ExerciseDetailScreenProps = {
  /** `undefined` while it loads, `null` when no such exercise exists. */
  overview: ExerciseOverview | undefined | null;
  isPending: boolean;
  /** The History tab's list — `undefined` until the caller starts loading it. */
  history: ExerciseHistoryMesocycle[] | undefined;
  isHistoryPending: boolean;
  onBack: () => void;
  /** Opens the `⋯` menu (08.6, "Меню и действия"). */
  /**
   * What the screen's `⋯` offers (08.6, "Меню и действия"). The menu opens out of the button
   * itself (117), so the screen holds the actions rather than an `onOpenMenu` that raised a sheet.
   */
  menuItems: ActionMenuItem[];
  /** The tab was switched — the caller loads the history the first time it's History. */
  onTabChange?: (tab: ExerciseDetailTab) => void;
};

export function ExerciseDetailScreen({
  overview,
  isPending,
  history,
  isHistoryPending,
  onBack,
  menuItems,
  onTabChange,
}: ExerciseDetailScreenProps) {
  const [tab, setTab] = useState<ExerciseDetailTab>('overview');

  function openTab(next: ExerciseDetailTab) {
    setTab(next);
    onTabChange?.(next);
  }

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

  const { exercise, stats, lastSession, earlierSessions } = overview;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Back" onPress={onBack}>
          <BackIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
        </IconButton>
        <ActionMenu
          accessibilityLabel="Exercise menu"
          title={exercise.name}
          items={menuItems}
        />
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
        onChange={(value) => openTab(value as ExerciseDetailTab)}
      />

      {stats === null ? (
        // No set ever logged: there are no tiles to show and no history to show either, so the
        // same line answers both tabs (08.6, "Пустое состояние").
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No sets logged yet</Text>
          <Text style={styles.emptyDescription}>
            Your first workout with this exercise fills this in.
          </Text>
        </View>
      ) : tab === 'history' ? (
        <ExerciseHistoryTab
          groups={history}
          isPending={isHistoryPending}
          equipment={exercise.equipment}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.tiles}>
            <StatTile label="Best set" value={formatBestSet(stats.bestSet)} />
            <StatTile label="Sessions" value={String(stats.sessionCount)} />
            <StatTile label="Last done" value={formatLastDone(stats.lastDoneAt)} />
          </View>

          {lastSession !== null && (
            <LastSessionBlock lastSession={lastSession} equipment={exercise.equipment} />
          )}

          {earlierSessions.length > 0 && <EarlierBlock sessions={earlierSessions} />}

          <Pressable
            accessibilityRole="button"
            onPress={() => openTab('history')}
            style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
          >
            <Text style={styles.linkLabel}>See full history</Text>
          </Pressable>
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

function LastSessionBlock({
  lastSession,
  equipment,
}: {
  lastSession: ExerciseLastSession;
  equipment?: Equipment;
}) {
  return (
    <ExerciseDetailCard
      testID="exercise-last-session"
      label="Last session"
      meta={formatLastSessionMeta(lastSession)}
    >
      {lastSession.setLogs.map((setLog, index) => (
        <ExerciseDetailCardRow
          key={setLog.id}
          label={formatSetLabel(setLog)}
          labelTone="counter"
          value={formatSetValue(setLog, equipment)}
          tail={formatSetRirTail(setLog)}
          isLast={index === lastSession.setLogs.length - 1}
        />
      ))}
    </ExerciseDetailCard>
  );
}

function EarlierBlock({ sessions }: { sessions: ExerciseSessionSummary[] }) {
  return (
    <ExerciseDetailCard testID="exercise-earlier-sessions" label="Earlier">
      {sessions.map((session, index) => (
        <ExerciseDetailCardRow
          key={`${session.completedAt}-${session.weekNumber}-${session.dayNumber}`}
          label={formatEarlierSessionLabel(session)}
          labelTone="fact"
          value={formatEarlierSessionValue(session)}
          tail={formatEarlierSessionTail(session)}
          isLast={index === sessions.length - 1}
        />
      ))}
    </ExerciseDetailCard>
  );
}
