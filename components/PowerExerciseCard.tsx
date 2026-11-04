// A power exercise's card — 10.2 · Power progression; 10.1 FR-2, FR-3, FR-14. Inside the shared
// frame (ExerciseCardFrame): no RIR (P5), the `Deload` chip on a deload week, the note at the top of
// the corridor with its links (P6–P9, GT-81), then `Load, kg` / `Level` / `Bodyweight, kg` and
// `Fast reps` over guided set rows (P11) — no hit indicator, no weight swap. One ⓘ, in the first
// column (08.11, "Правило ⓘ"): the set's target in the corridor if it has one, and how to find the
// load if not.
//
// Presentational: the exercise, the screen mode, and the button handlers come in as props.

import { Pressable, Text, View } from 'react-native';

import { InlineNote } from '@design/components/InlineNote';
import { PlateRow } from '@design/components/PlateRow';
import { Popover } from '@design/components/Popover';
import { RangeTrack } from '@design/components/RangeTrack';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { ArrowUpIcon } from '@design/icons/ArrowUpIcon';
import { CheckIcon } from '@design/icons/CheckIcon';
import { PlusIcon } from '@design/icons/PlusIcon';
import { SwapIcon } from '@design/icons/SwapIcon';
import { TargetIcon } from '@design/icons/TargetIcon';
import type { AnchorRect } from '@design/popoverLayout';
import { POWER_MIN_REPS } from '@domain/progressionCorridor';
import type { PowerWorkoutExercise } from '@usecases/workoutSession';

import { ExerciseCardFrame } from './ExerciseCardFrame';
import { ExerciseColumnHeader } from './ExerciseColumnHeader';
import { FirstWeightPopover } from './FirstWeightPopover';
import { firstWeightCopy } from './FirstWeightPopoverLogic';
import {
  formatCeilingNote,
  powerLoadColumnLabel,
  showsPowerInfo,
  topWeightOf,
} from './PowerExerciseCardLogic';
import { styles } from './PowerExerciseCardStyles';
import { type PowerTargetPlate, powerTargetPlate } from './PowerTargetPlateLogic';
import { RirBadge } from './RirBadge';
import { deloadExplanation } from './RirExplanationLogic';
import { usePopoverAnchor } from './usePopoverAnchor';
import type { CeilingActions, ExerciseCardCommonProps } from './WorkoutExerciseCard';
import {
  cardLoadEquipment,
  cardRowsOf,
  exerciseCardView,
  firstUnloggedRow,
} from './WorkoutExerciseCardLogic';
import { exerciseLogCounts, formatExerciseMenuSubtitle } from './WorkoutExerciseMenuLogic';
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
  onOpenOverview,
  menuItems,
  isSaving,
  sets,
  ceiling,
}: PowerExerciseCardProps) {
  const view = exerciseCardView(mode, exercise, cardRowsOf(exercise.rows), isDeload);
  const editable = mode === 'live' && !view.isNotDone;
  const loadEquipment = cardLoadEquipment(exercise);
  const ceilingNote =
    exercise.ceilingHint === undefined
      ? undefined
      : formatCeilingNote(exercise.ceilingHint, {
          load: exercise.powerLoad,
          ...topWeightOf(exercise.rows),
        });
  const showsInfo = showsPowerInfo(mode, isDeload);
  // The ⓘ speaks for the set whose Log box carries the accent, as a strength card's does.
  const target = powerTargetPlate(firstUnloggedRow(exercise.rows), exercise.powerLoad);
  const loadCopy = firstWeightCopy('power', undefined, exercise.powerLoad);
  const infoAnchor = usePopoverAnchor();

  return (
    <ExerciseCardFrame
      {...(coachmarkTargets?.card !== undefined ? { cardRef: coachmarkTargets.card } : {})}
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
          {showsInfo && target !== undefined && (
            <PowerTargetPopover
              plate={target}
              visible={infoAnchor.visible}
              anchor={infoAnchor.anchor}
              onClose={infoAnchor.close}
            />
          )}
          {showsInfo && target === undefined && (
            <FirstWeightPopover
              visible={infoAnchor.visible}
              anchor={infoAnchor.anchor}
              onClose={infoAnchor.close}
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
              ...(showsInfo
                ? {
                    info: {
                      buttonRef: infoAnchor.ref,
                      ...(coachmarkTargets?.weight !== undefined
                        ? { discRef: coachmarkTargets.weight }
                        : {}),
                      accessibilityLabel: target !== undefined ? 'Set target' : loadCopy.title,
                      open: infoAnchor.visible,
                      onPress: infoAnchor.open,
                    },
                  }
                : {}),
            },
            { label: 'Fast reps' },
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

/** One icon per line of the plate, in its order: the rule of a set, then what comes of it. */
const TARGET_ROW_ICONS = [TargetIcon, CheckIcon] as const;

/** The ⓘ's plate while the set has a target (08.11, "Power: Load ⓘ"). */
function PowerTargetPopover({
  plate,
  visible,
  anchor,
  onClose,
}: {
  plate: PowerTargetPlate;
  visible: boolean;
  anchor: AnchorRect | null;
  onClose: () => void;
}) {
  return (
    <Popover
      visible={visible}
      onClose={onClose}
      anchor={anchor}
      title={plate.title}
      {...(plate.subtitle !== undefined ? { subtitle: plate.subtitle } : {})}
    >
      <RangeTrack
        outer={plate.corridor.outer}
        inner={plate.corridor.inner}
        marker={plate.marker}
        labels={plate.corridor.labels}
        accessibilityLabel={plate.corridor.accessibilityLabel}
      />
      <View style={styles.targetRows}>
        {TARGET_ROW_ICONS.map((icon, index) => (
          <PlateRow key={index} leading={{ icon }} text={plate.rows[index] ?? []} />
        ))}
      </View>
    </Popover>
  );
}

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
