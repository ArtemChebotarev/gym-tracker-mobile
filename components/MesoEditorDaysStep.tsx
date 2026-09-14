// Step 2 of 3's own content in the mesocycle editor, Flow A — see 08.5 · Редактор мезоцикла —
// Flow A, "Шаг 2 — Days & exercises", and its mockup 02-new-meso-days.html (treated as the
// literal pixel spec, same as step 1 — see MesoEditorBasicsStep.tsx).
//
// Fully controlled, the same way MesoEditorBasicsStep.tsx is: the caller (app/meso-editor/
// new.tsx) owns the draft (via the zustand draft store), which day tab is active, and the
// resolved exercise records for the ids the draft references.
//
// This is just the step's own content (day tabs + exercise list + Add exercise) — the header/
// progress-bar/footer chrome shared by every step lives one level up, in
// design/components/WizardScreen.tsx (see MesoEditorBasicsStep.tsx's comment for why).
//
// `onAddExercise` opens task 077's "Add exercise" sheet — not built yet, so the caller currently
// wires it to a no-op, the same way step 1's Continue was stubbed before this task existed.
//
// JSX/rendering only — styles live in MesoEditorDaysStepStyles.ts and pure helpers in
// MesoEditorDaysStepLogic.ts, per the code-style skill.

import { Pressable, ScrollView, Text, View } from 'react-native';

import { MAX_EXERCISE_SETS, MIN_EXERCISE_SETS } from '@domain/planValidators';
import { IconButton } from '@design/components/IconButton';
import { Stepper } from '@design/components/Stepper';

import {
  exerciseDotColor,
  exerciseSubtitle,
  exerciseTitle,
  formatDayExerciseCount,
  getDayExercises,
  getDayNumbers,
  type ExercisesByDay,
  type ExercisesById,
} from './MesoEditorDaysStepLogic';
import { styles } from './MesoEditorDaysStepStyles';

export type MesoEditorDaysStepProps = {
  daysPerWeek: number;
  activeDay: number;
  onChangeActiveDay: (day: number) => void;
  exercisesByDay: ExercisesByDay;
  exercisesById: ExercisesById;
  onChangeSets: (dayNumber: number, index: number, sets: number) => void;
  onRemoveExercise: (dayNumber: number, index: number) => void;
  onAddExercise: (dayNumber: number) => void;
};

export function MesoEditorDaysStep({
  daysPerWeek,
  activeDay,
  onChangeActiveDay,
  exercisesByDay,
  exercisesById,
  onChangeSets,
  onRemoveExercise,
  onAddExercise,
}: MesoEditorDaysStepProps) {
  const dayNumbers = getDayNumbers(daysPerWeek);
  const activeDayExercises = getDayExercises(exercisesByDay, activeDay);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayTabs}
        contentContainerStyle={styles.dayTabsContent}
      >
        {dayNumbers.map((day) => {
          const isActive = day === activeDay;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={`Day ${day}`}
              accessibilityState={{ selected: isActive }}
              onPress={() => onChangeActiveDay(day)}
              style={[styles.dayTab, isActive && styles.dayTabActive]}
            >
              <Text style={[styles.dayTabLabel, isActive && styles.dayTabLabelActive]}>{`Day ${day}`}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.content}>
        <Text style={styles.dayTitle}>{`Day ${activeDay}`}</Text>
        <Text style={styles.daySub}>{formatDayExerciseCount(activeDayExercises.length)}</Text>

        {activeDayExercises.map((exercise, index) => {
          const title = exerciseTitle(exercisesById, exercise.exerciseId);
          return (
            <View key={index} style={styles.exerciseRow}>
              <View
                style={[styles.dot, { backgroundColor: exerciseDotColor(exercisesById, exercise.exerciseId) }]}
              />
              <View style={styles.exerciseMain}>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={styles.exerciseGroup} numberOfLines={1}>
                  {exerciseSubtitle(exercisesById, exercise.exerciseId)}
                </Text>
              </View>
              <Stepper
                label={`${title} sets`}
                variant="inline"
                value={exercise.sets}
                onChange={(sets) => onChangeSets(activeDay, index, sets)}
                min={MIN_EXERCISE_SETS}
                max={MAX_EXERCISE_SETS}
                caption="sets"
              />
              <IconButton accessibilityLabel={`Remove ${title}`} onPress={() => onRemoveExercise(activeDay, index)}>
                <Text style={styles.removeIcon}>✕</Text>
              </IconButton>
            </View>
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
