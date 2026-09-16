// Step 3 of 3's own content in the mesocycle editor, Flow A — see 08.5 · Редактор мезоцикла —
// Flow A, "Шаг 3 — Review & confirm" (task 078). A read-only summary of the draft: a summary card
// (name, length, days per week) and a week 1 preview listing each day's exercises with `N sets`.
// The `›` chevron in each day's header replaces the removed `Edit` button (08.5, "Убрано после
// ревью") and hands `dayNumber` back to the caller, which returns to step 2 with that day active.
//
// Fully controlled, the same way MesoEditorDaysStep.tsx is: the caller (app/meso-editor/new.tsx)
// owns the draft and the resolved exercise records. `Save mesocycle` lives in the shared footer,
// not here — see app/meso-editor/new.tsx.
//
// JSX/rendering only — styles live in MesoEditorReviewStepStyles.ts and pure helpers in
// MesoEditorReviewStepLogic.ts, per the code-style skill.

import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  exerciseDotColor,
  exerciseTitle,
  getDayExercises,
  getDayNumbers,
  type ExercisesByDay,
  type ExercisesById,
} from './MesoEditorDaysStepLogic';
import { formatReviewSummary, formatSetCount } from './MesoEditorReviewStepLogic';
import { styles } from './MesoEditorReviewStepStyles';

export type MesoEditorReviewStepProps = {
  name: string;
  lengthWeeks: number;
  daysPerWeek: number;
  exercisesByDay: ExercisesByDay;
  exercisesById: ExercisesById;
  onEditDay: (dayNumber: number) => void;
};

export function MesoEditorReviewStep({
  name,
  lengthWeeks,
  daysPerWeek,
  exercisesByDay,
  exercisesById,
  onEditDay,
}: MesoEditorReviewStepProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} bounces={false}>
      <View style={styles.card}>
        <Text style={styles.summaryName}>{name}</Text>
        <Text style={styles.summaryMeta}>{formatReviewSummary(lengthWeeks, daysPerWeek)}</Text>
      </View>

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
            return (
              <View key={`${exercise.exerciseId}-${exercise.order}`} style={styles.exerciseRow}>
                <View
                  style={[styles.dot, dotColor !== undefined && { backgroundColor: dotColor }]}
                />
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {exerciseTitle(exercisesById, exercise.exerciseId)}
                </Text>
                <Text style={styles.exerciseSets}>{formatSetCount(exercise.sets)}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
