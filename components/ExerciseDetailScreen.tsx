// The Exercise screen — 08.6 · Библиотека упражнений, "Exercise — вкладка Overview" (task 065),
// laid out after its mockup 02-exercise-detail.html. A pushed screen: back and `⋯` in the header,
// then the exercise's name with its muscle-group chip in the group's own tint and a
// `Catalog`/`Custom` badge, then the Overview / History switcher.
//
// Overview answers one question — what did I do last time, before I get under the bar: three
// tiles (Best set, Sessions, Last done), the last completed session set by set, then `Earlier` —
// the few sessions before it as one line each, heaviest set and how many sets, which is where you
// see the weight actually moving. `See full history` under them goes to the History tab for the
// rest. With nothing ever logged, all of it is replaced by a line saying so (08.6, "Пустое
// состояние") — tiles of zeros would be worse than no tiles.
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

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Equipment, MuscleGroup } from '@domain/catalog';
import type {
  ExerciseLastSession,
  ExerciseOverview,
  ExerciseSessionSummary,
} from '@domain/exerciseOverview';
import { Badge } from '@design/components/Badge';
import { EmptyState } from '@design/components/EmptyState';
import { IconButton } from '@design/components/IconButton';
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

  const { exercise, stats, lastSession, earlierSessions } = overview;

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

              {lastSession !== null && <LastSessionBlock
                lastSession={lastSession}
                equipment={exercise.equipment}
              />}

              {earlierSessions.length > 0 && <EarlierBlock sessions={earlierSessions} />}

              <Pressable
                accessibilityRole="button"
                onPress={() => setTab('history')}
                style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
              >
                <Text style={styles.linkLabel}>See full history</Text>
              </Pressable>
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

function Block({
  label,
  meta,
  testID,
  children,
}: {
  label: string;
  meta?: string;
  testID: string;
  children: ReactNode;
}) {
  return (
    <View testID={testID} style={styles.block}>
      <View style={styles.blockLabelRow}>
        <Text style={styles.blockLabel}>{label}</Text>
        {meta !== undefined && <Text style={styles.blockMeta}>{meta}</Text>}
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function CardRow({
  label,
  labelStyle,
  value,
  tail,
  isLast,
}: {
  label: string;
  labelStyle: 'set' | 'session';
  value: string;
  tail?: string;
  isLast: boolean;
}) {
  return (
    <View style={[styles.cardRow, isLast && styles.cardRowLast]}>
      <Text style={labelStyle === 'set' ? styles.rowLabel : styles.earlierLabel}>{label}</Text>
      <Text style={styles.rowValue}>
        {value}
        {tail !== undefined && <Text style={styles.rowValueTail}>{tail}</Text>}
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
    <Block
      testID="exercise-last-session"
      label="Last session"
      meta={formatLastSessionMeta(lastSession)}
    >
      {lastSession.setLogs.map((setLog, index) => (
        <CardRow
          key={setLog.id}
          label={formatSetLabel(setLog)}
          labelStyle="set"
          value={formatSetValue(setLog, equipment)}
          tail={formatSetRirTail(setLog)}
          isLast={index === lastSession.setLogs.length - 1}
        />
      ))}
    </Block>
  );
}

function EarlierBlock({ sessions }: { sessions: ExerciseSessionSummary[] }) {
  return (
    <Block testID="exercise-earlier-sessions" label="Earlier">
      {sessions.map((session, index) => (
        <CardRow
          key={`${session.completedAt}-${session.weekNumber}-${session.dayNumber}`}
          label={formatEarlierSessionLabel(session)}
          labelStyle="session"
          value={formatEarlierSessionValue(session)}
          tail={formatEarlierSessionTail(session)}
          isLast={index === sessions.length - 1}
        />
      ))}
    </Block>
  );
}
