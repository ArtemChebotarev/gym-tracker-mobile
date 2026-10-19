// The rounds of an interval card (10.1 FR-7, FR-9, FR-14; canvas 1.6, 8.1, 8.2) — one row per
// round, and Start timer under them. The rounds are the plan: Work and Rest show the round's times —
// its target, or the cycle's plan when the target has none — and, once logged, what was done. The
// last round's Rest is there too: it is the rest before the next exercise (FR-6; Artem,
// 19.10.2026). A rest the timer skipped reads `Skipped`, struck through.
//
// - A time is changed on two wheels (TimePickerSheet, GT-90): a tap on an unlogged round's Work or
//   Rest opens the picker, and when it closes the rounds below that aren't logged yet follow the
//   new time, as a weight carries into the later sets (task 106). The times live here, not in each
//   row, for that reason — the way WorkoutSetRows holds the Weight fields. Picked times are never
//   saved on their own (05, "Сохранение данных"): Log takes them.
// - A round is logged by hand with one tap on its Log box — the times its fields hold — and
//   un-logged by a second tap on the filled one, which brings its logged times back into the fields
//   (FR-7, GT-89).
// - Start timer only shows where it will be until the timer exists (its own story).
//
// JSX/rendering only — styles live in IntervalRoundRowsStyles.ts and pure helpers in
// IntervalRoundRowsLogic.ts and IntervalExerciseCardLogic.ts, per the code-style skill.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TimePickerSheet } from '@design/components/TimePickerSheet';
import { formatClock } from '@design/formatClock';
import { CheckIcon } from '@design/icons/CheckIcon';
import { PlayIcon } from '@design/icons/PlayIcon';
import { tapTargetSlop } from '@design/shapes';
import { COLORS, ICON_SIZES, SIZES } from '@design/tokens';
import type { RoundEntry } from '@domain/executionValidators';
import type { WorkoutRoundRow } from '@usecases/workoutSession';

import { NO_REST, roundEntryOf, startTimerLabel } from './IntervalExerciseCardLogic';
import {
  carryRoundTimeForward,
  editRoundTime,
  holdLoggedRound,
  NO_ROUND_TIME_EDITS,
  ROUND_TIME_PICKER,
  type RoundTimeColumn,
  type RoundTimeEdits,
  roundsWithEdits,
  roundTimePickerSubtitle,
  roundTimePickerTitle,
} from './IntervalRoundRowsLogic';
import { styles } from './IntervalRoundRowsStyles';
import { formatNotDone } from './WorkoutSetRowLogic';
import { styles as rowStyles } from './WorkoutSetRowStyles';

/** What an interval card acts with: logging its rounds by hand, and the timer once it exists. */
export type RoundActions = {
  /** Logs round `roundNumber` with the times in its fields (FR-7). */
  onLogRound?: (roundNumber: number, entry: RoundEntry) => void;
  /** Un-logs a logged round — a second tap on its filled Log box. */
  onUnlogRound?: (roundNumber: number) => void;
  /** Opens the interval timer from the first unlogged round (FR-6, FR-7). */
  onStartTimer?: () => void;
};

export type IntervalRoundRowsProps = {
  /** For the Start timer button's test id. */
  sessionExerciseId: string;
  rounds: readonly WorkoutRoundRow[];
  /** Live mode and the exercise isn't skipped — the fields, Log and Start timer work. */
  editable: boolean;
  /** A log or un-log is being saved — every Log box waits for it. */
  isSaving: boolean;
  actions?: RoundActions;
};

/** The field whose picker is open. */
type OpenField = { column: RoundTimeColumn; roundNumber: number };

export function IntervalRoundRows({
  sessionExerciseId,
  rounds,
  editable,
  isSaving,
  actions,
}: IntervalRoundRowsProps) {
  const [edits, setEdits] = useState<RoundTimeEdits>(NO_ROUND_TIME_EDITS);
  const [open, setOpen] = useState<OpenField | null>(null);
  const shown = roundsWithEdits(rounds, edits);
  const timerLabel = editable ? startTimerLabel(shown) : undefined;
  const openRound =
    open === null ? undefined : shown.find((r) => r.roundNumber === open.roundNumber);
  const openSec =
    open === null || openRound === undefined
      ? 0
      : open.column === 'work'
        ? openRound.workSec
        : (openRound.restSec ?? 0);

  function closePicker() {
    if (open !== null) {
      setEdits((current) => carryRoundTimeForward(current, open.column, rounds, open.roundNumber));
    }
    setOpen(null);
  }

  return (
    <>
      {shown.map((round) => (
        <RoundRow
          key={round.roundNumber}
          round={round}
          editable={editable}
          isSaving={isSaving}
          openColumn={open?.roundNumber === round.roundNumber ? open.column : undefined}
          onOpenField={(column) => setOpen({ column, roundNumber: round.roundNumber })}
          onLog={() => actions?.onLogRound?.(round.roundNumber, roundEntryOf(round))}
          onUnlog={() => {
            setEdits((current) => holdLoggedRound(current, round));
            actions?.onUnlogRound?.(round.roundNumber);
          }}
        />
      ))}
      {timerLabel !== undefined && (
        <Pressable
          testID={`start-timer-${sessionExerciseId}`}
          accessibilityRole="button"
          accessibilityLabel={timerLabel}
          accessibilityState={{ disabled: actions?.onStartTimer === undefined }}
          disabled={actions?.onStartTimer === undefined}
          onPress={actions?.onStartTimer}
          style={({ pressed }) => [styles.startTimer, pressed && styles.pressed]}
        >
          <PlayIcon size={ICON_SIZES['icon/small']} color={COLORS.accent} />
          <Text style={styles.startTimerLabel}>{timerLabel}</Text>
        </Pressable>
      )}
      {open !== null && (
        <TimePickerSheet
          visible
          onClose={closePicker}
          title={roundTimePickerTitle(open.column, open.roundNumber)}
          {...(roundTimePickerSubtitle(rounds, open.roundNumber) !== undefined
            ? { subtitle: roundTimePickerSubtitle(rounds, open.roundNumber) }
            : {})}
          value={openSec}
          onChange={(sec) =>
            setEdits((current) => editRoundTime(current, open.column, open.roundNumber, sec))
          }
          {...ROUND_TIME_PICKER[open.column]}
        />
      )}
    </>
  );
}

type RoundRowProps = {
  round: WorkoutRoundRow;
  editable: boolean;
  isSaving: boolean;
  /** The field of this round whose picker is open — its outline brightens. */
  openColumn: RoundTimeColumn | undefined;
  onOpenField: (column: RoundTimeColumn) => void;
  onLog: () => void;
  onUnlog: () => void;
};

/** One round: its number, Work, Rest, the indicator's empty column and Log. */
function RoundRow({
  round,
  editable,
  isSaving,
  openColumn,
  onOpenField,
  onLog,
  onUnlog,
}: RoundRowProps) {
  const logged = round.log !== undefined;
  const workSec = round.log?.workSec ?? round.workSec;
  const restSec = logged ? round.log?.restSec : round.restSec;
  // An unlogged round's times can be picked; a logged one reads as it was logged — un-log to change.
  const pickable = editable && !logged;

  return (
    <View testID={`round-row-${round.roundNumber}`} style={rowStyles.row}>
      <View style={styles.roundCell}>
        <Text style={styles.roundNumber}>{round.roundNumber}</Text>
      </View>
      {round.notDone !== undefined ? (
        <View style={rowStyles.skippedValues}>
          <Text style={rowStyles.skippedLabel}>{formatNotDone(round.notDone)}</Text>
        </View>
      ) : (
        <>
          <TimeField
            label={`Work, round ${round.roundNumber}`}
            sec={workSec}
            logged={logged}
            editable={editable}
            focused={openColumn === 'work'}
            {...(pickable ? { onPress: () => onOpenField('work') } : {})}
          />
          {round.log?.restSkipped === true ? (
            <View style={styles.bareCell}>
              <Text style={styles.restSkipped}>Skipped</Text>
            </View>
          ) : restSec === undefined ? (
            <View style={styles.bareCell}>
              <Text style={styles.noRest}>{NO_REST}</Text>
            </View>
          ) : (
            <TimeField
              label={`Rest, round ${round.roundNumber}`}
              sec={restSec}
              logged={logged}
              editable={editable}
              focused={openColumn === 'rest'}
              {...(pickable ? { onPress: () => onOpenField('rest') } : {})}
            />
          )}
        </>
      )}
      <Text style={rowStyles.indicator} />
      <View style={rowStyles.logColumn}>
        {round.notDone === undefined && (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={
              logged ? `Round ${round.roundNumber} logged` : `Log round ${round.roundNumber}`
            }
            accessibilityState={{ checked: logged, disabled: !editable || isSaving }}
            disabled={!editable || isSaving}
            hitSlop={tapTargetSlop(SIZES['size/log-box'])}
            onPress={logged ? onUnlog : onLog}
            style={({ pressed }) => [
              rowStyles.logBox,
              logged && rowStyles.logBoxLogged,
              !logged && round.isFirstUnlogged && rowStyles.logBoxNext,
              pressed && rowStyles.pressed,
            ]}
          >
            {logged && <CheckIcon size={ICON_SIZES['icon/small']} color={COLORS['accent/on']} />}
          </Pressable>
        )}
      </View>
    </View>
  );
}

type TimeFieldProps = {
  /** What the field is for a screen reader: `Rest, round 1`. */
  label: string;
  sec: number;
  logged: boolean;
  editable: boolean;
  /** Its picker is open. */
  focused: boolean;
  /** Opens the picker — absent where the time can't be changed. */
  onPress?: () => void;
};

/** A Work or Rest field: the set rows' field frame, a button that opens the picker. */
function TimeField({ label, sec, logged, editable, focused, onPress }: TimeFieldProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${formatClock(sec)}`}
      accessibilityState={{ disabled: onPress === undefined, expanded: focused }}
      disabled={onPress === undefined}
      onPress={onPress}
      style={[
        rowStyles.field,
        logged ? rowStyles.fieldLogged : editable && rowStyles.fieldEditable,
        focused && rowStyles.fieldFocused,
      ]}
    >
      <Text style={rowStyles.value}>{formatClock(sec)}</Text>
    </Pressable>
  );
}
