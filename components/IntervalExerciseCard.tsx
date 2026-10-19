// Interval card — 10.1 FR-14, "Interval"; canvas 1.4 and 1.6 (GT-88). The rounds are the plan:
// there is no separate plan block, just Round · Work · Rest · Log, the ⓘ beside whichever column
// the lever moves (FR-8), and Start timer under the rounds. The chip above it says `Timed work` when
// the type changes (`cardChip`), and the frame, title row and `⋯` are every card's
// (ExerciseCardFrame).
//
// A round row stands on the set rows' grid, so its columns line up with every other card's: the
// header's indicator column is there, empty, as over power's guided rows. Work and Rest show what
// the round is planned at — its target, or the cycle's plan when the target has no time — and,
// once logged, what was done. The last round's Rest is there too: it is the rest before the next
// exercise (FR-6; Artem, 19.10.2026), shown even when nothing follows and no rest will run. A rest
// the timer skipped reads `Skipped`, struck through.
//
// What this card does not do yet, each in its own task: log and un-log a round by hand (GT-89),
// change a time with the picker (GT-90), Add / Remove round in `⋯` (GT-91), and the timer itself
// (its own story) — until then the Log boxes and Start timer only show where they will be.
// JSX/rendering only — styles live in IntervalExerciseCardStyles.ts and pure helpers in
// IntervalExerciseCardLogic.ts, per the code-style skill.

import { Pressable, Text, View } from 'react-native';

import { Popover } from '@design/components/Popover';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { formatClock } from '@design/formatClock';
import { CheckIcon } from '@design/icons/CheckIcon';
import { PlayIcon } from '@design/icons/PlayIcon';
import { COLORS, ICON_SIZES } from '@design/tokens';
import type { IntervalWorkoutExercise, WorkoutRoundRow } from '@usecases/workoutSession';

import { ExerciseCardFrame } from './ExerciseCardFrame';
import { ExerciseColumnHeader } from './ExerciseColumnHeader';
import {
  intervalProgressionPlate,
  NO_REST,
  progressionInfoLabel,
  REST_COLUMN,
  ROUND_COLUMN,
  startTimerLabel,
  WORK_COLUMN,
} from './IntervalExerciseCardLogic';
import { styles } from './IntervalExerciseCardStyles';
import { RirExplanationContent } from './RirExplanationContent';
import { usePopoverAnchor } from './usePopoverAnchor';
import type { ExerciseCardCommonProps } from './WorkoutExerciseCard';
import { cardRowsOf, exerciseCardView } from './WorkoutExerciseCardLogic';
import { exerciseLogCounts, formatExerciseMenuSubtitle } from './WorkoutExerciseMenuLogic';
import { formatNotDone } from './WorkoutSetRowLogic';
import { styles as rowStyles } from './WorkoutSetRowStyles';

/** What an interval card acts with — the timer, once it exists. */
export type RoundActions = {
  /** Opens the interval timer from the first unlogged round (FR-6, FR-7). */
  onStartTimer?: () => void;
};

export type IntervalExerciseCardProps = ExerciseCardCommonProps & {
  exercise: IntervalWorkoutExercise;
  rounds?: RoundActions;
};

export function IntervalExerciseCard({
  exercise,
  mode,
  chip,
  position = 0,
  onOpenHistory,
  menuItems,
  rounds,
}: IntervalExerciseCardProps) {
  // No RIR, and no Deload badge yet: an interval's deload (fewer rounds, FR-13) isn't planned by
  // the engine until its own task, and a badge would promise it.
  const view = exerciseCardView(mode, exercise, cardRowsOf(exercise.rounds));
  const editable = mode === 'live' && !view.isNotDone;
  const timerLabel = editable ? startTimerLabel(exercise.rounds) : undefined;
  const progression = exercise.progression;
  const infoAnchor = usePopoverAnchor();
  const progressionInfo = progression !== undefined && {
    buttonRef: infoAnchor.ref,
    accessibilityLabel: progressionInfoLabel(progression),
    open: infoAnchor.visible,
    onPress: infoAnchor.open,
  };
  const plate =
    progression === undefined ? undefined : intervalProgressionPlate(progression, exercise.rounds);

  return (
    <ExerciseCardFrame
      exercise={exercise}
      view={view}
      {...(exercise.equipment !== undefined
        ? { equipmentLabel: getEquipmentLabel(exercise.equipment) }
        : {})}
      {...(chip !== undefined ? { chip } : {})}
      position={position}
      onOpenHistory={onOpenHistory}
      menuItems={menuItems}
      menuSubtitle={formatExerciseMenuSubtitle(exerciseLogCounts(exercise))}
      overlays={
        plate !== undefined && (
          <Popover
            visible={infoAnchor.visible}
            onClose={infoAnchor.close}
            anchor={infoAnchor.anchor}
            title={plate.title}
          >
            <RirExplanationContent explanation={plate} />
          </Popover>
        )
      }
    >
      {view.showRows && (
        <ExerciseColumnHeader
          columns={[
            { label: ROUND_COLUMN },
            {
              label: WORK_COLUMN,
              ...(progression?.column === 'work' && progressionInfo
                ? { info: progressionInfo }
                : {}),
            },
            {
              label: REST_COLUMN,
              ...(progression?.column === 'rest' && progressionInfo
                ? { info: progressionInfo }
                : {}),
            },
          ]}
        />
      )}
      {view.showRows &&
        exercise.rounds.map((round) => (
          <RoundRow key={round.roundNumber} round={round} editable={editable} />
        ))}
      {timerLabel !== undefined && (
        <Pressable
          testID={`start-timer-${exercise.sessionExerciseId}`}
          accessibilityRole="button"
          accessibilityLabel={timerLabel}
          accessibilityState={{ disabled: rounds?.onStartTimer === undefined }}
          disabled={rounds?.onStartTimer === undefined}
          onPress={rounds?.onStartTimer}
          style={({ pressed }) => [styles.startTimer, pressed && styles.pressed]}
        >
          <PlayIcon size={ICON_SIZES['icon/small']} color={COLORS.accent} />
          <Text style={styles.startTimerLabel}>{timerLabel}</Text>
        </Pressable>
      )}
    </ExerciseCardFrame>
  );
}

/** One round: its number, Work, Rest, the indicator's empty column and Log. */
function RoundRow({ round, editable }: { round: WorkoutRoundRow; editable: boolean }) {
  const logged = round.log !== undefined;
  const workSec = round.log?.workSec ?? round.workSec;
  const restSec = logged ? round.log?.restSec : round.restSec;
  const fieldStyle = [
    rowStyles.field,
    logged ? rowStyles.fieldLogged : editable && rowStyles.fieldEditable,
  ];

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
          <View style={fieldStyle}>
            <Text style={rowStyles.value}>{formatClock(workSec)}</Text>
          </View>
          {round.log?.restSkipped === true ? (
            <View style={styles.bareCell}>
              <Text style={styles.restSkipped}>Skipped</Text>
            </View>
          ) : restSec === undefined ? (
            <View style={styles.bareCell}>
              <Text style={styles.noRest}>{NO_REST}</Text>
            </View>
          ) : (
            <View style={fieldStyle}>
              <Text style={rowStyles.value}>{formatClock(restSec)}</Text>
            </View>
          )}
        </>
      )}
      <Text style={rowStyles.indicator} />
      <View style={rowStyles.logColumn}>
        {round.notDone === undefined && (
          <View
            style={[
              rowStyles.logBox,
              logged && rowStyles.logBoxLogged,
              !logged && round.isFirstUnlogged && rowStyles.logBoxNext,
            ]}
          >
            {logged && <CheckIcon size={ICON_SIZES['icon/small']} color={COLORS['accent/on']} />}
          </View>
        )}
      </View>
    </View>
  );
}
