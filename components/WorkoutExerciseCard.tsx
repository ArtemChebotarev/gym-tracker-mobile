// Exercise card — 08.7 · Тренировка, "Карточка упражнения" (task 092). One unit of the workout
// screen's list: the muscle-group chip (only when the group changed from the previous card), the
// name, equipment, the `N RIR` chip, the history button, `⋯` in live mode only, the `Weight, kg` ·
// `Reps` · `Log` column header, and the set rows. Which of these show is `exerciseCardView`'s call
// (WorkoutExerciseCardLogic.ts): live, read-only, skipped (50% opacity; every row, the unlogged ones
// as `Skipped` rows — just one `Skipped` note when nothing was logged), or preview (the `Not programmed yet` plate, no RIR badge, no rows).
//
// Under the title, one line per weight hint (03, rule 3: `↑ Go heavier — 30+ reps last week` /
// `↓ Go lighter — under 5 reps last week`), in live mode only. 08 · Screens & Navigation leaves it
// off in v1; Artem brought it back: without it, a target clamped at the rep corridor's bound (30
// again at the same weight) read as a wrong suggestion.
//
// The set rows are WorkoutSetRow (093); they're editable only in live mode on an exercise that isn't
// skipped — a skipped exercise's rows are read-only until it's unskipped (05). Their Weight fields
// are held here, in `SetRows`, rather than in each row: a weight typed in one set carries into the
// exercise's later unlogged sets (task 106, `carryWeightForward`). Reps stay in the row — they
// don't carry.
//
// The RIR is a static `Chip`, not the neutral `Badge` 08.7 names: `Badge` neutral fills with
// `surface/card`, the card's own background, so on the card it read as bare text. The chip's
// `border/default` outline keeps it visibly a chip (Artem's review).
//
// Presentational: the exercise, the screen mode, and the button handlers come in as props.
// JSX/rendering only — styles live in WorkoutExerciseCardStyles.ts and pure helpers in
// WorkoutExerciseCardLogic.ts, per the code-style skill.

import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Chip } from '@design/components/Chip';
import { IconButton } from '@design/components/IconButton';
import { InlineNote } from '@design/components/InlineNote';
import { Popover } from '@design/components/Popover';
import { RangeTrack, RangeTrackSwatch } from '@design/components/RangeTrack';
import type { AnchorRect } from '@design/popoverLayout';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { ArrowDownIcon } from '@design/icons/ArrowDownIcon';
import { ArrowUpIcon } from '@design/icons/ArrowUpIcon';
import { HistoryIcon } from '@design/icons/HistoryIcon';
import { InfoIcon } from '@design/icons/InfoIcon';
import { MoreIcon } from '@design/icons/MoreIcon';
import { isBodyWeightExercise, isPureBodyWeight, usesAddedWeight } from '@domain/bodyWeightLoad';
import { getMuscleGroupChipColors } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import { COLORS, ICON_SIZES } from '@design/tokens';
import type { MuscleGroup } from '@domain/catalog';
import type { WorkoutMode } from '@domain/workoutView';
import type { WorkoutExercise } from '@usecases/workoutSession';

import {
  type WeightEdits,
  type WeightSwapPopover,
  carryWeightForward,
  editWeightText,
  exerciseCardView,
  firstUnloggedRow,
  formatWeightHint,
  holdLoggedWeight,
  weightFieldText,
  weightSwapNote,
  weightSwapPopover,
} from './WorkoutExerciseCardLogic';
import { styles } from './WorkoutExerciseCardStyles';
import { parseWeight } from './WorkoutSetRowLogic';
import { WorkoutSetRow } from './WorkoutSetRow';

export type WorkoutExerciseCardProps = {
  exercise: WorkoutExercise;
  mode: WorkoutMode;
  /** The group chip above the card — see `showsGroupChip`. */
  showGroupChip: boolean;
  /** Opens "История упражнения" (06). */
  onOpenHistory: () => void;
  /** Opens the "Меню упражнения" sheet. Live mode only — the button isn't there otherwise. */
  onOpenMenu: () => void;
  /** The block's body weight (task 105) — fills a pure bodyweight row and tops up a weighted one. */
  bodyWeight?: number;
  /**
   * The Weight field of a pure bodyweight exercise *is* the block's body weight, so editing it
   * sets a new one (task 105, Artem's call — there's no separate place to change it).
   */
  onBodyWeightChange?: (bodyWeight: number) => void;
  /** Opens the body weight sheet — the Weight cell asks for it until the block has one (105). */
  onRequestBodyWeight?: () => void;
  /** A log or un-log is being saved — every Log box waits for it. */
  isSaving: boolean;
  onLogSet: (
    setNumber: number,
    entry: { weight: number; reps: number; bodyWeight?: number },
  ) => void;
  onUnlogSet: (setNumber: number) => void;
};

export function WorkoutExerciseCard({
  exercise,
  mode,
  showGroupChip,
  onOpenHistory,
  onOpenMenu,
  bodyWeight,
  onBodyWeightChange,
  onRequestBodyWeight,
  isSaving,
  onLogSet,
  onUnlogSet,
}: WorkoutExerciseCardProps) {
  const view = exerciseCardView(mode, exercise);
  const editable = mode === 'live' && !view.isSkipped;
  // The ⓘ speaks for the set whose Log box carries the accent, and always for its original target
  // — never for whatever is in the Weight field right now (08.7.1).
  const popover = weightSwapPopover(firstUnloggedRow(exercise.rows), exercise.targetRir);
  const infoRef = useRef<View>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);

  function openPopover() {
    // The plate points at the button, so it measures it — and opens either way: a platform that
    // answers nothing gets a centred plate rather than a tap that did nothing (see Popover).
    infoRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
    setInfoOpen(true);
  }

  function closePopover() {
    setInfoOpen(false);
    setAnchor(null);
  }

  return (
    <View style={styles.root}>
      {showGroupChip && <GroupChip muscleGroup={exercise.muscleGroup} />}
      <View
        testID={`exercise-card-${exercise.sessionExerciseId}`}
        style={[styles.card, view.isSkipped && styles.skipped]}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.name}>{exercise.name}</Text>
            {exercise.equipment !== undefined && (
              <Text style={styles.equipment}>{getEquipmentLabel(exercise.equipment)}</Text>
            )}
          </View>
          <View style={styles.titleActions}>
            {view.rirLabel !== undefined && (
              // Chip's own `alignSelf: flex-start` would pin it to the top of the row; the wrapper
              // is what gets centered against the buttons.
              <View testID="exercise-rir">
                <Chip variant="static" label={view.rirLabel} compact />
              </View>
            )}
            <IconButton accessibilityLabel={`${exercise.name} history`} onPress={onOpenHistory}>
              <HistoryIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
            </IconButton>
            {view.showMenu && (
              <IconButton accessibilityLabel={`${exercise.name} menu`} onPress={onOpenMenu}>
                <MoreIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
              </IconButton>
            )}
          </View>
        </View>

        {exercise.weightHints?.map((hint) => {
          const Icon = hint.direction === 'increase' ? ArrowUpIcon : ArrowDownIcon;
          return (
            <View key={hint.direction} testID="exercise-weight-hint" style={styles.weightHint}>
              <Icon size={ICON_SIZES['icon/inline']} color={COLORS['text/secondary']} />
              <Text style={styles.weightHintText}>{formatWeightHint(hint)}</Text>
            </View>
          );
        })}

        {view.showNotProgrammed && (
          <View style={styles.notProgrammed}>
            <InfoIcon size={ICON_SIZES['icon/inline']} color={COLORS['text/muted']} />
            <Text style={styles.notProgrammedText}>Not programmed yet</Text>
          </View>
        )}

        {view.showSets && (
          <View style={styles.headerRow}>
            <Text style={[styles.valueColumn, styles.columnLabel]}>
              {usesAddedWeight(exercise.equipment) ? 'Added, kg' : 'Weight, kg'}
            </Text>
            <View style={[styles.valueColumn, styles.repsHeader]}>
              <Text style={styles.columnLabel}>Reps</Text>
              {mode === 'live' && popover !== undefined && (
                <Pressable
                  ref={infoRef}
                  accessibilityRole="button"
                  accessibilityLabel="Weight recommendations"
                  accessibilityState={{ expanded: infoOpen }}
                  onPress={openPopover}
                  style={styles.infoButton}
                >
                  <View style={[styles.infoDisc, infoOpen && styles.infoDiscOpen]}>
                    <InfoIcon
                      size={ICON_SIZES['icon/glyph']}
                      color={infoOpen ? COLORS['text/primary'] : COLORS['text/muted']}
                    />
                  </View>
                </Pressable>
              )}
            </View>
            <View style={styles.indicatorColumn} />
            <Text style={[styles.logColumn, styles.columnLabel]}>Log</Text>
          </View>
        )}
        {view.showSets && (
          // Keyed by the exercise: a replaced exercise's rows start fresh from its new targets and
          // an empty set of weight edits, instead of keeping what was typed for the old one.
          <SetRows
            key={exercise.exerciseId}
            exercise={exercise}
            editable={editable}
            bodyWeight={bodyWeight}
            onBodyWeightChange={onBodyWeightChange}
            onRequestBodyWeight={onRequestBodyWeight}
            isSaving={isSaving}
            onLogSet={onLogSet}
            onUnlogSet={onUnlogSet}
          />
        )}
        {view.showSkippedNote && <Text style={styles.skippedNote}>Skipped</Text>}
      </View>
      {popover !== undefined && (
        <WeightSwapPopoverPlate
          popover={popover}
          visible={infoOpen}
          anchor={anchor}
          onClose={closePopover}
        />
      )}
    </View>
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
      <Popover visible={visible} onClose={onClose} anchor={anchor} title={popover.title}>
        <Text style={styles.popoverText}>{popover.text}</Text>
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
      footer={<Text style={styles.popoverFooter}>{popover.footer}</Text>}
    >
      <RangeTrack
        outer={popover.outer}
        inner={popover.inner}
        marker={popover.marker}
        labels={popover.labels}
        accessibilityLabel={popover.subtitle}
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

function GroupChip({ muscleGroup }: { muscleGroup: MuscleGroup }) {
  const colors = getMuscleGroupChipColors(muscleGroup);

  return (
    <View
      testID="exercise-group-chip"
      style={[styles.groupChip, { backgroundColor: colors.tint ?? COLORS['surface/card'] }]}
    >
      {colors.dot !== undefined && (
        <View style={[styles.groupDot, { backgroundColor: colors.dot }]} />
      )}
      <Text style={[styles.groupLabel, { color: colors.text ?? COLORS['text/secondary'] }]}>
        {getMuscleGroupLabel(muscleGroup)}
      </Text>
    </View>
  );
}

function SetRows({
  exercise,
  editable,
  bodyWeight,
  onBodyWeightChange,
  onRequestBodyWeight,
  isSaving,
  onLogSet,
  onUnlogSet,
}: Pick<
  WorkoutExerciseCardProps,
  | 'exercise'
  | 'bodyWeight'
  | 'onBodyWeightChange'
  | 'onRequestBodyWeight'
  | 'isSaving'
  | 'onLogSet'
  | 'onUnlogSet'
> & {
  editable: boolean;
}) {
  const [weights, setWeights] = useState<WeightEdits>({});
  const { rows } = exercise;
  const isBodyWeightField = isPureBodyWeight(exercise.equipment);
  // Until the block has a body weight, a bodyweight exercise's Weight cell asks for one rather
  // than taking a number: there's nothing meaningful to type there yet (task 105).
  const asksForBodyWeight =
    isBodyWeightExercise(exercise.equipment) && bodyWeight === undefined && editable;

  function handleWeightBlur(setNumber: number, text: string) {
    setWeights((edits) => carryWeightForward(edits, rows, setNumber));
    if (!isBodyWeightField || onBodyWeightChange === undefined) {
      return;
    }
    // On a pure bodyweight exercise this field holds the body weight itself, so what was typed
    // here is the block's new one — it reaches every bodyweight set still to be logged (task 105).
    const entered = parseWeight(text);
    if (entered !== null && entered > 0 && entered !== bodyWeight) {
      onBodyWeightChange(entered);
    }
  }

  // One note per card, for the set that is next to do and only while its weight has taken the
  // target out of reach (08.7.1) — the Weight fields live here, so this is where it can be read.
  const next = firstUnloggedRow(rows);
  const note = weightSwapNote(
    next,
    next === undefined ? '' : weightFieldText(weights, next, exercise.equipment, bodyWeight),
    exercise.targetRir,
  );

  return (
    <>
      {rows.map((row) => (
        <WorkoutSetRow
          key={row.setNumber}
          row={row}
          targetRir={exercise.targetRir}
          equipment={exercise.equipment}
          bodyWeight={bodyWeight}
          {...(asksForBodyWeight && onRequestBodyWeight !== undefined
            ? { onRequestBodyWeight }
            : {})}
          weightText={weightFieldText(weights, row, exercise.equipment, bodyWeight)}
          onChangeWeight={(text) =>
            setWeights((edits) => editWeightText(edits, row.setNumber, text))
          }
          onBlurWeight={() =>
            handleWeightBlur(row.setNumber, weightFieldText(weights, row, exercise.equipment, bodyWeight))
          }
          editable={editable}
          isSaving={isSaving}
          onLog={(entry) => onLogSet(row.setNumber, entry)}
          onUnlog={() => {
            const logged = row.log;
            if (logged !== undefined) {
              setWeights((edits) => holdLoggedWeight(edits, row.setNumber, logged.weight));
            }
            onUnlogSet(row.setNumber);
          }}
        />
      ))}
      {editable && note !== undefined && <InlineNote lead={note.lead} text={note.text} />}
    </>
  );
}
