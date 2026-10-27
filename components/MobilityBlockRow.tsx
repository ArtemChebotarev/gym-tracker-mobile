// The block of a mobility card (10.1 FR-9, FR-10, FR-14; canvas 1.x, CooldownStates; GT-107): one
// row — the Length field, a round play button, the Done box — on the set rows' grid, so it lines up
// with the cards around it. No progress bar: the progress is the timer screen's and the capsule's.
//
// - The length is picked on two wheels (TimePickerSheet): a tap on the field opens them, and when
//   they close it is saved as the block's plan (`onSetRoundTime`), as an interval round's time is
//   (GT-187) — structure, not a result, and from history after the first time (FR-9).
// - Play runs the interval timer (GT-96) over the block: Get ready, then the length as one round
//   with no rest, full screen first, and put away into the capsule with its chevron. While it is
//   out, the field counts the time left, a tap on it opens the timer again, and the button pauses
//   and resumes it. The timer logs the block itself.
// - Done is the Log box: one tap logs the block with the length the field shows, timer or not
//   (FR-10); a second tap un-logs it.
//
// JSX/rendering only — styles live in MobilityBlockRowStyles.ts and pure helpers in
// MobilityExerciseCardLogic.ts, per the code-style skill.

import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { IconButton } from '@design/components/IconButton';
import { TimePickerSheet } from '@design/components/TimePickerSheet';
import { formatClock } from '@design/formatClock';
import { CheckIcon } from '@design/icons/CheckIcon';
import { PauseIcon } from '@design/icons/PauseIcon';
import { PlayIcon } from '@design/icons/PlayIcon';
import { tapTargetSlop } from '@design/shapes';
import { COLORS, ICON_SIZES, SIZES } from '@design/tokens';
import { useIntervalTimerStore } from '@state/intervalTimerStore';
import type { WorkoutRoundRow } from '@usecases/workoutSession';

import type { RoundActions } from './IntervalRoundRows';
import { styles as hintStyles } from './IntervalRoundRowsStyles';
import { styles } from './MobilityBlockRowStyles';
import {
  blockEntryOf,
  blockLengthSec,
  blockTimerState,
  LENGTH_PICKER,
  LENGTH_PICKER_TITLE,
  PICK_LENGTH_HINT,
  shownTimerSec,
  timerBlockOf,
} from './MobilityExerciseCardLogic';
import { formatNotDone } from './WorkoutSetRowLogic';
import { styles as rowStyles } from './WorkoutSetRowStyles';

const TICK_MS = 1000;

export type MobilityBlockRowProps = {
  /** For the test ids, and to tell this block's timer from another exercise's. */
  sessionExerciseId: string;
  block: WorkoutRoundRow;
  /** Live mode and the exercise isn't skipped — the field, play and Done work. */
  editable: boolean;
  /** A log or un-log is being saved — the Done box waits for it. */
  isSaving: boolean;
  actions?: RoundActions;
};

export function MobilityBlockRow({
  sessionExerciseId,
  block,
  editable,
  isSaving,
  actions,
}: MobilityBlockRowProps) {
  const [pickedSec, setPickedSec] = useState<number | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const timer = useIntervalTimerStore((s) =>
    s.active?.exercise.sessionExerciseId === sessionExerciseId ? s.active.timer : undefined,
  );
  const timerState = blockTimerState(timer);
  // A `now` from before the timer started reads as the whole phase — the time left is capped at
  // it — so the first tick, a second in, is soon enough.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (timerState !== 'running') return undefined;
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(tick);
  }, [timerState]);

  const logged = block.log !== undefined;
  const lengthSec = blockLengthSec(block, pickedSec);
  const timerOut = timerState !== 'idle';
  const fieldSec =
    timer !== undefined && timerOut && lengthSec !== undefined
      ? shownTimerSec(timer, lengthSec, now)
      : lengthSec;
  const timerBlock = timerBlockOf(block, lengthSec);
  const canStart = actions?.onStartTimer !== undefined && timerBlock !== undefined;
  const fieldActive = editable && !logged;
  const doneDisabled = !editable || isSaving || timerOut || (!logged && lengthSec === undefined);

  function pressField() {
    if (timerOut) {
      actions?.onOpenTimer?.();
      return;
    }
    // An empty field takes the wheels' time the moment they open, so closing them straight away
    // keeps what they showed.
    if (lengthSec === undefined) {
      setPickedSec(LENGTH_PICKER.minSec);
    }
    setPickerOpen(true);
  }

  function closePicker() {
    setPickerOpen(false);
    if (pickedSec !== undefined && pickedSec !== block.workSec) {
      actions?.onSetRoundTime?.('work', [block.roundNumber], pickedSec);
    }
  }

  function pressPlay() {
    const store = useIntervalTimerStore.getState();
    if (timerState === 'running') {
      store.pause();
    } else if (timerState === 'paused') {
      store.resume();
    } else if (timerBlock !== undefined) {
      actions?.onStartTimer?.(timerBlock);
    }
  }

  const fieldLabel =
    fieldSec === undefined
      ? 'Length, not set'
      : timerOut
        ? `${formatClock(fieldSec)} left, open timer`
        : `Length, ${formatClock(fieldSec)}`;

  return (
    <>
      <View testID={`mobility-block-${sessionExerciseId}`} style={rowStyles.row}>
        {block.notDone !== undefined ? (
          <View style={rowStyles.skippedValues}>
            <Text style={rowStyles.skippedLabel}>{formatNotDone(block.notDone)}</Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fieldLabel}
            accessibilityState={{ disabled: !fieldActive, expanded: pickerOpen }}
            disabled={!fieldActive}
            onPress={pressField}
            style={[
              rowStyles.field,
              logged ? rowStyles.fieldLogged : editable && rowStyles.fieldEditable,
              pickerOpen && rowStyles.fieldFocused,
            ]}
          >
            {fieldSec === undefined ? (
              <Text style={rowStyles.placeholder}>–</Text>
            ) : (
              <Text style={rowStyles.value}>{formatClock(fieldSec)}</Text>
            )}
          </Pressable>
        )}
        <View style={styles.actions}>
          <View style={styles.buttonSlot}>
            {editable && !logged && (
              <IconButton
                variant="onCard"
                accessibilityLabel={
                  timerState === 'running'
                    ? 'Pause timer'
                    : timerState === 'paused'
                      ? 'Resume timer'
                      : 'Start timer'
                }
                disabled={!timerOut && !canStart}
                onPress={pressPlay}
              >
                {timerState === 'running' ? (
                  <PauseIcon size={ICON_SIZES['icon/button']} color={COLORS['text/primary']} />
                ) : (
                  <PlayIcon size={ICON_SIZES['icon/button']} color={COLORS['text/primary']} />
                )}
              </IconButton>
            )}
          </View>
          <View style={rowStyles.logColumn}>
            {block.notDone === undefined && (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={logged ? 'Done' : 'Mark done'}
                accessibilityState={{ checked: logged, disabled: doneDisabled }}
                disabled={doneDisabled}
                hitSlop={tapTargetSlop(SIZES['size/log-box'])}
                onPress={() => {
                  if (logged) {
                    setPickedSec(undefined);
                    actions?.onUnlogRound?.(block.roundNumber);
                    return;
                  }
                  const entry = blockEntryOf(lengthSec);
                  if (entry !== undefined) {
                    actions?.onLogRound?.(block.roundNumber, entry);
                  }
                }}
                style={({ pressed }) => [
                  rowStyles.logBox,
                  logged && rowStyles.logBoxLogged,
                  !logged && block.isFirstUnlogged && rowStyles.logBoxNext,
                  pressed && rowStyles.pressed,
                ]}
              >
                {logged && (
                  <CheckIcon size={ICON_SIZES['icon/small']} color={COLORS['accent/on']} />
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>
      {editable && !logged && lengthSec === undefined && (
        <Text style={hintStyles.hint}>{PICK_LENGTH_HINT}</Text>
      )}
      {pickerOpen && (
        <TimePickerSheet
          visible
          onClose={closePicker}
          title={LENGTH_PICKER_TITLE}
          value={lengthSec ?? LENGTH_PICKER.minSec}
          onChange={setPickedSec}
          {...LENGTH_PICKER}
        />
      )}
    </>
  );
}
