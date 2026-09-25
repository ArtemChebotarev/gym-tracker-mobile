// Mesocycles tab — see 08.3 · Мезоциклы — список (task 074). Groups mesocycles in the fixed order
// Active → Planned → Completed, skipping empty groups; an entirely empty list shows an EmptyState
// inviting the first mesocycle instead.
//
// Presentational: data and every outcome (navigating, starting, deleting) come in as props from
// app/(tabs)/mesocycles.tsx, so this renders and is tested with plain props. What *does* live
// here is the gate each action goes through, since those are part of 08.3's own screen behavior
// rather than something the route decides:
// - `+` opens `MesoCreationMethodSheet` (123) instead of going straight to Flow A: there are two
//   ways to build a block now. Whether the second one has anything to copy from is read off the
//   Completed group, which already holds both ways a block ends. How the sheet opens and closes is
//   `useMesoCreationMethodSheet`, shared with the Today tab's own empty state.
// - The empty state raises the same sheet rather than going straight to Flow A. It used to go
//   direct, on the grounds that this state means no block exists at all, so `Copy a mesocycle` is
//   provably off and the sheet would be one live row. Artem's call: the gesture that starts a
//   block should be the same one everywhere, and a disabled row that says `Nothing to copy yet`
//   teaches what the second way is before there is anything to use it on.
// - Start opens a `Start this mesocycle?` popup and calls `onStart` only once accepted — or, if a
//   mesocycle is already active, an explanation popup instead, never a silent no-op.
// - Delete (the Planned row's one `⋯` action) opens `Delete mesocycle? This can't be undone` and
//   calls `onDelete` only from its destructive button.
//
// Planned rows carry no `Planned` badge — the section label already says it (Artem's review).
// Rows inside a group sit in their own gap-less View: the group's `gap` is for the label only, and
// applied between rows it pushed each row's content below the visual middle of its divider band.
//
// Every action is visible on the row again (117, after two days on the device). Swipes are gone:
// the screen never showed what it could do, so opening it with no active block said nothing about
// where to start. A row now reads as what it is — a tap opens the obvious thing, the pill is the
// one action worth a button, and the rest live behind the `⋯`, which opens the same native menu
// as every other `⋯` in the app (`ActionMenu`, the other half of 117):
// - Planned: tap opens the editor, `Start` is the accent pill, `⋯` holds Delete.
// - Completed: tap opens that block's history (`onOpenHistory`), `⋯` holds Copy and Archive.
//   Archive asks first (`Archive mesocycle?`) and then takes the block off the list for good —
//   a soft delete, so nothing logged in it is touched, but there is no way back from the app yet.
// The tap and the buttons don't overlap: `ListRow` keeps an actions row's accessories outside its
// press region, so a tap on `Start` starts and a tap anywhere else on the row opens the editor.
// `SwipeableRow` stays in the SDK, unused for now (Artem's call).
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

import { MesoCreationMethodSheet } from './MesoCreationMethodSheet';
import { useMesoCreationMethodSheet } from './useMesoCreationMethodSheet';

import {
  completedMenuItems,
  formatActiveCaption,
  formatArchiveConfirmMessage,
  formatCompletedCaption,
  formatPlannedCaption,
  formatStartBlockedMessage,
  formatStartConfirmMessage,
  getWeekDots,
  groupMesocycles,
  isEmptyGroups,
  mesocycleStoppedBadge,
  PLAN_MESOCYCLE_LABEL,
  plannedMenuItems,
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
  /** Flow A. */
  onCreateFromScratch: () => void;
  /** Flow C, step Source week (124). */
  onCopyMesocycle: () => void;
  onOpenActive: () => void;
  onStart: (mesocycle: Mesocycle) => void;
  onEdit: (mesocycle: Mesocycle) => void;
  onDelete: (mesocycle: Mesocycle) => void;
  onCopy: (mesocycle: Mesocycle) => void;
  onOpenHistory: (mesocycle: Mesocycle) => void;
  /** Called from the confirmation's button, never straight off the menu. */
  onArchive: (mesocycle: Mesocycle) => void;
};

export function MesocyclesScreen({
  mesocycles,
  isPending,
  activeWeekNumber,
  onCreateFromScratch,
  onCopyMesocycle,
  onOpenActive,
  onStart,
  onEdit,
  onDelete,
  onCopy,
  onOpenHistory,
  onArchive,
}: MesocyclesScreenProps) {
  const groups = useMemo(() => groupMesocycles(mesocycles ?? []), [mesocycles]);
  const methodSheet = useMesoCreationMethodSheet();

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

  function confirmArchive(mesocycle: Mesocycle) {
    Alert.alert('Archive mesocycle?', formatArchiveConfirmMessage(mesocycle), [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', onPress: () => onArchive(mesocycle) },
    ]);
  }

  const active = groups.active;

  return (
    <View style={styles.root}>
      <RootScreen
        title="Mesocycles"
        trailing={
          <IconButton
            accessibilityLabel="New mesocycle"
            variant="accent"
            onPress={methodSheet.open}
          >
            <Text style={styles.addIcon}>+</Text>
          </IconButton>
        }
      >
        {isPending && <Text style={styles.status}>Loading…</Text>}

        {!isPending && isEmptyGroups(groups) && (
          <EmptyState
            title="Plan your first mesocycle"
            description="Build a training block, then start it when you're ready."
            actionLabel={PLAN_MESOCYCLE_LABEL}
            onAction={methodSheet.open}
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
                    <ListRow
                      key={mesocycle.id}
                      title={mesocycle.name}
                      subtitle={formatPlannedCaption(mesocycle)}
                      onPress={() => onEdit(mesocycle)}
                      trailing={{
                        type: 'actions',
                        action: {
                          label: 'Start',
                          variant: 'primary',
                          onPress: () => handleStart(mesocycle),
                        },
                        menu: {
                          testID: `mesocycle-menu-${mesocycle.id}`,
                          items: plannedMenuItems(mesocycle, { onDelete: confirmDelete }),
                        },
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            {groups.completed.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupLabel}>Completed</Text>
                <View>
                  {groups.completed.map((mesocycle) => (
                    <ListRow
                      key={mesocycle.id}
                      title={mesocycle.name}
                      subtitle={formatCompletedCaption(mesocycle)}
                      badge={mesocycleStoppedBadge(mesocycle)}
                      onPress={() => onOpenHistory(mesocycle)}
                      trailing={{
                        type: 'actions',
                        menu: {
                          testID: `mesocycle-menu-${mesocycle.id}`,
                          items: completedMenuItems(mesocycle, { onCopy, onArchive: confirmArchive }),
                        },
                      }}
                    />
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </RootScreen>

      <MesoCreationMethodSheet
        visible={methodSheet.visible}
        animated={methodSheet.animated}
        onClose={methodSheet.close}
        canCopy={groups.completed.length > 0}
        onCreateFromScratch={methodSheet.choose(onCreateFromScratch)}
        onCopyMesocycle={methodSheet.choose(onCopyMesocycle)}
      />
    </View>
  );
}
