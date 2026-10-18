// The card of an exercise whose plan is sets — strength and power, for now one card for both
// (08.7 · Тренировка, "Карточка упражнения", task 092; 10.2 for power). GT-169 splits it into a
// strength card and a power card. Inside the shared frame (ExerciseCardFrame): the `N RIR` chip or
// the `Deload` one, the weight hints or power's ceiling note, the column header and the set rows.
//
// Under the title, one line per weight hint (03, rule 3: `↑ Go heavier — 30+ reps last week` /
// `↓ Go lighter — under 5 reps last week`), in live mode only. 08 · Screens & Navigation leaves it
// off in v1; Artem brought it back: without it, a target clamped at the rep corridor's bound (30
// again at the same weight) read as a wrong suggestion.
//
// The set rows are WorkoutSetRows; they're editable only in live mode on an exercise that isn't
// skipped — a skipped exercise's rows are read-only until it's unskipped (05).
//
// The RIR is a static `Chip` (inside `RirBadge`, a button that explains it — GT-40), not the neutral `Badge` 08.7 names: `Badge` neutral fills with
// `surface/card`, the card's own background, so on the card it read as bare text. The chip's
// `border/default` outline keeps it visibly a chip (Artem's review).
//
// Presentational: the exercise, the screen mode, and the button handlers come in as props.
// JSX/rendering only — styles live in SetsExerciseCardStyles.ts and pure helpers in
// WorkoutExerciseCardLogic.ts, per the code-style skill.

import { Pressable, Text, View } from 'react-native';

import { InlineNote } from '@design/components/InlineNote';
import { PlateRow } from '@design/components/PlateRow';
import { Popover } from '@design/components/Popover';
import { RangeTrack, RangeTrackSwatch } from '@design/components/RangeTrack';
import { ArrowDownIcon } from '@design/icons/ArrowDownIcon';
import { ArrowUpIcon } from '@design/icons/ArrowUpIcon';
import { PlusIcon } from '@design/icons/PlusIcon';
import { SwapIcon } from '@design/icons/SwapIcon';
import type { AnchorRect } from '@design/popoverLayout';
import { COLORS, ICON_SIZES } from '@design/tokens';
import { POWER_MIN_REPS } from '@domain/progressionCorridor';
import type { WorkoutExercise } from '@usecases/workoutSession';

import { ExerciseCardFrame } from './ExerciseCardFrame';
import { ExerciseColumnHeader } from './ExerciseColumnHeader';
import { FastRepsPopover } from './FastRepsPopover';
import { FirstWeightPopover } from './FirstWeightPopover';
import { firstWeightCopy } from './FirstWeightPopoverLogic';
import { RirBadge } from './RirBadge';
import { deloadExplanation, rirExplanation } from './RirExplanationLogic';
import { styles } from './SetsExerciseCardStyles';
import { usePopoverAnchor } from './usePopoverAnchor';
import type { CeilingActions, ExerciseCardCommonProps } from './WorkoutExerciseCard';
import {
  type WeightSwapPopover,
  cardInfoTargets,
  cardLoadEquipment,
  exerciseCardView,
  firstUnloggedRow,
  formatCeilingNote,
  formatWeightHint,
  targetRirOf,
  topWeightOf,
  weightColumnLabel,
  weightSwapPopover,
  workoutEquipmentLabel,
} from './WorkoutExerciseCardLogic';
import { type SetLoggingProps, WorkoutSetRows } from './WorkoutSetRows';

export type SetsExerciseCardProps = ExerciseCardCommonProps & {
  exercise: WorkoutExercise;
  sets: SetLoggingProps;
  ceiling?: CeilingActions;
};

export function SetsExerciseCard({
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
}: SetsExerciseCardProps) {
  const targetRir = targetRirOf(exercise);
  const view = exerciseCardView(mode, { ...exercise, targetRir }, isDeload);
  const editable = mode === 'live' && !view.isNotDone;
  // The ⓘ speaks for the set whose Log box carries the accent, and always for its original target
  // — never for whatever is in the Weight field right now (08.7.1).
  const popover = weightSwapPopover(firstUnloggedRow(exercise.rows), targetRir);
  // Two ⓘ buttons, each with its own plate: Weight's static how-to (08.11) and Reps' ranges (08.7.1).
  const weightInfo = usePopoverAnchor();
  const repsInfo = usePopoverAnchor();
  const isPower = exercise.type === 'power';
  const ceilingNote =
    exercise.type !== 'power' || exercise.ceilingHint === undefined
      ? undefined
      : formatCeilingNote(exercise.ceilingHint, {
          load: exercise.powerLoad,
          ...topWeightOf(exercise.rows),
        });
  const loadEquipment = cardLoadEquipment(exercise);
  const infoTargets = cardInfoTargets({ ...exercise, targetRir, loadEquipment }, mode, isDeload);
  const showWeightInfo = infoTargets.weight;

  return (
    <ExerciseCardFrame
      exercise={exercise}
      view={view}
      {...(exercise.equipment !== undefined
        ? { equipmentLabel: workoutEquipmentLabel(exercise.equipment) }
        : {})}
      {...(chip !== undefined ? { chip } : {})}
      position={position}
      onOpenHistory={onOpenHistory}
      menuItems={menuItems}
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
                ...(exercise.type === 'power' ? { powerLoad: exercise.powerLoad } : {}),
                ...(targetRir === undefined ? {} : { targetRir }),
              })}
            />
          )}
        </>
      }
      overlays={
        <>
          {popover !== undefined && (
            <WeightSwapPopoverPlate
              popover={popover}
              visible={repsInfo.visible}
              anchor={repsInfo.anchor}
              onClose={repsInfo.close}
            />
          )}
          {isPower && (
            <FastRepsPopover
              visible={repsInfo.visible}
              anchor={repsInfo.anchor}
              onClose={repsInfo.close}
            />
          )}
          {showWeightInfo && (
            <FirstWeightPopover
              visible={weightInfo.visible}
              anchor={weightInfo.anchor}
              onClose={weightInfo.close}
              copy={firstWeightCopy(exercise.type, targetRir)}
            />
          )}
        </>
      }
    >
      {exercise.type !== 'power' &&
        exercise.weightHints?.map((hint) => {
          const Icon = hint.direction === 'increase' ? ArrowUpIcon : ArrowDownIcon;
          return (
            <View key={hint.direction} testID="exercise-weight-hint" style={styles.weightHint}>
              <Icon size={ICON_SIZES['icon/inline']} color={COLORS['text/secondary']} />
              <Text style={styles.weightHintText}>
                {formatWeightHint(hint, exercise.equipment)}
              </Text>
            </View>
          );
        })}

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

      {view.showSets && (
        <ExerciseColumnHeader
          columns={[
            {
              label: weightColumnLabel({ ...exercise, loadEquipment }),
              ...(showWeightInfo
                ? {
                    info: {
                      buttonRef: weightInfo.ref,
                      ...(coachmarkTargets !== undefined
                        ? { discRef: coachmarkTargets.weight }
                        : {}),
                      accessibilityLabel: 'Finding your weight',
                      open: weightInfo.visible,
                      onPress: weightInfo.open,
                    },
                  }
                : {}),
            },
            {
              label: isPower ? 'Fast reps' : 'Reps',
              ...(infoTargets.reps || isPower
                ? {
                    info: {
                      buttonRef: repsInfo.ref,
                      ...(coachmarkTargets !== undefined ? { discRef: coachmarkTargets.reps } : {}),
                      accessibilityLabel: isPower ? 'About fast reps' : 'Weight recommendations',
                      open: repsInfo.visible,
                      onPress: repsInfo.open,
                    },
                  }
                : {}),
            },
          ]}
          indicatorColumn={exercise.isGuided !== true}
        />
      )}
      {view.showSets && (
        // Keyed by the exercise: a replaced exercise's rows start fresh from its new targets and
        // an empty set of weight edits, instead of keeping what was typed for the old one.
        <WorkoutSetRows
          key={exercise.exerciseId}
          rows={exercise.rows}
          targetRir={targetRir}
          loadEquipment={loadEquipment}
          guided={exercise.isGuided === true}
          {...(isPower ? { raisedWeightReps: POWER_MIN_REPS } : {})}
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
    const [first, ...rest] = popover.steps;
    return (
      <Popover visible={visible} onClose={onClose} anchor={anchor} title={popover.title}>
        {/* The weight to pick comes first, the corridor it is measured in right under it, then the
            rest — the order Artem asked for (07.10.2026). Gaps are the recommended-weight plate's:
            `space/xl` between blocks, `space/dots` between rows. */}
        <View style={styles.popoverSteps}>
          {first !== undefined && <PlateRow compact leading={{ number: 1 }} text={first} />}
        </View>
        <RangeTrack
          outer={popover.corridor.outer}
          inner={popover.corridor.inner}
          labels={popover.corridor.labels}
          accessibilityLabel={popover.corridor.accessibilityLabel}
        />
        <View style={[styles.popoverSteps, styles.popoverStepsAfterTrack]}>
          {rest.map((step, index) => (
            <PlateRow compact key={index} leading={{ number: index + 2 }} text={step} />
          ))}
        </View>
      </Popover>
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
