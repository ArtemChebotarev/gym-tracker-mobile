import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { toExerciseId } from '@domain/catalog';
import { MesoEditorDaysScreen } from '@components/MesoEditorDaysScreen';
import { removeExerciseFromDay, updateExerciseSets } from '@components/MesoEditorDaysScreenLogic';
import { useDraftStore } from '@state/draftStore';
import { useExercisesByIds } from '@state/useExercisesByIds';

export default function MesoEditorDaysRoute() {
  const router = useRouter();
  const draft = useDraftStore((state) => state.mesoBuilder);
  const setDraft = useDraftStore((state) => state.setMesoBuilder);
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

  function handleBack() {
    // Just pops back to step 1 — the draft is untouched, so Basics re-renders with whatever was
    // already filled in. Only step 1's Close (WizardHeader's other branch) resets the draft;
    // going back a step is not the same as abandoning the whole flow.
    router.back();
  }

  function handleContinue() {
    // Step 3 (Review & confirm) doesn't exist yet — nothing to navigate to. The route wiring for
    // it lands with that task; the draft is already in place for it to read.
  }

  return (
    <MesoEditorDaysScreen
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
        // Task 077's "Add exercise" sheet doesn't exist yet — nothing to open. addExerciseToDay
        // (MesoEditorDaysScreenLogic.ts) is ready for that sheet to call once it lands.
      }}
      onBack={handleBack}
      onContinue={handleContinue}
    />
  );
}
