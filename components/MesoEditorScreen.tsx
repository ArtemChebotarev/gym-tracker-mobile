// The mesocycle editor wizard — shared by creating from scratch (app/meso-editor/new.tsx, Flow A),
// from a template (components/MesoTemplateEditorScreen.tsx, Flow B, GT-6), copying a week
// (components/MesoCopyEditorScreen.tsx, Flow C, task 124) and editing a planned mesocycle
// (app/meso-editor/edit/[id].tsx, task 072). All four work on the same zustand draft
// (state/draftStore.ts); they differ in the first step's title, in what Save does, and — Flows B
// and C — in the extra `leadStep` mounted in front of Basics.
//
// Basics / Days & exercises / Review are reused by Flows B and C exactly as they are, with no
// branch of their own anywhere: their draft arrives prefilled and is otherwise an ordinary draft
// (08.8 and 08.10, "Отдельного редактора нет").
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
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, BackHandler } from 'react-native';
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
import {
  DISCARD_DRAFT_MESSAGE,
  DISCARD_DRAFT_TITLE,
  DISCARD_LABEL,
  hasUnsavedDraft,
  KEEP_EDITING_LABEL,
} from '@components/MesoEditorScreenLogic';
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
 * (08.8, task 124) and Flow B's Choose a template (08.10, GT-6). Its own screen would have meant a
 * second WizardScreen and the header/progress-bar jump the one-mounted-wizard design exists to
 * avoid (see the note at the top of this file), so the wizard takes the step's content instead and
 * keeps owning the chrome around it.
 *
 * With one present the flow is four steps, not three: the bar gets a fourth segment and Basics
 * becomes `Step 2 of 4`.
 *
 * The two lead steps differ in two ways, both from their specs:
 * - Flow C's isn't numbered — its title sits in the bar instead of a counter, because the steps it
 *   precedes are the ones Flow A numbers and it is not one of them. Flow B's is `Step 1 of 4` with
 *   its title as the heading, as 08.10 draws it (`numbered`).
 * - Flow C's moves on with Continue in the footer (`onContinue`). Flow B's has no footer: a
 *   template is chosen in its preview sheet, whose `Use this template` is the step's way forward,
 *   so the step gets `next` to call when it is done.
 */
export type MesoEditorLeadStep = {
  /** In the header bar, or — `numbered` — as the heading under `Step 1 of N`. */
  title: string;
  numbered?: boolean;
  /** The step's content; a function receives `next`, which moves the wizard on to Basics. */
  content: ReactNode | ((next: () => void) => ReactNode);
} & (
  | {
      /** False while the step can't be left — e.g. its selection hasn't finished loading. */
      canContinue: boolean;
      /** Runs before moving on to Basics; where the lead step applies itself to the draft. */
      onContinue: () => void;
    }
  | { canContinue?: never; onContinue?: never }
);

export type MesoEditorScreenProps = {
  /** The first step's title — "New training cycle" when creating, "Edit training cycle" when editing. */
  title: string;
  /**
   * Persists the draft on the final step's `Save cycle`. Shaped like a TanStack Query mutation
   * so a route can pass `useConfirmMesocycleDraft()` / `useEditPlannedMesocycleDraft(id)` /
   * `useConfirmCopyWeekDraft()` as-is.
   */
  saveMutation: {
    mutate: (draft: MesoBuilderDraft, options: MesoEditorSaveOptions) => void;
    isPending: boolean;
  };
  /** Flows B and C only. Absent in Flow A and when editing a planned mesocycle. */
  leadStep?: MesoEditorLeadStep;
  /**
   * Editing a planned mesocycle: closing never asks, because what is being edited is already saved
   * (GT-52). A new cycle's draft exists nowhere else, so closing it with something entered asks.
   */
  isEditing?: boolean;
};

export function MesoEditorScreen({
  title,
  saveMutation,
  leadStep,
  isEditing = false,
}: MesoEditorScreenProps) {
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

  const discardDraft = useCallback(() => {
    resetDraft();
    router.back();
  }, [resetDraft, router]);

  // GT-52: ✕ asks before throwing away a new cycle's draft, if there is anything in it. Android's
  // back button leaves the wizard the same way, so it asks the same question.
  const asksBeforeClosing = !isEditing && hasUnsavedDraft(draft);
  const confirmDiscard = useCallback(() => {
    Alert.alert(DISCARD_DRAFT_TITLE, DISCARD_DRAFT_MESSAGE, [
      { text: KEEP_EDITING_LABEL, style: 'cancel' },
      { text: DISCARD_LABEL, style: 'destructive', onPress: discardDraft },
    ]);
  }, [discardDraft]);

  useEffect(() => {
    if (!asksBeforeClosing) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmDiscard();
      return true;
    });
    return () => subscription.remove();
  }, [asksBeforeClosing, confirmDiscard]);

  function handleClose() {
    if (asksBeforeClosing) {
      confirmDiscard();
    } else {
      discardDraft();
    }
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
        Alert.alert("Couldn't save training cycle", 'Something went wrong. Try again.');
      },
    });
  }

  if (step === 0 && leadStep) {
    const { onContinue } = leadStep;
    return (
      <WizardScreen
        title={leadStep.title}
        titlePlacement={leadStep.numbered ? 'heading' : 'bar'}
        currentStep={1}
        totalSteps={totalSteps}
        onClose={handleClose}
        footer={
          onContinue === undefined ? undefined : (
            <MesoEditorFooter
              onContinue={() => {
                onContinue();
                setStep(1);
              }}
              continueDisabled={!leadStep.canContinue}
            />
          )
        }
      >
        {typeof leadStep.content === 'function'
          ? leadStep.content(() => setStep(1))
          : leadStep.content}
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
        // to the source week or the template list, and ✕ — abandoning the whole thing — belongs to
        // that step instead.
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
          exercisesPrefilled={leadStep !== undefined}
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
            continueLabel="Save cycle"
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
