// Step 3 of 3's own content in the mesocycle editor, Flow A — see 08.5 · Редактор мезоцикла —
// Flow A, "Шаг 3 — Review & confirm" (task 078). A read-only summary of the draft: a summary card
// (name, length, days per week), a block on how a cycle progresses until its cross puts it away
// (GT-225), and a week 1 preview listing each day's exercises with `N sets` — or, for a power, interval or
// mobility one, its plan on one line (GT-157).
// The `›` chevron in each day's header replaces the removed `Edit` button (08.5, "Убрано после
// ревью") and hands `dayNumber` back to the caller, which returns to step 2 with that day active.
//
// Fully controlled, the same way MesoEditorDaysStep.tsx is: the caller (app/meso-editor/new.tsx)
// owns the draft and the resolved exercise records. `Save cycle` lives in the shared footer,
// not here — see app/meso-editor/new.tsx.
//
// JSX/rendering only — styles live in MesoEditorReviewStepStyles.ts and pure helpers in
// MesoEditorReviewStepLogic.ts, per the code-style skill.

import { Pressable, ScrollView, Text, View } from 'react-native';

import { PlateBox } from '@design/components/PlateBox';
import { PlateRow } from '@design/components/PlateRow';
import { CloseIcon } from '@design/icons/CloseIcon';
import { tapTargetSlop } from '@design/shapes';
import { COLORS, ICON_SIZES } from '@design/tokens';

import {
  exerciseDotColor,
  exerciseTitle,
  exerciseTypeIcon,
  getDayExercises,
  getDayNumbers,
  type ExercisesByDay,
  type ExercisesById,
} from './MesoEditorDaysStepLogic';
import {
  formatReviewCount,
  formatReviewSummary,
  REVIEW_PROGRESSION_FACTS,
  REVIEW_PROGRESSION_HIDE_LABEL,
  REVIEW_PROGRESSION_LABEL,
} from './MesoEditorReviewStepLogic';
import { styles } from './MesoEditorReviewStepStyles';

export type MesoEditorReviewStepProps = {
  name: string;
  lengthWeeks: number;
  daysPerWeek: number;
  exercisesByDay: ExercisesByDay;
  exercisesById: ExercisesById;
  /** The block on how a cycle progresses — until it is hidden (`showsProgressionBlock`). */
  showProgression?: boolean;
  /** Its cross in the corner: puts the block away for good, with no confirmation. */
  onHideProgression?: () => void;
  onEditDay: (dayNumber: number) => void;
};

export function MesoEditorReviewStep({
  name,
  lengthWeeks,
  daysPerWeek,
  exercisesByDay,
  exercisesById,
  showProgression = false,
  onHideProgression,
  onEditDay,
}: MesoEditorReviewStepProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      bounces={false}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={styles.card}>
        <Text style={styles.summaryName}>{name}</Text>
        <Text style={styles.summaryMeta}>{formatReviewSummary(lengthWeeks, daysPerWeek)}</Text>
      </View>

      {showProgression && (
        <View testID="review-progression" style={styles.progression}>
          <PlateBox label={REVIEW_PROGRESSION_LABEL} accent>
            {onHideProgression !== undefined && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={REVIEW_PROGRESSION_HIDE_LABEL}
                onPress={onHideProgression}
                hitSlop={tapTargetSlop(ICON_SIZES['icon/inline'])}
                style={styles.progressionHide}
              >
                <CloseIcon size={ICON_SIZES['icon/inline']} color={COLORS['text/muted']} />
              </Pressable>
            )}
            <View style={styles.progressionRows}>
              {REVIEW_PROGRESSION_FACTS.map((text, index) => (
                <PlateRow key={index} compact accent leading={{ number: index + 1 }} text={text} />
              ))}
            </View>
          </PlateBox>
        </View>
      )}

      <Text style={styles.sectionLabel}>Week 1</Text>

      {getDayNumbers(daysPerWeek).map((day) => (
        <View key={day} style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit Day ${day}`}
            onPress={() => onEditDay(day)}
            style={styles.dayHeader}
          >
            <Text style={styles.dayTitle}>{`Day ${day}`}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          {getDayExercises(exercisesByDay, day).map((exercise) => {
            const dotColor = exerciseDotColor(exercisesById, exercise.exerciseId);
            const TypeIcon = exerciseTypeIcon(exercisesById, exercise.exerciseId);
            return (
              <View key={`${exercise.exerciseId}-${exercise.order}`} style={styles.exerciseRow}>
                {TypeIcon ? (
                  <View style={styles.typeIcon}>
                    <TypeIcon size={ICON_SIZES['icon/glyph']} color={COLORS['text/secondary']} />
                  </View>
                ) : (
                  <View
                    style={[styles.dot, dotColor !== undefined && { backgroundColor: dotColor }]}
                  />
                )}
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {exerciseTitle(exercisesById, exercise.exerciseId)}
                </Text>
                <Text style={styles.exerciseSets}>
                  {formatReviewCount(exercisesById, exercise)}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
