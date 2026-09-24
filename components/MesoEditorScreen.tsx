// The mesocycle editor wizard — shared by creating from scratch (app/meso-editor/new.tsx, Flow A),
// copying a week (components/MesoCopyEditorScreen.tsx, Flow C, task 124) and editing a planned
// mesocycle (app/meso-editor/edit/[id].tsx, task 072). All three work on the same zustand draft
// (state/draftStore.ts); they differ in the first step's title, in what Save does, and — Flow C
// only — in the extra `leadStep` mounted in front of Basics.
//
// Basics / Days & exercises / Review are reused by Flow C exactly as they are, with no branch of
// their own anywhere: its draft arrives prefilled and is otherwise an ordinary draft (08.8 ·
// Редактор мезоцикла — Flow C, "Отдельного редактора нет").
//
// One component for the whole flow: step number lives in local state here, not in the URL, and
// WizardScreen (design/components) stays mounted across every step change — only its
// `children`/`footer`/title/step-number props swap.
//
// This replaced separate routes per step (task 075/076's original approach — meso-editor/basics
// pushing to meso-editor/days) after on-device testing showed that approach visibly reset the
// header/progress-bar/footer position on every step change: React Navigation genuinely unmounts
// one screen and mounts the next even with the transition animation turned off. The caller's own
// words: "Я хочу это видеть как виджет, внутри которого меняется контент при передвижении вперёд
// назад, но выравнивание и т.д. остаются на месте." One mounted component, step-driven content,
// is the only way to actually get that — see design/components/WizardScreen.tsx.
import { useMemo, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { toExerciseId, type ExerciseId } from '@domain/catalog';
import { ExerciseFiltersSheet } from '@components/ExerciseFiltersSheet';
import type { ExerciseLibraryFilters } from '@components/ExerciseLibraryScreen';
import { countEntries } from '@components/ExerciseLibraryScreenLogic';
import { MesoEditorAddExerciseSheet } from '@components/MesoEditorAddExerciseSheet';
import { MesoEditorBasicsStep } from '@components/MesoEditorBasicsStep';
import { canContinueFromBasics } from '@components/MesoEditorBasicsStepLogic';
import { MesoEditorDaysStep } from '@components/MesoEditorDaysStep';
import {
  addExerciseToDay,
  canContinueFromDays,
  removeExerciseFromDay,
  reorderDayExercises,
  updateExerciseSets,
} from '@components/MesoEditorDaysStepLogic';
import { MesoEditorFooter } from '@components/MesoEditorFooter';
import { MesoEditorReviewStep } from '@components/MesoEditorReviewStep';
import { WizardScreen } from '@design/components/WizardScreen';
import { useDraftStore, type MesoBuilderDraft } from '@state/draftStore';
import { useExerciseLibrary } from '@state/useExerciseLibrary';
import { useExercisesByIds } from '@state/useExercisesByIds';

const BASE_STEPS = 3;

/** `0` is the optional lead step; 1–3 are Basics, Days & exercises and Review. */
type Step = 0 | 1 | 2 | 3;

export type MesoEditorSaveOptions = {
  onSuccess: () => void;
  onError: () => void;
};

/**
 * An extra step mounted in front of Basics, inside this same wizard — Flow C's Source week
 * (08.8 · Редактор мезоцикла — Flow C, task 124). Its own screen would have meant a second
 * WizardScreen and the header/progress-bar jump the one-mounted-wizard design exists to avoid
 * (see the note at the top of this file), so the wizard takes the step's content instead and
 * keeps owning the chrome around it.
 *
 * With one present the flow is four steps, not three: the bar gets a fourth segment and Basics
 * becomes `Step 2 of 4`. The lead step itself isn't numbered — it shows its title in the bar
 * instead of a counter (`titlePlacement: 'bar'`), because the steps it precedes are the ones
 * Flow A numbers and it is not one of them.
 */
export type MesoEditorLeadStep = {
  /** Shown centred in the header bar, in place of the step counter. */
  title: string;
  content: ReactNode;
  /** False while the step can't be left — e.g. its selection hasn't finished loading. */
  canContinue: boolean;
  /** Runs before moving on to Basics; where the lead step applies itself to the draft. */
  onContinue: () => void;
};

export type MesoEditorScreenProps = {
  /** The first step's title — "New mesocycle" when creating, "Edit mesocycle" when editing. */
  title: string;
  /**
   * Persists the draft on the final step's `Save mesocycle`. Shaped like a TanStack Query mutation
   * so a route can pass `useConfirmMesocycleDraft()` / `useEditPlannedMesocycleDraft(id)` /
   * `useConfirmCopyWeekDraft()` as-is.
   */
  saveMutation: {
    mutate: (draft: MesoBuilderDraft, options: MesoEditorSaveOptions) => void;
    isPending: boolean;
  };
  /** Flow C only (124). Absent in Flow A and when editing a planned mesocycle. */
  leadStep?: MesoEditorLeadStep;
};

export function MesoEditorScreen({ title, saveMutation, leadStep }: MesoEditorScreenProps) {
  const router = useRouter();
  const draft = useDraftStore((state) => state.mesoBuilder);
  const setDraft = useDraftStore((state) => state.setMesoBuilder);
  const resetDraft = useDraftStore((state) => state.resetMesoBuilder);
  const [step, setStep] = useState<Step>(leadStep ? 0 : 1);
  const [activeDay, setActiveDay] = useState(1);

  // With a lead step the flow is one step longer and every numbered step shifts up by one, so
  // Basics reads `Step 2 of 4` rather than `Step 1 of 3`. The lead step fills the first segment
  // without claiming a number (see MesoEditorLeadStep).
  const totalSteps = leadStep ? BASE_STEPS + 1 : BASE_STEPS;
  const stepNumber = leadStep ? step + 1 : step;

  // Task 077's "Add exercise" sheet — a popup over step 2's own content, not a wizard step of its
  // own (see MesoEditorAddExerciseSheet.tsx's own comment). `addExerciseDay` is the day the sheet
  // is adding to, and doubles as its visibility flag (null = closed) since the sheet is always
  // opened for a specific day.
  const [addExerciseDay, setAddExerciseDay] = useState<number | null>(null);
  const [addExerciseSearch, setAddExerciseSearch] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<ExerciseId[]>([]);
  const [addExerciseFilters, setAddExerciseFilters] = useState<ExerciseLibraryFilters>({});
  const [addExerciseDraftFilters, setAddExerciseDraftFilters] = useState<ExerciseLibraryFilters>(
    {},
  );
  const [isAddExerciseFiltersSheetOpen, setIsAddExerciseFiltersSheetOpen] = useState(false);
  const addExerciseQuery = useExerciseLibrary({ ...addExerciseFilters, search: addExerciseSearch });
  // Recomputed live as the Filters sheet's draft selection changes, so its confirm button always
  // shows an up-to-date count before the draft is applied — same as app/(tabs)/library.tsx.
  const addExerciseDraftQuery = useExerciseLibrary({
    ...addExerciseDraftFilters,
    search: addExerciseSearch,
  });

  function handleRequestAddExercise(dayNumber: number) {
    setAddExerciseDay(dayNumber);
    setAddExerciseSearch('');
    setSelectedExerciseIds([]);
    setAddExerciseFilters({});
  }

  function handleRequestAddExerciseFilters() {
    setAddExerciseDraftFilters(addExerciseFilters);
    setIsAddExerciseFiltersSheetOpen(true);
  }

  function handleApplyAddExerciseFilters() {
    setAddExerciseFilters(addExerciseDraftFilters);
    setIsAddExerciseFiltersSheetOpen(false);
  }

  function handleConfirmAddExercise() {
    if (addExerciseDay === null) {
      return;
    }
    setDraft({
      ...draft,
      exercisesByDay: selectedExerciseIds.reduce(
        (exercisesByDay, exerciseId) =>
          addExerciseToDay(exercisesByDay, addExerciseDay, exerciseId),
        draft.exercisesByDay,
      ),
    });
    setAddExerciseDay(null);
  }

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

  // Step 3's chevron: back to step 2 with that day's tab active. The draft lives in the zustand
  // store, not in step-local state, so every other day's exercises are untouched by the switch.
  function handleEditDay(dayNumber: number) {
    setActiveDay(dayNumber);
    setStep(2);
  }

  // Task 078: Save mesocycle → the route's `saveMutation` (Confirm, 071, when creating; the edit
  // use case, 072, when editing a planned mesocycle). Neither creates sessions. A failed save keeps
  // the draft and shows a plain system alert so the user can simply try again (Artem's call on
  // 08.5's open question about the save-failure state).
  //
  // A saved block lands on the Mesocycles tab rather than wherever the editor was opened from
  // (Artem, 24.09.2026). It used to simply close, which was the same thing while the only way in
  // was that list; Flow C can now be started from the Today tab too, and coming back there to a
  // screen that says nothing about the block just saved is a worse ending than being shown it in
  // the list it now sits in. `dismissTo` rather than `back` + `navigate`: one dismissal, so the
  // editor doesn't briefly hand back to the screen underneath on its way out.
  function handleSave() {
    saveMutation.mutate(draft, {
      onSuccess: () => {
        resetDraft();
        router.dismissTo('/mesocycles');
      },
      onError: () => {
        Alert.alert("Couldn't save mesocycle", 'Something went wrong. Please try again.');
      },
    });
  }

  if (step === 0 && leadStep) {
    return (
      <WizardScreen
        title={leadStep.title}
        titlePlacement="bar"
        currentStep={1}
        totalSteps={totalSteps}
        onClose={handleClose}
        footer={
          <MesoEditorFooter
            onContinue={() => {
              leadStep.onContinue();
              setStep(1);
            }}
            continueDisabled={!leadStep.canContinue}
          />
        }
      >
        {leadStep.content}
      </WizardScreen>
    );
  }

  if (step === 1) {
    return (
      <WizardScreen
        title={title}
        currentStep={stepNumber}
        totalSteps={totalSteps}
        // With a lead step in front of it, Basics is no longer where the flow starts: ‹ goes back
        // to the source week, and ✕ — abandoning the whole thing — belongs to that step instead.
        {...(leadStep ? { onBack: () => setStep(0) } : { onClose: handleClose })}
        footer={
          <MesoEditorFooter
            onContinue={() => setStep(2)}
            continueDisabled={
              !canContinueFromBasics(draft.name, draft.lengthWeeks, draft.daysPerWeek)
            }
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

  if (step === 3) {
    return (
      <WizardScreen
        title="Review"
        currentStep={stepNumber}
        totalSteps={totalSteps}
        onBack={() => setStep(2)}
        footer={
          <MesoEditorFooter
            onContinue={handleSave}
            continueDisabled={saveMutation.isPending}
            continueLabel="Save mesocycle"
          />
        }
      >
        <MesoEditorReviewStep
          name={draft.name}
          lengthWeeks={draft.lengthWeeks}
          daysPerWeek={draft.daysPerWeek}
          exercisesByDay={draft.exercisesByDay}
          exercisesById={exercisesQuery.data ?? {}}
          onEditDay={handleEditDay}
        />
      </WizardScreen>
    );
  }

  return (
    <>
      <WizardScreen
        title="Days & exercises"
        currentStep={stepNumber}
        totalSteps={totalSteps}
        onBack={() => setStep(1)}
        footer={
          <MesoEditorFooter
            onContinue={() => setStep(3)}
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
          // Updater form, not a plain value built from the `draft` in scope here — see
          // state/draftStore.ts's own comment: MesoEditorDaysStep.tsx caches this callback
          // inside a PanResponder it deliberately doesn't rebuild on every render, so by the
          // time it's actually invoked, `draft` in *this* closure could already be behind
          // whatever's in the store (e.g. a Stepper edit made after the responder was cached).
          onReorderExercises={(dayNumber, newOrder) =>
            setDraft((current) => ({
              ...current,
              exercisesByDay: reorderDayExercises(current.exercisesByDay, dayNumber, newOrder),
            }))
          }
          onAddExercise={handleRequestAddExercise}
        />
      </WizardScreen>
      <MesoEditorAddExerciseSheet
        // Stays visible underneath Filters — it renders as a plain overlay
        // (`presentation="overlay"` inside MesoEditorAddExerciseSheet.tsx), not its own <Modal>,
        // so there's no second native modal window for ExerciseFiltersSheet's real Modal to
        // clash with. See BottomSheet.tsx's own doc on the `presentation` prop.
        visible={addExerciseDay !== null}
        dayNumber={addExerciseDay ?? activeDay}
        groups={addExerciseQuery.data}
        isPending={addExerciseQuery.isPending}
        search={addExerciseSearch}
        onSearchChange={setAddExerciseSearch}
        filters={addExerciseFilters}
        onRequestFilters={handleRequestAddExerciseFilters}
        onResetFilters={() => setAddExerciseFilters({})}
        selectedIds={selectedExerciseIds}
        onChangeSelectedIds={setSelectedExerciseIds}
        onConfirm={handleConfirmAddExercise}
        onClose={() => setAddExerciseDay(null)}
      />
      <ExerciseFiltersSheet
        visible={isAddExerciseFiltersSheetOpen}
        filters={addExerciseDraftFilters}
        onChangeFilters={setAddExerciseDraftFilters}
        resultCount={addExerciseDraftQuery.data ? countEntries(addExerciseDraftQuery.data) : 0}
        onReset={() => setAddExerciseDraftFilters({})}
        onApply={handleApplyAddExerciseFilters}
        onClose={() => setIsAddExerciseFiltersSheetOpen(false)}
      />
    </>
  );
}
