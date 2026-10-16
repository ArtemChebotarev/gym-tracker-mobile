// The full-screen page of 10.1 FR-11 and canvas 4.2 / 4.3 that holds an exercise's fields — New
// exercise after the type sheet, and Edit exercise from the exercise's ⋯ menu — presented as a
// full-screen modal like the mesocycle editor. To the user it is one step, with a Close; a
// timed-work exercise has a second one, what it progresses by, with a Back.
//
// Owns the in-progress values, seeded from `initialValues`; what happens on submit (creating,
// updating) and where the page goes after is the caller's, so the two pages can never differ in
// their fields (ExerciseCreateScreen.tsx, ExerciseEditScreen.tsx).
//
// JSX/rendering only — logic in ExerciseFormLogic.ts.

import { useState } from 'react';
import { ScrollView } from 'react-native';

import { Button } from '@design/components/Button';
import { Chip } from '@design/components/Chip';
import { WizardScreen } from '@design/components/WizardScreen';
import { getExerciseTypeIcon } from '@design/exerciseTypeIcon';
import { getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import { COLORS, ICON_SIZES } from '@design/tokens';

import { ExerciseFormFields } from './ExerciseFormFields';
import { canSubmitExerciseForm } from './ExerciseFormLogic';
import { styles } from './ExerciseFormScreenStyles';
import type { ExerciseFormSubmitInput, ExerciseFormValues } from './ExerciseFormValues';
import { ExerciseProgressionFields } from './ExerciseProgressionFields';

export type ExerciseFormScreenProps = {
  /** The title of the fields step: "New exercise" or "Edit exercise". */
  title: string;
  /** The last step's button: "Create exercise" or "Save". */
  submitLabel: string;
  initialValues: ExerciseFormValues;
  /** Disables the submit button while the caller's save is running. */
  isSubmitting: boolean;
  onSubmit: (input: ExerciseFormSubmitInput) => void;
  onClose: () => void;
};

export function ExerciseFormScreen({
  title,
  submitLabel,
  initialValues,
  isSubmitting,
  onSubmit,
  onClose,
}: ExerciseFormScreenProps) {
  // A timed-work exercise has a second step, what it progresses by; the other types are one.
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<ExerciseFormValues>(initialValues);

  function handleSubmit() {
    if (values.muscleGroup === undefined) {
      return;
    }
    onSubmit({
      name: values.name.trim(),
      muscleGroup: values.muscleGroup,
      equipment: values.equipment,
      type: values.type,
      config: values.config,
    });
  }

  const totalSteps = values.type === 'interval' ? 2 : 1;
  const isLastStep = step === totalSteps;
  const canSubmit = canSubmitExerciseForm(values.name, values.muscleGroup, values.type);
  // Step 1 closes the page, step 2 goes back to step 1 (WizardHeader: Close or Back, never both).
  const navigation = step === 1 ? { onClose } : { onBack: () => setStep(1) };

  return (
    <WizardScreen
      {...navigation}
      // The step names itself, as every step of the cycle editor does.
      title={step === 2 ? 'Progression' : title}
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
          label={isLastStep ? submitLabel : 'Next'}
          onPress={isLastStep ? handleSubmit : () => setStep(2)}
          disabled={isSubmitting || !canSubmit}
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
