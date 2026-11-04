// Workout screen frame — 08.7 · Тренировка, "Шапка" (task 091). One layout for all four modes
// (live, read-only, history, preview — 088's `mode`): the header, the 3pt progress bar, and a
// single ScrollView of exercise cards.
//
// Header: `Week N` + faint `Day N` in RootScreen's title line (the Today tab shows this screen, so
// it shares the root screens' title treatment), the subtitle `date · mesocycle`, a round accent
// check for a completed session only (not pressable), and the grid and `⋯` buttons, which exist in
// every mode but history (`showsHeaderActions`, 128): a day of a block that has ended is opened
// from that block's detail screen, which is where its grid and its actions live — so the header
// here holds nothing but the title, the subtitle and the way back. A deload session gets a neutral
// `Deload` badge right after the title, ahead of the check — lighter weights and fewer sets
// otherwise read like a mistake. The progress ratio comes straight from the model (088) — nothing
// is computed here.
//
// The `⋯` is an ActionMenu (117): its actions open as a native menu out of the button itself
// rather than as a sheet, so the screen holds the actions (`menuActions`, one handler per action)
// instead of an `onOpenMenu` that only raised one somewhere else. Which of them a given session
// offers — and what each one reads as — is `workoutMenuActions` (096).
//
// The list is one exercise card per exercise (WorkoutExerciseCard, task 092) with its set rows
// (WorkoutSetRow, 093). Under the last card, the primary `Finish workout` button (094) — active when
// the model's `showFinish` says every exercise is `completed` or `skipped`; before that it is there
// inactive, with a line on what to do first (`showFinishLocked`, GT-48; worded for every type, as an
// interval or a mobility block has no sets — GT-108), so a newcomer sees that finishing exists. The moment it turns active the list scrolls down to it. Finishing needs no confirmation: the screen stays put and re-reads
// the session, which is then read-only — the cards drop `⋯`, the rows stop being editable, and the
// header gets its check. All of that follows from the model's `mode`, so nothing here tracks it.
// A read-only session shows a secondary `Next workout` button in the same place when the model has
// a `nextSessionId` — the mesocycle's current session — so moving on after Finish is one tap. A
// history session never has one (088): a block that has ended has no next workout. When
// there is no next session because the block is done, `showFinishMesocycle` puts a primary
// `Finish mesocycle` there instead (052): the block is closed by hand, never on its own, so the
// last workout of a mesocycle ends with the button that ends the mesocycle. Finishing it doesn't
// take the screen anywhere — `Copy current meso` appears in the same place instead, so the block
// you just closed is still the thing on screen when you decide what follows it (Artem, 24.09.2026).
//
// Presentational: the model and every outcome come in as props from the Today tab
// (app/(tabs)/index.tsx), which shows every session — the current one or a picked day. With no
// model, an EmptyState whose copy the tab supplies (no active mesocycle, nothing left, not found).
// JSX/rendering only — styles live in WorkoutScreenStyles.ts and pure helpers in
// WorkoutScreenLogic.ts, per the code-style skill.

import { type RefObject, useCallback, useEffect, useRef } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { ActionMenu } from '@design/components/ActionMenu';
import { Badge } from '@design/components/Badge';
import { Button } from '@design/components/Button';
import { CoachmarkTour } from '@design/components/CoachmarkTour';
import { EmptyState } from '@design/components/EmptyState';
import { IconButton } from '@design/components/IconButton';
import { ProgressBar } from '@design/components/ProgressBar';
import { RootScreen } from '@design/components/RootScreen';
import { CheckIcon } from '@design/icons/CheckIcon';
import { GridIcon } from '@design/icons/GridIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { COLORS, ICON_SIZES, RADII } from '@design/tokens';
import type { RoundEntry } from '@domain/executionValidators';
import type { IntervalTimerRound } from '@domain/intervalTimer';
import type { RoundTimeColumn } from '@domain/roundTimes';
import type { OnboardingFlag } from '@repositories/settings';
import type { LoadError } from '@state/loadError';
import type { WorkoutExercise, WorkoutSessionModel } from '@usecases/workoutSession';

import { EDIT_COACHMARK } from './EditCoachmarkLogic';
import { LoadErrorState } from './LoadErrorState';
import { WorkoutExerciseCard } from './WorkoutExerciseCard';
import { cardChip } from './WorkoutExerciseCardLogic';
import { RirExplanationContent } from './RirExplanationContent';
import {
  NO_TOUR_STEPS_SEEN,
  RANGES_STEP,
  rangesCoachmarkIndex,
  type SeenTourSteps,
  tourScrollOffset,
  tourStepsSeen,
  workoutCoachmarks,
} from './WorkoutCoachmarksLogic';
import { workoutExerciseMenuActions, type ExerciseMenuItem } from './WorkoutExerciseMenuLogic';
import {
  formatWorkoutMenuTitle,
  workoutMenuActions,
  type WorkoutMenuItem,
} from './WorkoutHeaderMenuLogic';
import {
  formatUnlocksCaption,
  formatWorkoutSubtitle,
  showsHeaderActions,
} from './WorkoutScreenLogic';
import { styles } from './WorkoutScreenStyles';
import { useDelayedFlag } from './useDelayedFlag';
import { useTabBarClearance } from './useTabBarClearance';

/** How long the first-workout tour waits after the workout is up. */
const TOUR_DELAY_MS = 1000;
/** The edit coachmark comes almost at once: the edit is what it is about (GT-224). */
const EDIT_DELAY_MS = 400;

// How long the tour lets an animated scroll run before it measures where the element landed.
const TOUR_SCROLL_MS = 450;

// How often the list reports its position to the tour: a frame.
const SCROLL_EVENT_MS = 16;

export type WorkoutScreenProps = {
  model: WorkoutSessionModel | undefined;
  isPending: boolean;
  /** Opens the mesocycle overview sheet (08.7, "Лист «Обзор мезоцикла»"). */
  onOpenGrid: () => void;
  /** What each action of the header menu does (08.7, "Меню шапки") — one handler per action. */
  menuActions: Record<WorkoutMenuItem, () => void>;
  /** Opens an exercise's history (06), from its card. */
  onOpenExerciseHistory: (exercise: WorkoutExercise) => void;
  /** Opens an exercise's own screen on Overview, from the name on its card (GT-178). */
  onOpenExercise: (exercise: WorkoutExercise) => void;
  /**
   * An action picked in an exercise card's `⋯` menu (08.7, "Меню упражнения"). Live only. The
   * menu opens out of the card's own button (117), so the screen builds each card's items from
   * the model and hands the pick back with the exercise it belongs to.
   */
  onExerciseMenuAction: (exercise: WorkoutExercise, item: ExerciseMenuItem) => void;
  /** Logs a set row with what was typed (05, "Записать подход"). Live only. */
  onLogSet: (
    exercise: WorkoutExercise,
    setNumber: number,
    entry: { weight: number; reps: number; bodyWeight?: number },
  ) => void;
  /** Un-logs a logged set row (05, "Снять отметку"). Live only. */
  onUnlogSet: (exercise: WorkoutExercise, setNumber: number) => void;
  /** Logs an interval round by hand with the times in its fields (10.1 FR-7). Live only. */
  onLogRound: (exercise: WorkoutExercise, roundNumber: number, entry: RoundEntry) => void;
  /** Un-logs a logged round. Live only. */
  onUnlogRound: (exercise: WorkoutExercise, roundNumber: number) => void;
  /**
   * Start timer on an interval card, with the rounds it runs (10.1 FR-6, GT-96) — or on a mobility
   * card, with its block (GT-107). Live only.
   */
  onStartIntervalTimer?: (exercise: WorkoutExercise, rounds: IntervalTimerRound[]) => void;
  /** Opens the running interval timer's screen — from a mobility card while its block runs. Live only. */
  onOpenIntervalTimer?: () => void;
  /** A time picked in an interval round, saved as the plan of the rounds it fills (FR-9, GT-187). Live only. */
  onSetRoundTime?: (
    exercise: WorkoutExercise,
    column: RoundTimeColumn,
    roundNumbers: number[],
    sec: number,
  ) => void;
  /** The user said a power exercise has nothing heavier to take (10.2 P9). Live only. */
  onSetNoHeavierAvailable: (exercise: WorkoutExercise) => void;
  /** The user closed a power exercise's ceiling note for good (GT-81). Live only. */
  onHideCeilingTip: (exercise: WorkoutExercise) => void;
  /** The Weight field of a pure bodyweight exercise was edited — it's the block's body weight (105). */
  onBodyWeightChange?: (bodyWeight: number) => void;
  /** A bodyweight exercise's Weight cell was tapped while the block has no body weight yet (105). */
  onRequestBodyWeight?: () => void;
  /** A log or un-log is being saved. */
  isSaving: boolean;
  /** Finishes the session (05, "Завершение тренировки"). Only offered when `showFinish`. */
  onFinish: () => void;
  /** Finish is being saved — the button is disabled so it can't be pressed twice. */
  isFinishing: boolean;
  /** Opens the session `Next workout` points at. Read-only only. */
  onOpenNext: (sessionId: string) => void;
  /** Flow C on the block this session belongs to. Only offered when `showCopyMesocycle`. */
  onCopyMesocycle: () => void;
  /** Closes the mesocycle (052). Only offered when `showFinishMesocycle`. */
  onFinishMesocycle: () => void;
  /** The mesocycle's Finish is being saved — the button is disabled so it can't be pressed twice. */
  isFinishingMesocycle: boolean;
  /**
   * The EmptyState shown in place of the screen when there's no session to show — none to pick,
   * or it couldn't be loaded. The caller knows which, so it supplies the copy and the way forward.
   */
  fallback: {
    icon: IconComponent;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
  };
  /** Set when reading the session failed — shown instead of `fallback`, which would claim there is none. */
  loadError?: LoadError;
  /**
   * The first-workout coachmark tour (08.11, GT-42): whether it is up, which steps are behind the
   * user, and what happens when it ends — with the flags to write
   * (`Got it` or `Skip`). The caller decides *whether* — it holds the onboarding flags — and this
   * screen builds the steps from its own header and first card.
   */
  coachmarks?: {
    visible: boolean;
    /** The weight ranges coachmark (GT-215) may show; on which card, and when, the screen works out. */
    rangesVisible?: boolean;
    seen?: SeenTourSteps;
    /**
     * The card the first edit that carries over just changed (GT-224): the edit coachmark rings it.
     * Set by the caller only while that coachmark may show.
     */
    editedCard?: string;
    onFinish: (flags: OnboardingFlag[]) => void;
  };
  /**
   * Pushed as a page (`session/[id]`, 08.9, task 130) rather than shown as the Today tab: a back
   * button above the title, in every state, loading and the fallback included.
   */
  onBack?: () => void;
};

export function WorkoutScreen({
  model,
  isPending,
  onOpenGrid,
  menuActions,
  onOpenExerciseHistory,
  onOpenExercise,
  onExerciseMenuAction,
  onLogSet,
  onUnlogSet,
  onLogRound,
  onUnlogRound,
  onStartIntervalTimer,
  onOpenIntervalTimer,
  onSetRoundTime,
  onSetNoHeavierAvailable,
  onHideCeilingTip,
  onBodyWeightChange,
  onRequestBodyWeight,
  isSaving,
  onFinish,
  isFinishing,
  onOpenNext,
  onFinishMesocycle,
  onCopyMesocycle,
  isFinishingMesocycle,
  fallback,
  loadError,
  coachmarks,
  onBack,
}: WorkoutScreenProps) {
  const tabBarClearance = useTabBarClearance();
  // The tour comes up a beat after the workout does: right after Start the tab is still arriving,
  // and a tour already over it reads as the screen's dim, not as a hint.
  const scrollRef = useRef<ScrollView>(null);
  // The list scrolls to `Finish workout` when the last set gets logged (GT-48) — not when the
  // screen merely opens on a session that was already complete.
  const finishReady = model?.showFinish === true;
  const finishWasReady = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (model === undefined) {
      return;
    }
    if (finishWasReady.current === false && finishReady) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
    finishWasReady.current = finishReady;
  }, [finishReady, model]);
  const tourDue = useDelayedFlag(coachmarks?.visible === true, TOUR_DELAY_MS);
  // Worked out from the model, which isn't there on the first frames.
  const rangesIndex =
    coachmarks?.rangesVisible === true && model !== undefined
      ? rangesCoachmarkIndex(model.exercises, model.mode, model.header.isDeload)
      : undefined;
  const tourSteps =
    model === undefined
      ? []
      : workoutCoachmarks({
          exercises: model.exercises,
          mode: model.mode,
          isDeload: model.header.isDeload,
          seen: coachmarks?.seen ?? NO_TOUR_STEPS_SEEN,
        });
  const tourPending = coachmarks?.visible === true && tourSteps.length > 0;
  // Never over the tour, and a beat after whatever brought it on: the set just logged, the tour.
  const rangesDue = useDelayedFlag(rangesIndex !== undefined && !tourPending, TOUR_DELAY_MS);
  // The edit coachmark (GT-224) on the card an edit just changed — never over the tour or the
  // ranges one, and a beat after the edit, once the card has its new rows or its new place.
  const editIndex =
    coachmarks?.editedCard === undefined || model === undefined
      ? -1
      : model.exercises.findIndex(
          (exercise) => exercise.sessionExerciseId === coachmarks.editedCard,
        );
  const editDue = useDelayedFlag(
    editIndex !== -1 && !tourPending && rangesIndex === undefined,
    EDIT_DELAY_MS,
  );
  const editCard = useRef<View>(null);
  // The visible parts the tour rings: the first card's RIR chip and ⓘ discs, and the grid button.
  const tourRir = useRef<View>(null);
  const tourWeight = useRef<View>(null);
  const tourGrid = useRef<View>(null);
  const tourRefs = { rir: tourRir, weight: tourWeight, grid: tourGrid };
  // Where the list stands: the tour has to scroll to a step's card, and native gives this only by
  // event.
  const listMetrics = useRef({ y: 0, contentHeight: 0, viewportHeight: 0 });
  const { height: windowHeight } = useWindowDimensions();
  const revealTourTarget = useCallback(
    (target: RefObject<View | null>) =>
      new Promise<void>((resolve) => {
        const node = target.current;
        if (node === null) {
          resolve();
          return;
        }
        node.measureInWindow((_x, targetY) => {
          const y = tourScrollOffset({ ...listMetrics.current, targetY, windowHeight });
          if (y === undefined) {
            resolve();
            return;
          }
          scrollRef.current?.scrollTo({ y, animated: true });
          setTimeout(resolve, TOUR_SCROLL_MS);
        });
      }),
    [windowHeight],
  );
  if (isPending) {
    return (
      <View style={styles.root}>
        <RootScreen title="Workout" onBack={onBack}>
          <Text style={styles.status}>Loading…</Text>
        </RootScreen>
      </View>
    );
  }

  if (model === undefined) {
    return (
      <View style={styles.root}>
        <RootScreen title="Workout" onBack={onBack}>
          {loadError ? (
            <LoadErrorState
              loadError={loadError}
              bottomInset={onBack === undefined ? tabBarClearance : 0}
            />
          ) : (
            <EmptyState {...fallback} bottomInset={onBack === undefined ? tabBarClearance : 0} />
          )}
        </RootScreen>
      </View>
    );
  }

  const { header, nextSessionId } = model;

  return (
    <View style={styles.root}>
      <RootScreen
        onBack={onBack}
        title={`Week ${header.weekNumber}`}
        titleSuffix={`Day ${header.dayNumber}`}
        titleAccessory={
          <>
            {header.isDeload && (
              // Badge pins itself to the top (alignSelf); the wrapper keeps it centred on the title.
              <View testID="workout-deload-badge">
                <Badge label="Deload" />
              </View>
            )}
            {header.isCompleted && (
              <View
                testID="workout-completed-check"
                accessible
                accessibilityLabel="Completed"
                style={styles.completedCheck}
              >
                <CheckIcon size={ICON_SIZES['icon/glyph']} color={COLORS['accent/on']} />
              </View>
            )}
          </>
        }
        subtitle={formatWorkoutSubtitle(header)}
        trailing={
          showsHeaderActions(model.mode) ? (
            <View style={styles.actions}>
              <IconButton
                accessibilityLabel="Cycle overview"
                onPress={onOpenGrid}
                buttonRef={tourGrid}
              >
                <GridIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
              </IconButton>
              <ActionMenu
                accessibilityLabel="Workout menu"
                title={formatWorkoutMenuTitle(header)}
                subtitle={header.mesocycleName}
                items={workoutMenuActions(model.actions, menuActions)}
              />
            </View>
          ) : undefined
        }
      >
        <ProgressBar value={model.progress} accessibilityLabel="Workout progress" />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]}
          // A tap on Log while the keyboard is up logs the set rather than only closing the
          // keyboard; the inset keeps the focused row above the keyboard.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          scrollEventThrottle={SCROLL_EVENT_MS}
          onScroll={(event) => {
            listMetrics.current.y = event.nativeEvent.contentOffset.y;
          }}
          onLayout={(event) => {
            listMetrics.current.viewportHeight = event.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_width, height) => {
            listMetrics.current.contentHeight = height;
          }}
        >
          {model.exercises.map((exercise, index) => (
            <WorkoutExerciseCard
              key={exercise.sessionExerciseId}
              exercise={exercise}
              mode={model.mode}
              isDeload={model.header.isDeload}
              coachmarkTargets={{
                ...(tourSteps.some((step) => step.target === 'rir' && step.exerciseIndex === index)
                  ? { rir: tourRir }
                  : {}),
                ...(tourSteps.some(
                  (step) => step.target === 'weight' && step.exerciseIndex === index,
                ) ||
                (!tourPending && rangesIndex === index)
                  ? { weight: tourWeight }
                  : {}),
                ...(editIndex === index ? { card: editCard } : {}),
              }}
              onOpenRanges={() => {
                if (coachmarks?.rangesVisible === true) {
                  coachmarks.onFinish(['rangesCoachmarkSeen']);
                }
              }}
              chip={cardChip(model.exercises, index)}
              position={index}
              onOpenHistory={() => onOpenExerciseHistory(exercise)}
              onOpenOverview={() => onOpenExercise(exercise)}
              menuItems={workoutExerciseMenuActions(exercise, (item) =>
                onExerciseMenuAction(exercise, item),
              )}
              isSaving={isSaving}
              sets={{
                bodyWeight: model.bodyWeight,
                onBodyWeightChange,
                onRequestBodyWeight,
                onLogSet: (setNumber, entry) => onLogSet(exercise, setNumber, entry),
                onUnlogSet: (setNumber) => onUnlogSet(exercise, setNumber),
              }}
              rounds={{
                onLogRound: (roundNumber, entry) => onLogRound(exercise, roundNumber, entry),
                onUnlogRound: (roundNumber) => onUnlogRound(exercise, roundNumber),
                ...(onStartIntervalTimer !== undefined
                  ? { onStartTimer: (rounds) => onStartIntervalTimer(exercise, rounds) }
                  : {}),
                ...(onSetRoundTime !== undefined
                  ? {
                      onSetRoundTime: (column, roundNumbers, sec) =>
                        onSetRoundTime(exercise, column, roundNumbers, sec),
                    }
                  : {}),
                ...(onOpenIntervalTimer !== undefined ? { onOpenTimer: onOpenIntervalTimer } : {}),
              }}
              ceiling={{
                onSetNoHeavierAvailable: () => onSetNoHeavierAvailable(exercise),
                onReplaceExercise: () => onExerciseMenuAction(exercise, 'replace'),
                onHideCeilingTip: () => onHideCeilingTip(exercise),
              }}
            />
          ))}
          {model.showFinish && (
            <View style={styles.finish}>
              <Button label="Finish workout" onPress={onFinish} disabled={isFinishing} />
            </View>
          )}
          {model.showFinishLocked && (
            <View style={styles.finish}>
              <Button label="Finish workout" onPress={onFinish} disabled />
              <Text style={styles.finishHint}>
                Log or skip every exercise to finish the workout.
              </Text>
            </View>
          )}
          {nextSessionId !== undefined && (
            <View style={styles.finish}>
              <Button
                label="Next workout"
                variant="secondary"
                onPress={() => onOpenNext(nextSessionId)}
              />
            </View>
          )}
          {model.showFinishMesocycle && (
            <View style={styles.finish}>
              <Button
                label="Finish cycle"
                onPress={onFinishMesocycle}
                disabled={isFinishingMesocycle}
              />
            </View>
          )}
          {model.showCopyMesocycle && (
            <View style={styles.finish}>
              <Button label="Copy current cycle" onPress={onCopyMesocycle} />
            </View>
          )}
          {model.unlocksAfter !== undefined && (
            <Text style={styles.unlocksCaption}>{formatUnlocksCaption(model.unlocksAfter)}</Text>
          )}
        </ScrollView>
      </RootScreen>
      {coachmarks !== undefined && (
        // Keyed by the session: a step that waited comes up in the next workout, in a tour of its
        // own, and a tour shows once per mount.
        <CoachmarkTour
          key={model.sessionId}
          visible={tourDue}
          onFinish={(end) => coachmarks.onFinish(tourStepsSeen(tourSteps, end))}
          reveal={revealTourTarget}
          steps={tourSteps.map((step) => ({
            // A capsule ring for all of them: a chip, a round disc and a round button each want
            // round corners, and the ring clamps it to what the element can take.
            ringRadius: RADII['radius/capsule'],
            ...(step.exerciseIndex !== undefined ? { scrolls: true } : {}),
            title: step.title,
            ...(step.paragraphs !== undefined ? { paragraphs: step.paragraphs } : {}),
            ...(step.explanation !== undefined
              ? { content: <RirExplanationContent explanation={step.explanation} /> }
              : {}),
            targetRef: tourRefs[step.target],
          }))}
        />
      )}
      {coachmarks !== undefined && (
        <CoachmarkTour
          key={`ranges-${model.sessionId}`}
          visible={rangesDue}
          onFinish={() => coachmarks.onFinish(['rangesCoachmarkSeen'])}
          reveal={revealTourTarget}
          steps={[
            {
              ringRadius: RADII['radius/capsule'],
              scrolls: true,
              targetRef: tourWeight,
              ...RANGES_STEP,
            },
          ]}
        />
      )}
      {coachmarks !== undefined && coachmarks.editedCard !== undefined && (
        <CoachmarkTour
          key={`edit-${coachmarks.editedCard}`}
          visible={editDue}
          onFinish={() => coachmarks.onFinish(['editCoachmarkSeen'])}
          reveal={revealTourTarget}
          steps={[
            {
              ringRadius: RADII['radius/control'],
              scrolls: true,
              targetRef: editCard,
              title: EDIT_COACHMARK.title,
              content: <RirExplanationContent explanation={EDIT_COACHMARK} />,
            },
          ]}
        />
      )}
    </View>
  );
}
