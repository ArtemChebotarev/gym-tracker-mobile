// The mesocycle editor, Flow A — from scratch (04 · Meso Creation Flows, "Flow A"; see
// 08.5 · Редактор мезоцикла — Flow A for all three steps). One route for the whole flow: step
// number lives in local state here, not in the URL, and WizardScreen (design/components) stays
// mounted across every step change — only its `children`/`footer`/title/step-number props swap.
//
// This replaced separate routes per step (task 075/076's original approach — meso-editor/basics
// pushing to meso-editor/days) after on-device testing showed that approach visibly reset the
// header/progress-bar/footer position on every step change: React Navigation genuinely unmounts
// one screen and mounts the next even with the transition animation turned off. The caller's own
// words: "Я хочу это видеть как виджет, внутри которого меняется контент при передвижении вперёд
// назад, но выравнивание и т.д. остаются на месте." One mounted component, step-driven content,
// is the only way to actually get that — see design/components/WizardScreen.tsx.
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { toExerciseId } from '@domain/catalog';
import { MesoEditorBasicsStep } from '@components/MesoEditorBasicsStep';
import { canContinueFromBasics } from '@components/MesoEditorBasicsStepLogic';
import { MesoEditorDaysStep } from '@components/MesoEditorDaysStep';
import {
  canContinueFromDays,
  removeExerciseFromDay,
  updateExerciseSets,
} from '@components/MesoEditorDaysStepLogic';
import { MesoEditorFooter } from '@components/MesoEditorFooter';
import { WizardScreen } from '@design/components/WizardScreen';
import { useDraftStore } from '@state/draftStore';
import { useExercisesByIds } from '@state/useExercisesByIds';

const TOTAL_STEPS = 3;

type Step = 1 | 2;

export default function MesoEditorRoute() {
  const router = useRouter();
  const draft = useDraftStore((state) => state.mesoBuilder);
  const setDraft = useDraftStore((state) => state.setMesoBuilder);
  const resetDraft = useDraftStore((state) => state.resetMesoBuilder);
  const [step, setStep] = useState<Step>(1);
  const [activeDay, setActiveDay] = useState(1);

  // Every exercise id referenced across every day, not just the active one, so switching day
  // tabs never shows a loading flash for a day whose exercises were already fetched.
  const exerciseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const exercises of Object.values(draft.exercisesByDay)) {
      for (const exercise of exercises) {
        ids.add(exercise.exerciseId);
      }
    }
    return [...ids].map(toExerciseId);
  }, [draft.exercisesByDay]);
  const exercisesQuery = useExercisesByIds(exerciseIds);

  function handleClose() {
    resetDraft();
    router.back();
  }

  if (step === 1) {
    return (
      <WizardScreen
        title="New mesocycle"
        currentStep={1}
        totalSteps={TOTAL_STEPS}
        onClose={handleClose}
        footer={
          <MesoEditorFooter
            onContinue={() => setStep(2)}
            continueDisabled={!canContinueFromBasics(draft.name, draft.lengthWeeks, draft.daysPerWeek)}
          />
        }
      >
        <MesoEditorBasicsStep
          name={draft.name}
          lengthWeeks={draft.lengthWeeks}
          daysPerWeek={draft.daysPerWeek}
          onChangeName={(name) => setDraft({ ...draft, name })}
          onChangeLengthWeeks={(lengthWeeks) => setDraft({ ...draft, lengthWeeks })}
          onChangeDaysPerWeek={(daysPerWeek) => setDraft({ ...draft, daysPerWeek })}
        />
      </WizardScreen>
    );
  }

  return (
    <WizardScreen
      title="Days & exercises"
      currentStep={2}
      totalSteps={TOTAL_STEPS}
      onBack={() => setStep(1)}
      footer={
        <MesoEditorFooter
          onContinue={() => {
            // Step 3 (Review & confirm) doesn't exist yet — nothing to advance to. The route
            // wiring for it lands with that task; the draft is already in place for it to read.
          }}
          continueDisabled={!canContinueFromDays(draft.daysPerWeek, draft.exercisesByDay)}
          hint="Every day needs at least one exercise"
        />
      }
    >
      <MesoEditorDaysStep
        daysPerWeek={draft.daysPerWeek}
        activeDay={activeDay}
        onChangeActiveDay={setActiveDay}
        exercisesByDay={draft.exercisesByDay}
        exercisesById={exercisesQuery.data ?? {}}
        onChangeSets={(dayNumber, index, sets) =>
          setDraft({
            ...draft,
            exercisesByDay: updateExerciseSets(draft.exercisesByDay, dayNumber, index, sets),
          })
        }
        onRemoveExercise={(dayNumber, index) =>
          setDraft({
            ...draft,
            exercisesByDay: removeExerciseFromDay(draft.exercisesByDay, dayNumber, index),
          })
        }
        onAddExercise={() => {
          // Task 077's "Add exercise" sheet doesn't exist yet — nothing to open.
          // addExerciseToDay (MesoEditorDaysStepLogic.ts) is ready for that sheet to call once
          // it lands.
        }}
      />
    </WizardScreen>
  );
}
