// Step 2 of 3 in the mesocycle editor, Flow A — see 08.5 · Редактор мезоцикла — Flow A, "Шаг 2 —
// Days & exercises", and its mockup 02-new-meso-days.html (treated as the literal pixel spec,
// same as step 1 — see MesoEditorBasicsScreen.tsx).
//
// Fully controlled, the same way MesoEditorBasicsScreen.tsx is: the caller (app/meso-editor/
// days.tsx) owns the draft (via the zustand draft store, so it survives navigation), which day
// tab is active, and the resolved exercise records for the ids the draft references.
//
// The header/title/progress-bar chrome is WizardHeader (design/components) — this is not the
// flow's first step, so it gets `onBack` (a plain "go to the previous step"), not `onClose`.
//
// `onAddExercise` opens task 077's "Add exercise" sheet — not built yet, so the caller currently
// wires it to a no-op, the same way step 1's Continue was stubbed before this task existed.
//
// JSX/rendering only — styles live in MesoEditorDaysScreenStyles.ts and pure helpers in
// MesoEditorDaysScreenLogic.ts, per the code-style skill.

import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { MAX_EXERCISE_SETS, MIN_EXERCISE_SETS } from '@domain/planValidators';
import { Button } from '@design/components/Button';
import { IconButton } from '@design/components/IconButton';
import { Stepper } from '@design/components/Stepper';
import { WizardHeader } from '@design/components/WizardHeader';

import {
  canContinueFromDays,
  exerciseDotColor,
  exerciseSubtitle,
  exerciseTitle,
  formatDayExerciseCount,
  getDayExercises,
  getDayNumbers,
  type ExercisesByDay,
  type ExercisesById,
} from './MesoEditorDaysScreenLogic';
import { styles } from './MesoEditorDaysScreenStyles';

const TOTAL_STEPS = 3;
const CURRENT_STEP = 2;

export type MesoEditorDaysScreenProps = {
  daysPerWeek: number;
  activeDay: number;
  onChangeActiveDay: (day: number) => void;
  exercisesByDay: ExercisesByDay;
  exercisesById: ExercisesById;
  onChangeSets: (dayNumber: number, index: number, sets: number) => void;
  onRemoveExercise: (dayNumber: number, index: number) => void;
  onAddExercise: (dayNumber: number) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function MesoEditorDaysScreen({
  daysPerWeek,
  activeDay,
  onChangeActiveDay,
  exercisesByDay,
  exercisesById,
  onChangeSets,
  onRemoveExercise,
  onAddExercise,
  onBack,
  onContinue,
}: MesoEditorDaysScreenProps) {
  const dayNumbers = getDayNumbers(daysPerWeek);
  const activeDayExercises = getDayExercises(exercisesByDay, activeDay);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <WizardHeader
          title="Days & exercises"
          currentStep={CURRENT_STEP}
          totalSteps={TOTAL_STEPS}
          onBack={onBack}
        />

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

        <View style={styles.footer}>
          <Button
            label="Continue"
            onPress={onContinue}
            disabled={!canContinueFromDays(daysPerWeek, exercisesByDay)}
          />
          <Text style={styles.footerHint}>Every day needs at least one exercise</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
