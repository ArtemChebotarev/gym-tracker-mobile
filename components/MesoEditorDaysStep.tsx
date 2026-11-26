// Step 2 of 3's own content in the mesocycle editor, Flow A — see 08.5 · Редактор мезоцикла —
// Flow A, "Шаг 2 — Days & exercises", and its mockup 02-new-meso-days.html — treated as a
// starting point rather than the literal pixel spec once on-device review found two things it
// got wrong: the per-row "sets" caption under every stepper read as visually uneven (the value
// and the caption don't share a width) and got redundant once there's more than a couple of
// rows — replaced with a single "Exercise" / "Sets" column-header row above the list instead.
// The mockup's own "Day N" / "N exercises" heading above that column header was cut entirely:
// it just repeated what the day tab immediately above it already says.
//
// Fully controlled, the same way MesoEditorBasicsStep.tsx is: the caller (app/meso-editor/
// new.tsx) owns the draft (via the zustand draft store), which day tab is active, and the
// resolved exercise records for the ids the draft references.
//
// This is just the step's own content (day tabs + exercise list + Add exercise) — the header/
// progress-bar/footer chrome shared by every step lives one level up, in
// design/components/WizardScreen.tsx (see MesoEditorBasicsStep.tsx's comment for why).
//
// `onAddExercise` opens task 077's "Add exercise" sheet (MesoEditorAddExerciseSheet.tsx),
// rendered as a sibling popup over this step's content, not as a step of its own — see that
// component's own comment.
//
// Rows are drag-to-reorder by their "≡" handle (task 080, 08.5 "Шаг 2") — `useDragReorder`
// (useDragReorder.ts), shared with the Reorder days sheet, carries the gesture and why it is
// hand-rolled. `exerciseRow`'s height is fixed to `size/exercise-row`, the row height that drag's
// math assumes (MesoEditorDaysStepStyles.ts).
//
// The ⇅ in front of `Day 1` opens MesoEditorReorderDaysSheet.tsx (GT-270) — only with two days or
// more, since one day has nowhere to go. It stays put while the tabs scroll past it, so a long week
// never pushes it off screen (Artem, 26.11.2026). The sheet edits its own copy of the order;
// the draft changes on its `Done`.
//
// The step sets exercises and their sets, nothing else (10.1 FR-9, Artem, 27.10.2026): strength
// and power have the sets stepper, an interval the same stepper for its rounds (GT-190), and a
// mobility exercise none — it is one block with nothing to set (GT-191), and its column stays
// empty. An exercise without a muscle group (GT-157) shows its type's icon where the group dot
// would be, and its type under the name. Drag, remove and order are the same for every type.
//
// JSX/rendering only — styles live in MesoEditorDaysStepStyles.ts and pure helpers in
// MesoEditorDaysStepLogic.ts, per the code-style skill.

import type { RefObject } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';

import { MAX_EXERCISE_SETS, MIN_EXERCISE_SETS } from '@domain/planValidators';
import { IconButton } from '@design/components/IconButton';
import { ReorderIcon } from '@design/icons/ReorderIcon';
import { Stepper } from '@design/components/Stepper';
import { tapTargetSlop } from '@design/shapes';
import { COLORS, ICON_SIZES, SIZES } from '@design/tokens';

import {
  exerciseDotColor,
  hasSetsStepper,
  stepperNoun,
  exerciseSubtitle,
  exerciseTitle,
  exerciseTypeIcon,
  getDayExercises,
  getDayNumbers,
  type ExercisesByDay,
  type ExercisesById,
} from './MesoEditorDaysStepLogic';
import { DayTabs } from './DayTabs';
import { REORDER_DAYS_TITLE } from './MesoEditorReorderDaysSheetLogic';
import { styles } from './MesoEditorDaysStepStyles';
import { useDragReorder } from './useDragReorder';

export type MesoEditorDaysStepProps = {
  daysPerWeek: number;
  activeDay: number;
  onChangeActiveDay: (day: number) => void;
  exercisesByDay: ExercisesByDay;
  exercisesById: ExercisesById;
  onChangeSets: (dayNumber: number, index: number, sets: number) => void;
  onRemoveExercise: (dayNumber: number, index: number) => void;
  onReorderExercises: (dayNumber: number, newOrder: readonly number[]) => void;
  onAddExercise: (dayNumber: number) => void;
  /** Opens the Reorder days sheet (GT-270). Without it, or with one day, there is no button. */
  onRequestReorderDays?: () => void;
  /** The button, for the coachmark that points at it in Flows B and C. */
  reorderDaysRef?: RefObject<View | null>;
};

export function MesoEditorDaysStep({
  daysPerWeek,
  activeDay,
  onChangeActiveDay,
  exercisesByDay,
  exercisesById,
  onChangeSets,
  onRemoveExercise,
  onReorderExercises,
  onAddExercise,
  onRequestReorderDays,
  reorderDaysRef,
}: MesoEditorDaysStepProps) {
  const dayNumbers = getDayNumbers(daysPerWeek);
  const activeDayExercises = getDayExercises(exercisesByDay, activeDay);
  const canReorderDays = onRequestReorderDays !== undefined && daysPerWeek > 1;

  const drag = useDragReorder({
    itemCount: activeDayExercises.length,
    rowHeight: SIZES['size/exercise-row'],
    onReorder: (newOrder) => onReorderExercises(activeDay, newOrder),
  });

  return (
    <>
      <View style={styles.dayTabsRow}>
        {canReorderDays && (
          <Pressable
            ref={reorderDaysRef}
            accessibilityRole="button"
            accessibilityLabel={REORDER_DAYS_TITLE}
            onPress={onRequestReorderDays}
            hitSlop={tapTargetSlop(SIZES['size/chip'])}
            style={styles.reorderDays}
          >
            <ReorderIcon size={ICON_SIZES['icon/glyph']} color={COLORS.accent} />
          </Pressable>
        )}
        <View style={styles.dayTabsScroller}>
          <DayTabs
            dayNumbers={dayNumbers}
            activeDay={activeDay}
            onChangeDay={onChangeActiveDay}
            contentContainerStyle={[
              styles.dayTabsContent,
              canReorderDays && styles.dayTabsContentAfterReorder,
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {activeDayExercises.length > 0 && (
          <View style={styles.columnHeader}>
            <View style={styles.columnHeaderHandleSpacer} />
            <View style={styles.columnHeaderDotSpacer} />
            <Text style={styles.columnHeaderExercise}>Exercise</Text>
            <Text style={styles.columnHeaderSets}>Sets</Text>
            <View style={styles.columnHeaderRemoveSpacer} />
          </View>
        )}

        {activeDayExercises.map((exercise, index) => {
          const title = exerciseTitle(exercisesById, exercise.exerciseId);
          const TypeIcon = exerciseTypeIcon(exercisesById, exercise.exerciseId);
          const isDragging = drag.draggingIndex === index;
          return (
            <Animated.View
              key={index}
              style={[
                styles.exerciseRow,
                isDragging && styles.exerciseRowDragging,
                drag.rowTransform(index),
              ]}
            >
              <View
                {...drag.handleProps(index)}
                accessibilityLabel={`Reorder ${title}`}
                hitSlop={tapTargetSlop(SIZES['size/control-inline'])}
                style={styles.dragHandle}
              >
                <Text style={styles.dragHandleGlyph}>≡</Text>
              </View>
              {TypeIcon ? (
                <View style={styles.typeIcon}>
                  <TypeIcon size={ICON_SIZES['icon/glyph']} color={COLORS['text/secondary']} />
                </View>
              ) : (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: exerciseDotColor(exercisesById, exercise.exerciseId) },
                  ]}
                />
              )}
              <View style={styles.exerciseMain}>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={styles.exerciseGroup} numberOfLines={1}>
                  {exerciseSubtitle(exercisesById, exercise.exerciseId)}
                </Text>
              </View>
              {hasSetsStepper(exercisesById, exercise.exerciseId) ? (
                <Stepper
                  label={`${title} ${stepperNoun(exercisesById, exercise.exerciseId)}`}
                  variant="inline"
                  value={exercise.sets}
                  onChange={(sets) => onChangeSets(activeDay, index, sets)}
                  min={MIN_EXERCISE_SETS}
                  max={MAX_EXERCISE_SETS}
                  valueWidth={SIZES['size/sets-value']}
                />
              ) : (
                // A mobility exercise is one block with nothing to set (GT-191).
                <View style={styles.planSlot} />
              )}
              <IconButton
                accessibilityLabel={`Remove ${title}`}
                onPress={() => onRemoveExercise(activeDay, index)}
              >
                <Text style={styles.removeIcon}>✕</Text>
              </IconButton>
            </Animated.View>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add exercise"
          onPress={() => onAddExercise(activeDay)}
          style={styles.addExerciseRow}
        >
          <View style={styles.addExerciseIcon}>
            <Text style={styles.addExerciseIconGlyph}>+</Text>
          </View>
          <Text style={styles.addExerciseLabel}>Add exercise</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}
