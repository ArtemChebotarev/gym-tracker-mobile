// A power exercise's card — 10.2 · Power progression; 10.1 FR-2, FR-3, FR-14. Inside the shared
// frame (ExerciseCardFrame): no RIR (P5), the `Deload` chip on a deload week, the note at the top of
// the corridor with its links (P6–P9, GT-81), then `Load, kg` / `Level` / `Bodyweight, kg` and
// `Fast reps` over guided set rows (P11) — no hit indicator, no weight swap. The Fast reps ⓘ says
// what a power set is; the Load ⓘ how to find the load (GT-81).
//
// Presentational: the exercise, the screen mode, and the button handlers come in as props.

import { Pressable, Text, View } from 'react-native';

import { InlineNote } from '@design/components/InlineNote';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { ArrowUpIcon } from '@design/icons/ArrowUpIcon';
import { PlusIcon } from '@design/icons/PlusIcon';
import { SwapIcon } from '@design/icons/SwapIcon';
import { POWER_MIN_REPS } from '@domain/progressionCorridor';
import type { PowerWorkoutExercise } from '@usecases/workoutSession';

import { CorridorStepsPopover } from './CorridorStepsPopover';
import { ExerciseCardFrame } from './ExerciseCardFrame';
import { ExerciseColumnHeader } from './ExerciseColumnHeader';
import { fastRepsPlate } from './FastRepsPlateLogic';
import { FirstWeightPopover } from './FirstWeightPopover';
import { firstWeightCopy } from './FirstWeightPopoverLogic';
import { formatCeilingNote, powerLoadColumnLabel, topWeightOf } from './PowerExerciseCardLogic';
import { styles } from './PowerExerciseCardStyles';
import { RirBadge } from './RirBadge';
import { deloadExplanation } from './RirExplanationLogic';
import { usePopoverAnchor } from './usePopoverAnchor';
import type { CeilingActions, ExerciseCardCommonProps } from './WorkoutExerciseCard';
import {
  cardInfoTargets,
  cardLoadEquipment,
  cardRowsOf,
  exerciseCardView,
} from './WorkoutExerciseCardLogic';
import { formatExerciseMenuSubtitle } from './WorkoutExerciseMenuLogic';
import { type SetLoggingProps, WorkoutSetRows } from './WorkoutSetRows';

export type PowerExerciseCardProps = ExerciseCardCommonProps & {
  exercise: PowerWorkoutExercise;
  sets: SetLoggingProps;
  ceiling?: CeilingActions;
};

export function PowerExerciseCard({
  exercise,
  mode,
  isDeload = false,
  coachmarkTargets,
  chip,
  position = 0,
  onOpenHistory,
  menuItems,
  isSaving,
  sets,
  ceiling,
}: PowerExerciseCardProps) {
  const view = exerciseCardView(mode, exercise, cardRowsOf(exercise.rows), isDeload);
  const editable = mode === 'live' && !view.isNotDone;
  const loadEquipment = cardLoadEquipment(exercise);
  const infoTargets = cardInfoTargets(
    { ...exercise, loadEquipment },
    exercise.rows,
    mode,
    isDeload,
  );
  const ceilingNote =
    exercise.ceilingHint === undefined
      ? undefined
      : formatCeilingNote(exercise.ceilingHint, {
          load: exercise.powerLoad,
          ...topWeightOf(exercise.rows),
        });
  // Two ⓘ buttons, each with its own plate: the Load how-to (GT-81) — a level's its own — and what
  // a fast rep is.
  const loadCopy = firstWeightCopy('power', undefined, exercise.powerLoad);
  const loadAnchor = usePopoverAnchor();
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
      menuItems={menuItems}
      menuSubtitle={formatExerciseMenuSubtitle(exercise.plannedSetCount, exercise.loggedSetCount)}
      badges={
        view.deloadLabel !== undefined && (
          <RirBadge
            testID="exercise-deload"
            accessibilityLabel="Deload, what changes this week?"
            label={view.deloadLabel}
            explanation={deloadExplanation({ type: 'power', powerLoad: exercise.powerLoad })}
          />
        )
      }
      overlays={
        <>
          <CorridorStepsPopover
            plate={fastRepsPlate()}
            visible={repsAnchor.visible}
            anchor={repsAnchor.anchor}
            onClose={repsAnchor.close}
          />
          {infoTargets.weight && (
            <FirstWeightPopover
              visible={loadAnchor.visible}
              anchor={loadAnchor.anchor}
              onClose={loadAnchor.close}
              copy={loadCopy}
            />
          )}
        </>
      }
    >
      {ceilingNote !== undefined && (
        <InlineNote
          icon={CEILING_ICONS[ceilingNote.icon]}
          lead={ceilingNote.lead}
          text={ceilingNote.text}
        >
          <View style={styles.ceilingLinks}>
            {ceilingNote.flagLabel !== undefined &&
              ceiling?.onSetNoHeavierAvailable !== undefined && (
                <CeilingLink
                  label={ceilingNote.flagLabel}
                  onPress={ceiling.onSetNoHeavierAvailable}
                />
              )}
            {ceilingNote.replaceLabel !== undefined && ceiling?.onReplaceExercise !== undefined && (
              <CeilingLink label={ceilingNote.replaceLabel} onPress={ceiling.onReplaceExercise} />
            )}
            {ceilingNote.hideLabel !== undefined && ceiling?.onHideCeilingTip !== undefined && (
              <CeilingLink label={ceilingNote.hideLabel} onPress={ceiling.onHideCeilingTip} />
            )}
          </View>
        </InlineNote>
      )}

      {view.showRows && (
        <ExerciseColumnHeader
          columns={[
            {
              label: powerLoadColumnLabel(exercise.powerLoad),
              ...(infoTargets.weight
                ? {
                    info: {
                      buttonRef: loadAnchor.ref,
                      ...(coachmarkTargets !== undefined
                        ? { discRef: coachmarkTargets.weight }
                        : {}),
                      accessibilityLabel: loadCopy.title,
                      open: loadAnchor.visible,
                      onPress: loadAnchor.open,
                    },
                  }
                : {}),
            },
            {
              label: 'Fast reps',
              info: {
                buttonRef: repsAnchor.ref,
                ...(coachmarkTargets !== undefined ? { discRef: coachmarkTargets.reps } : {}),
                accessibilityLabel: 'About fast reps',
                open: repsAnchor.visible,
                onPress: repsAnchor.open,
              },
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
          targetRir={undefined}
          loadEquipment={loadEquipment}
          guided
          raisedWeightReps={POWER_MIN_REPS}
          editable={editable}
          isSaving={isSaving}
          {...sets}
        />
      )}
    </ExerciseCardFrame>
  );
}

const CEILING_ICONS = { up: ArrowUpIcon, swap: SwapIcon, plus: PlusIcon } as const;

/** A link in the ceiling note — an action the note leads to, underlined like the mockup's. */
function CeilingLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.ceilingFlag}
    >
      <Text style={styles.ceilingFlagText}>{label}</Text>
    </Pressable>
  );
}
