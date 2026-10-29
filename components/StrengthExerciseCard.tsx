// A strength exercise's card — 08.7 · Тренировка, "Карточка упражнения" (task 092). Inside the
// shared frame (ExerciseCardFrame): the `N RIR` chip or the `Deload` one, the weight hints, the
// column header and the set rows. Interval and mobility exercises are drawn by it too until their
// stories give them cards of their own (see WorkoutExerciseCard).
//
// Under the title, one line per weight hint (03, rule 3: `↑ Go heavier — 30+ reps last week` /
// `↓ Go lighter — under 5 reps last week`), in live mode only. 08 · Screens & Navigation leaves it
// off in v1; Artem brought it back: without it, a target clamped at the rep corridor's bound (30
// again at the same weight) read as a wrong suggestion.
//
// The Reps ⓘ opens the weight swap's ranges for the next set, or why there are none (08.7.1). A
// resistance band keeps this card (10.1 FR-15) with its own differences, worked out in
// StrengthExerciseCardLogic.ts: no RIR, `Bodyweight, kg`, and a Reps ⓘ of its own.
//
// The RIR is a static `Chip` (inside `RirBadge`, a button that explains it — GT-40), not the neutral
// `Badge` 08.7 names: `Badge` neutral fills with `surface/card`, the card's own background, so on
// the card it read as bare text. The chip's `border/default` outline keeps it visibly a chip
// (Artem's review).
//
// Presentational: the exercise, the screen mode, and the button handlers come in as props.

import { Text, View } from 'react-native';

import { Popover } from '@design/components/Popover';
import { RangeTrack, RangeTrackSwatch } from '@design/components/RangeTrack';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { ArrowDownIcon } from '@design/icons/ArrowDownIcon';
import { ArrowUpIcon } from '@design/icons/ArrowUpIcon';
import type { AnchorRect } from '@design/popoverLayout';
import { COLORS, ICON_SIZES } from '@design/tokens';
import type { StrengthWorkoutExercise } from '@usecases/workoutSession';

import { CorridorStepsPopover } from './CorridorStepsPopover';
import { ExerciseCardFrame } from './ExerciseCardFrame';
import { ExerciseColumnHeader } from './ExerciseColumnHeader';
import { FirstWeightPopover } from './FirstWeightPopover';
import { firstWeightCopy } from './FirstWeightPopoverLogic';
import { RirBadge } from './RirBadge';
import { deloadExplanation, rirExplanation } from './RirExplanationLogic';
import {
  formatWeightHint,
  strengthRepsInfo,
  strengthWeightColumnLabel,
} from './StrengthExerciseCardLogic';
import { styles } from './StrengthExerciseCardStyles';
import { usePopoverAnchor } from './usePopoverAnchor';
import { type WeightSwapPopover, weightSwapPopover } from './WeightSwapLogic';
import type { ExerciseCardCommonProps } from './WorkoutExerciseCard';
import {
  cardInfoTargets,
  cardRowsOf,
  exerciseCardView,
  firstUnloggedRow,
  targetRirOf,
} from './WorkoutExerciseCardLogic';
import { exerciseLogCounts, formatExerciseMenuSubtitle } from './WorkoutExerciseMenuLogic';
import { type SetLoggingProps, WorkoutSetRows } from './WorkoutSetRows';

export type StrengthExerciseCardProps = ExerciseCardCommonProps & {
  exercise: StrengthWorkoutExercise;
  sets: SetLoggingProps;
};

export function StrengthExerciseCard({
  exercise,
  mode,
  isDeload = false,
  coachmarkTargets,
  chip,
  position = 0,
  onOpenHistory,
  onOpenOverview,
  menuItems,
  isSaving,
  sets,
}: StrengthExerciseCardProps) {
  const targetRir = targetRirOf(exercise);
  const view = exerciseCardView(
    mode,
    { ...exercise, targetRir },
    cardRowsOf(exercise.rows),
    isDeload,
  );
  const editable = mode === 'live' && !view.isNotDone;
  const infoTargets = cardInfoTargets({ ...exercise, targetRir }, exercise.rows, mode, isDeload);
  // The ⓘ speaks for the set whose Log box carries the accent, and always for its original target
  // — never for whatever is in the Weight field right now (08.7.1).
  const repsInfo = strengthRepsInfo(
    exercise.equipment,
    infoTargets.reps ? weightSwapPopover(firstUnloggedRow(exercise.rows), targetRir) : undefined,
  );
  // Two ⓘ buttons, each with its own plate: Weight's static how-to (08.11) and Reps' (08.7.1).
  const weightAnchor = usePopoverAnchor();
  const repsAnchor = usePopoverAnchor();

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
      onOpenOverview={onOpenOverview}
      menuItems={menuItems}
      menuSubtitle={formatExerciseMenuSubtitle(exerciseLogCounts(exercise))}
      badges={
        <>
          {infoTargets.rir && view.rirLabel !== undefined && targetRir !== undefined && (
            <RirBadge
              label={view.rirLabel}
              {...(coachmarkTargets !== undefined ? { chipRef: coachmarkTargets.rir } : {})}
              explanation={rirExplanation({ targetRir, isDeload })}
            />
          )}
          {view.deloadLabel !== undefined && (
            <RirBadge
              testID="exercise-deload"
              accessibilityLabel="Deload, what changes this week?"
              label={view.deloadLabel}
              explanation={deloadExplanation({
                ...(exercise.type === undefined ? {} : { type: exercise.type }),
                ...(targetRir === undefined ? {} : { targetRir }),
              })}
            />
          )}
        </>
      }
      overlays={
        <>
          {repsInfo?.kind === 'swap' && (
            <WeightSwapPopoverPlate
              popover={repsInfo.popover}
              visible={repsAnchor.visible}
              anchor={repsAnchor.anchor}
              onClose={repsAnchor.close}
            />
          )}
          {repsInfo?.kind === 'band' && (
            <CorridorStepsPopover
              plate={repsInfo.plate}
              visible={repsAnchor.visible}
              anchor={repsAnchor.anchor}
              onClose={repsAnchor.close}
            />
          )}
          {infoTargets.weight && (
            <FirstWeightPopover
              visible={weightAnchor.visible}
              anchor={weightAnchor.anchor}
              onClose={weightAnchor.close}
              copy={firstWeightCopy(exercise.type, targetRir)}
            />
          )}
        </>
      }
    >
      {exercise.weightHints?.map((hint) => {
        const Icon = hint.direction === 'increase' ? ArrowUpIcon : ArrowDownIcon;
        return (
          <View key={hint.direction} testID="exercise-weight-hint" style={styles.weightHint}>
            <Icon size={ICON_SIZES['icon/inline']} color={COLORS['text/secondary']} />
            <Text style={styles.weightHintText}>{formatWeightHint(hint, exercise.equipment)}</Text>
          </View>
        );
      })}

      {view.showRows && (
        <ExerciseColumnHeader
          columns={[
            {
              label: strengthWeightColumnLabel(exercise.equipment),
              ...(infoTargets.weight
                ? {
                    info: {
                      buttonRef: weightAnchor.ref,
                      ...(coachmarkTargets !== undefined
                        ? { discRef: coachmarkTargets.weight }
                        : {}),
                      accessibilityLabel: 'Finding your weight',
                      open: weightAnchor.visible,
                      onPress: weightAnchor.open,
                    },
                  }
                : {}),
            },
            {
              label: 'Reps',
              ...(repsInfo !== undefined
                ? {
                    info: {
                      buttonRef: repsAnchor.ref,
                      ...(coachmarkTargets !== undefined ? { discRef: coachmarkTargets.reps } : {}),
                      accessibilityLabel:
                        repsInfo.kind === 'band' ? 'About reps with a band' : 'Weight recommendations',
                      open: repsAnchor.visible,
                      onPress: repsAnchor.open,
                    },
                  }
                : {}),
            },
          ]}
        />
      )}
      {view.showRows && (
        // Keyed by the exercise: a replaced exercise's rows start fresh from its new targets and
        // an empty set of weight edits, instead of keeping what was typed for the old one.
        <WorkoutSetRows
          key={exercise.exerciseId}
          rows={exercise.rows}
          targetRir={targetRir}
          loadEquipment={exercise.equipment}
          guided={exercise.isGuided === true}
          editable={editable}
          isSaving={isSaving}
          {...sets}
        />
      )}
    </ExerciseCardFrame>
  );
}

/** The ⓘ plate — the ranges of the first unlogged set, or why there are none (08.7.1). */
function WeightSwapPopoverPlate({
  popover,
  visible,
  anchor,
  onClose,
}: {
  popover: WeightSwapPopover;
  visible: boolean;
  anchor: AnchorRect | null;
  onClose: () => void;
}) {
  if (popover.kind === 'no-history') {
    return (
      <CorridorStepsPopover plate={popover} visible={visible} anchor={anchor} onClose={onClose} />
    );
  }
  return (
    <Popover
      visible={visible}
      onClose={onClose}
      anchor={anchor}
      title={popover.title}
      subtitle={popover.subtitle}
    >
      <RangeTrack
        outer={popover.outer}
        inner={popover.inner}
        marker={popover.marker}
        labels={popover.labels}
        accessibilityLabel={popover.title}
      />
      <View style={styles.legend}>
        {popover.legend.map((line) => (
          <View key={line.label} style={styles.legendRow}>
            <RangeTrackSwatch span={line.span} />
            <Text style={styles.legendLabel}>{line.label}</Text>
            <Text style={styles.legendValue}>{line.value}</Text>
          </View>
        ))}
      </View>
    </Popover>
  );
}
