// Mesocycles tab — see 08.3 · Мезоциклы — список (task 074). Groups mesocycles in the fixed order
// Active → Planned → Completed, skipping empty groups; an entirely empty list shows an EmptyState
// inviting the first mesocycle instead.
//
// Presentational: data and every outcome (navigating, starting, deleting) come in as props from
// app/(tabs)/mesocycles.tsx, so this renders and is tested with plain props. What *does* live
// here is the confirmation gate in front of the two irreversible actions, since both are part of
// 08.3's own screen behavior rather than something the route decides:
// - Start opens a `Start this mesocycle?` popup and calls `onStart` only once accepted — or, if a
//   mesocycle is already active, an explanation popup instead, never a silent no-op.
// - Delete (revealed by swiping a Planned row) opens `Delete mesocycle? This can't be undone` and
//   calls `onDelete` only from its destructive button.
//
// Planned rows carry no `Planned` badge — the section label already says it (Artem's review).
// Rows inside a group sit in their own gap-less View: the group's `gap` is for the label only, and
// applied between rows it pushed each row's content below the visual middle of its divider band.
//
// Since task 117 a row carries nothing but its name and caption: every action is behind a swipe
// (`SwipeableRow`). Right to left reveals the secondary ones — Edit and Delete on a Planned row,
// History on a Completed one. Left to right, pulled far enough, runs the row's primary one: Start,
// or Copy on a finished block. The pill and the `⋯` both went with it, because the right edge is
// where the hand goes to swipe and a button sitting there competed with the gesture (Artem's
// call). With the `⋯` sheet gone, so is the `presentation: overlay` workaround it needed: Delete's
// confirmation is raised from a plain button now, with no modal dismissing underneath it.
//
// JSX/rendering only — styles live in MesocyclesScreenStyles.ts and pure helpers in
// MesocyclesScreenLogic.ts, per the code-style skill.

import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import type { Mesocycle } from '@domain/mesocycle';
import { Badge } from '@design/components/Badge';
import { EmptyState } from '@design/components/EmptyState';
import { IconButton } from '@design/components/IconButton';
import { ListRow } from '@design/components/ListRow';
import { RootScreen } from '@design/components/RootScreen';
import { SwipeableRow } from '@design/components/SwipeableRow';

import {
  completedLeadingAction,
  completedRowActions,
  formatActiveCaption,
  formatCompletedCaption,
  formatPlannedCaption,
  formatStartBlockedMessage,
  formatStartConfirmMessage,
  getWeekDots,
  groupMesocycles,
  isEmptyGroups,
  mesocycleStoppedBadge,
  plannedLeadingAction,
  plannedRowActions,
} from './MesocyclesScreenLogic';
import { styles } from './MesocyclesScreenStyles';

export type MesocyclesScreenProps = {
  mesocycles: Mesocycle[] | undefined;
  isPending: boolean;
  /**
   * The Active card's current week — from the mesocycle's sessions (the week of the one in
   * progress, else of the next ready one), not the calendar. Unused without an active mesocycle.
   */
  activeWeekNumber: number;
  onRequestCreate: () => void;
  onOpenActive: () => void;
  onStart: (mesocycle: Mesocycle) => void;
  onEdit: (mesocycle: Mesocycle) => void;
  onDelete: (mesocycle: Mesocycle) => void;
  onCopy: (mesocycle: Mesocycle) => void;
  onOpenHistory: (mesocycle: Mesocycle) => void;
};

export function MesocyclesScreen({
  mesocycles,
  isPending,
  activeWeekNumber,
  onRequestCreate,
  onOpenActive,
  onStart,
  onEdit,
  onDelete,
  onCopy,
  onOpenHistory,
}: MesocyclesScreenProps) {
  const groups = useMemo(() => groupMesocycles(mesocycles ?? []), [mesocycles]);

  function handleStart(mesocycle: Mesocycle) {
    if (groups.active !== null) {
      Alert.alert("Can't start yet", formatStartBlockedMessage(groups.active));
      return;
    }
    Alert.alert('Start this mesocycle?', formatStartConfirmMessage(mesocycle), [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', onPress: () => onStart(mesocycle) },
    ]);
  }

  function confirmDelete(mesocycle: Mesocycle) {
    Alert.alert('Delete mesocycle?', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(mesocycle) },
    ]);
  }

  const active = groups.active;

  return (
    <View style={styles.root}>
      <RootScreen
        title="Mesocycles"
        trailing={
          <IconButton accessibilityLabel="New mesocycle" variant="accent" onPress={onRequestCreate}>
            <Text style={styles.addIcon}>+</Text>
          </IconButton>
        }
      >
        {isPending && <Text style={styles.status}>Loading…</Text>}

        {!isPending && isEmptyGroups(groups) && (
          <EmptyState
            title="Plan your first mesocycle"
            description="Build a training block, then start it when you're ready."
            actionLabel="Create mesocycle"
            onAction={onRequestCreate}
          />
        )}

        {!isPending && !isEmptyGroups(groups) && (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {active !== null && (
              <View style={styles.group}>
                <Text style={styles.groupLabel}>Active</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={active.name}
                  onPress={onOpenActive}
                  style={({ pressed }) => [styles.activeCard, pressed && styles.pressed]}
                >
                  <View style={styles.activeHeader}>
                    <Text style={styles.activeName} numberOfLines={1}>
                      {active.name}
                    </Text>
                    <Badge label="Active" variant="accent" />
                  </View>
                  <View style={styles.weekDots}>
                    {getWeekDots(active.lengthWeeks, activeWeekNumber).map((state, index) => (
                      <View
                        key={index}
                        testID={`week-dot-${state}`}
                        style={[
                          styles.weekDot,
                          state === 'done' && styles.weekDotDone,
                          state === 'current' && styles.weekDotCurrent,
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.activeCaption}>
                    {formatActiveCaption(active, activeWeekNumber)}
                  </Text>
                </Pressable>
              </View>
            )}

            {groups.planned.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupLabel}>Planned</Text>
                <View>
                  {groups.planned.map((mesocycle) => (
                    <SwipeableRow
                      key={mesocycle.id}
                      testID={`mesocycle-row-${mesocycle.id}`}
                      accessibilityLabel={mesocycle.name}
                      leadingAction={plannedLeadingAction(mesocycle, { onStart: handleStart })}
                      trailingActions={plannedRowActions(mesocycle, {
                        onEdit,
                        onDelete: confirmDelete,
                      })}
                    >
                      <ListRow
                        title={mesocycle.name}
                        subtitle={formatPlannedCaption(mesocycle)}
                      />
                    </SwipeableRow>
                  ))}
                </View>
              </View>
            )}

            {groups.completed.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupLabel}>Completed</Text>
                <View>
                  {groups.completed.map((mesocycle) => (
                    <SwipeableRow
                      key={mesocycle.id}
                      testID={`mesocycle-row-${mesocycle.id}`}
                      accessibilityLabel={mesocycle.name}
                      leadingAction={completedLeadingAction(mesocycle, { onCopy })}
                      trailingActions={completedRowActions(mesocycle, { onOpenHistory })}
                    >
                      <ListRow
                        title={mesocycle.name}
                        subtitle={formatCompletedCaption(mesocycle)}
                        badge={mesocycleStoppedBadge(mesocycle)}
                      />
                    </SwipeableRow>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </RootScreen>
    </View>
  );
}
