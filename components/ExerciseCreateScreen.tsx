// New exercise, the step after choosing the type — the full-screen page of 10.1 FR-11 and canvas
// 4.2 / 4.3, presented as a full-screen modal like the mesocycle editor. The type arrives as a
// route param from the type sheet (ExerciseTypeSheet). To the user this is the one and only step, so
// it is a single-step wizard with a Close; the type sheet is not counted.
//
// JSX/rendering only — logic in ExerciseCreateScreenLogic.ts and ExerciseFormSheetLogic.ts.

import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@design/components/Button';
import { Chip } from '@design/components/Chip';
import { WizardScreen } from '@design/components/WizardScreen';
import { getExerciseTypeIcon } from '@design/exerciseTypeIcon';
import { getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import { COLORS, ICON_SIZES } from '@design/tokens';
import { useCreateCustomExercise } from '@state/useCreateCustomExercise';

import { exerciseTypeFromParam } from './ExerciseCreateScreenLogic';
import { EMPTY_EXERCISE_FORM_VALUES, type ExerciseFormValues } from './ExerciseFormSheet';
import { ExerciseFormFields } from './ExerciseFormFields';
import { ExerciseProgressionFields } from './ExerciseProgressionFields';
import { canSubmitExerciseForm, valuesForType } from './ExerciseFormSheetLogic';
import { styles } from './ExerciseCreateScreenStyles';

export function ExerciseCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; name?: string }>();
  const createExercise = useCreateCustomExercise();

  // A timed-work exercise has a second step, what it progresses by; the other types are one.
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<ExerciseFormValues>(() =>
    valuesForType(
      { ...EMPTY_EXERCISE_FORM_VALUES, name: params.name ?? '' },
      exerciseTypeFromParam(params.type),
    ),
  );

  function handleCreate() {
    if (values.muscleGroup === undefined) {
      return;
    }
    createExercise.mutate(
      {
        name: values.name.trim(),
        muscleGroup: values.muscleGroup,
        equipment: values.equipment,
        type: values.type,
        config: values.config,
      },
      {
        onSuccess: () => router.back(),
        // The page stays open with what was typed, so Create can simply be pressed again.
        onError: () => Alert.alert("Couldn't save the exercise", 'Try again.'),
      },
    );
  }

  const totalSteps = values.type === 'interval' ? 2 : 1;
  const isLastStep = step === totalSteps;
  const canSubmit = canSubmitExerciseForm(values.name, values.muscleGroup, values.type);
  // Step 1 closes the page, step 2 goes back to step 1 (WizardHeader: Close or Back, never both).
  const navigation = step === 1 ? { onClose: () => router.back() } : { onBack: () => setStep(1) };

  return (
    <WizardScreen
      {...navigation}
      // The step names itself, as every step of the cycle editor does.
      title={step === 2 ? 'Progression' : 'New exercise'}
      titleAccessory={
        <Chip
          variant="static"
          label={getExerciseTypeLabel(values.type)}
          icon={getExerciseTypeIcon(values.type)({
            size: ICON_SIZES['icon/glyph'],
            color: COLORS['text/secondary'],
          })}
        />
      }
      currentStep={step}
      totalSteps={totalSteps}
      footer={
        <Button
          label={isLastStep ? 'Create exercise' : 'Next'}
          onPress={isLastStep ? handleCreate : () => setStep(2)}
          disabled={createExercise.isPending || !canSubmit}
        />
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        // The page is a form, not a feed: it stops at its edges instead of springing past them.
        bounces={false}
      >
        {step === 1 && <ExerciseFormFields values={values} onChangeValues={setValues} />}
        {step === 2 && values.config?.type === 'interval' && (
          <ExerciseProgressionFields
            config={values.config}
            onChange={(config) => setValues({ ...values, config })}
          />
        )}
      </ScrollView>
    </WizardScreen>
  );
}
