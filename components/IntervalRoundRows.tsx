// The rounds of an interval card (10.1 FR-7, FR-9, FR-14; canvas 1.6, 8.1, 8.2) — one row per
// round, and Start timer under them. The rounds are the plan: Work and Rest show the round's times —
// its target, from history — and, once logged, what was done. With no history the fields are empty
// (GT-187): Log and Start timer wait until a round has both, and a line under the rounds says so.
// The last round's Rest is there too: it is the rest before the next exercise (FR-6; Artem,
// 19.10.2026). A rest the timer skipped shows the planned rest, as does a round logged without one:
// Skip rest changes neither the card nor next week (Artem, 20.10.2026) — `shownRestSec`.
//
// - A time is changed on two wheels (TimePickerSheet, GT-90): a tap on an unlogged round's Work or
//   Rest opens the picker, and when it closes the rounds below that aren't logged yet follow the
//   new time, as a weight carries into the later sets (task 106). The times live here, not in each
//   row, for that reason — the way WorkoutSetRows holds the Weight fields. When the picker closes
//   the time is saved as the plan of that round and of the rounds that followed it
//   (`onSetRoundTime`, GT-187): an interval's time is structure, not a result, and must outlive the
//   screen. A round added from the menu (GT-91) follows the last one's fields too.
// - A round is logged by hand with one tap on its Log box — the times its fields hold — and
//   un-logged by a second tap on the filled one, which brings its logged times back into the fields
//   (FR-7, GT-89).
// - Start timer opens the interval timer (GT-96) over the rounds not yet logged, with the times
//   their fields show.
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
import type { IntervalTimerRound } from '@domain/intervalTimer';
import type { WorkoutRoundRow } from '@usecases/workoutSession';

import {
  hasRoundTimes,
  lacksRoundTimes,
  PICK_ROUND_TIMES_HINT,
  roundEntryOf,
  startTimerLabel,
  timerRoundsOf,
} from './IntervalExerciseCardLogic';
import {
  carryRoundTimeForward,
  editRoundTime,
  followRoundChanges,
  holdLoggedRound,
  NO_ROUND_TIME_EDITS,
  pickerStartSec,
  ROUND_TIME_PICKER,
  type RoundTimeColumn,
  type RoundTimeEdits,
  roundsWithEdits,
  roundTimePickerSubtitle,
  roundTimePickerTitle,
  roundTimeToSave,
  shownRestSec,
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
  /** Opens the interval timer over the rounds not yet logged, as their fields show them (FR-6, FR-7). */
  onStartTimer?: (rounds: IntervalTimerRound[]) => void;
  /**
   * Saves a picked time as the plan of rounds `roundNumbers` — the one picked and those that
   * followed it (FR-9, GT-187).
   */
  onSetRoundTime?: (column: RoundTimeColumn, roundNumbers: number[], sec: number) => void;
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
  // The rounds the edits were made against: when Add round or Remove last round changes them, the
  // edits follow (`followRoundChanges`) — adjusted while rendering, so the new round never shows a
  // frame with the plan's time first.
  const [editedRounds, setEditedRounds] = useState(rounds);
  if (editedRounds !== rounds) {
    setEditedRounds(rounds);
    setEdits((current) => followRoundChanges(current, editedRounds, rounds));
  }
  const shown = roundsWithEdits(rounds, edits);
  const timerLabel = editable ? startTimerLabel(shown) : undefined;
  const timerRounds = timerRoundsOf(shown);
  const canStartTimer = actions?.onStartTimer !== undefined && timerRounds !== undefined;
  const openSec = open === null ? 0 : pickerStartSec(shown, open.column, open.roundNumber);

  // An empty field takes the wheels' time the moment its picker opens, so closing it straight away
  // keeps what it showed. A field with a time is left alone until the wheels move.
  function openPicker(column: RoundTimeColumn, roundNumber: number) {
    const round = shown.find((each) => each.roundNumber === roundNumber);
    const empty = column === 'work' ? round?.workSec === undefined : round?.restSec === undefined;
    if (empty) {
      setEdits((current) =>
        editRoundTime(current, column, roundNumber, pickerStartSec(shown, column, roundNumber)),
      );
    }
    setOpen({ column, roundNumber });
  }

  function closePicker() {
    if (open !== null) {
      const carried = carryRoundTimeForward(edits, open.column, rounds, open.roundNumber);
      setEdits(carried);
      const save = roundTimeToSave(edits, carried, open.column, open.roundNumber);
      if (save !== undefined) {
        actions?.onSetRoundTime?.(open.column, save.roundNumbers, save.sec);
      }
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
          onOpenField={(column) => openPicker(column, round.roundNumber)}
          onLog={() => {
            const entry = roundEntryOf(round);
            if (entry !== undefined) {
              actions?.onLogRound?.(round.roundNumber, entry);
            }
          }}
          onUnlog={() => {
            setEdits((current) => holdLoggedRound(current, round));
            actions?.onUnlogRound?.(round.roundNumber);
          }}
        />
      ))}
      {editable && lacksRoundTimes(shown) && (
        <Text style={styles.hint}>{PICK_ROUND_TIMES_HINT}</Text>
      )}
      {timerLabel !== undefined && (
        <Pressable
          testID={`start-timer-${sessionExerciseId}`}
          accessibilityRole="button"
          accessibilityLabel={timerLabel}
          accessibilityState={{ disabled: !canStartTimer }}
          disabled={!canStartTimer}
          onPress={() => {
            if (timerRounds !== undefined) {
              actions?.onStartTimer?.(timerRounds);
            }
          }}
          style={({ pressed }) => [
            styles.startTimer,
            !canStartTimer && styles.startTimerDisabled,
            pressed && styles.pressed,
          ]}
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
  const restSec = shownRestSec(round);
  // An unlogged round's times can be picked; a logged one reads as it was logged — un-log to change.
  const pickable = editable && !logged;
  // A round with an empty field can't be logged yet (FR-9); un-logging always works.
  const logDisabled = !editable || isSaving || (!logged && !hasRoundTimes(round));

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
          <TimeField
            label={`Rest, round ${round.roundNumber}`}
            sec={restSec}
            logged={logged}
            editable={editable}
            focused={openColumn === 'rest'}
            {...(pickable ? { onPress: () => onOpenField('rest') } : {})}
          />
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
            accessibilityState={{ checked: logged, disabled: logDisabled }}
            disabled={logDisabled}
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
  /** Absent: no time yet — the field is empty, `–` (GT-187). */
  sec: number | undefined;
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
      accessibilityLabel={`${label}, ${sec === undefined ? 'not set' : formatClock(sec)}`}
      accessibilityState={{ disabled: onPress === undefined, expanded: focused }}
      disabled={onPress === undefined}
      onPress={onPress}
      style={[
        rowStyles.field,
        logged ? rowStyles.fieldLogged : editable && rowStyles.fieldEditable,
        focused && rowStyles.fieldFocused,
      ]}
    >
      {sec === undefined ? (
        <Text style={rowStyles.placeholder}>–</Text>
      ) : (
        <Text style={rowStyles.value}>{formatClock(sec)}</Text>
      )}
    </Pressable>
  );
}
