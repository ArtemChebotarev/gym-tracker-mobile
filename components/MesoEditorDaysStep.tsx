// Step 2 of 3's own content in the mesocycle editor, Flow A — see 08.5 · Редактор мезоцикла —
// Flow A, "Шаг 2 — Days & exercises", and its mockup 02-new-meso-days.html — treated as a
// starting point rather than the literal pixel spec once on-device review found two things it
// got wrong: the per-row "sets" caption under every stepper read as visually uneven (the value
// and the caption don't share a width) and got redundant once there's more than a couple of
// rows — replaced with a single "Exercise" / "Sets" column-header row above the list instead.
// The mockup's own "Day N" / "N exercises" heading above that column header was cut entirely:
// it just repeated what the day tab immediately above it already says.
//
// Fully controlled, the same way MesoEditorBasicsStep.tsx is: the caller (app/meso-editor/
// new.tsx) owns the draft (via the zustand draft store), which day tab is active, and the
// resolved exercise records for the ids the draft references.
//
// This is just the step's own content (day tabs + exercise list + Add exercise) — the header/
// progress-bar/footer chrome shared by every step lives one level up, in
// design/components/WizardScreen.tsx (see MesoEditorBasicsStep.tsx's comment for why).
//
// `onAddExercise` opens task 077's "Add exercise" sheet (MesoEditorAddExerciseSheet.tsx),
// rendered as a sibling popup over this step's content, not as a step of its own — see that
// component's own comment.
//
// Rows are drag-to-reorder (task 080, 08.5 "Шаг 2" — `WeekPlanExercise.order` already existed in
// the model since task 076, but nothing could actually change it until now). Hand-rolled on
// React Native's own PanResponder/Animated rather than a library: two different drag libraries
// were tried first (react-native-draggable-flatlist-style `Sortable` from
// react-native-reanimated-dnd) and each had a real, reproducible on-device bug — one rendered an
// opaque white background where the app's dark surface should show through, the other desynced
// its own internal position bookkeeping so every drop just swapped the last two rows, regardless
// of which row's handle was actually dragged. Neither was fixable from the outside. This is a few
// dozen lines of plain arithmetic instead, built on primitives already shipping in React Native
// core — nothing new to depend on, and nothing to reverse-engineer when it misbehaves.
//
// Two moving pieces, kept deliberately separate:
// - `dragY` follows the finger continuously for the row actually being dragged (raw gesture
//   delta, no snapping) — it lifts with a shadow via `exerciseRowDragging`.
// - `hoverIndex` is the *discrete* slot that drag currently previews landing on
//   (`dragTargetIndex`, MesoEditorDaysStepLogic.ts) — every *other* row springs by ±1 row height
//   (`rowShiftUnits`) to visually make room, via its own entry in `rowShiftAnimations`. This is
//   what makes the list "push out of the way" live during the drag, not just snap once you let go.
// Nothing here touches the actual draft order until `onPanResponderRelease` — `hoverIndex` is a
// pure display preview, so an abandoned drag (onPanResponderTerminate) costs nothing to discard.
//
// The drag distance-to-row-index math assumes every row is exactly `EXERCISE_ROW_HEIGHT` points
// tall, so `exerciseRow`'s height is fixed (MesoEditorDaysStepStyles.ts) rather than left to
// padding/content — the two numbers can't be allowed to drift apart.
//
// Only the handle (the "≡" glyph) starts the drag, not the whole row — otherwise the pan
// responder would claim touches meant for the Stepper's +/- buttons and the remove button.
// `onPanResponderTerminationRequest: () => false` is equally load-bearing: without it, the
// surrounding ScrollView's default answer to "may I take the responder away from you?" is yes,
// so a few pixels into the drag the list would steal the gesture back and start scrolling instead
// (found on-device — the handle moved briefly, then the whole list took over like a
// pull-to-refresh drag). `bounces={false}` on that same ScrollView exists for the same family of
// reason: iOS's elastic overscroll made the whole content area visibly "stretch" on any
// touch-drag inside it, including over rows with no handle at all (e.g. "Add exercise").
//
// JSX/rendering only — styles live in MesoEditorDaysStepStyles.ts and pure helpers in
// MesoEditorDaysStepLogic.ts, per the code-style skill.

import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';

import { MAX_EXERCISE_SETS, MIN_EXERCISE_SETS } from '@domain/planValidators';
import { IconButton } from '@design/components/IconButton';
import { Stepper } from '@design/components/Stepper';

import {
  dragTargetIndex,
  exerciseDotColor,
  exerciseSubtitle,
  exerciseTitle,
  getDayExercises,
  getDayNumbers,
  moveIndex,
  rowShiftUnits,
  type ExercisesByDay,
  type ExercisesById,
} from './MesoEditorDaysStepLogic';
import { EXERCISE_ROW_HEIGHT, styles } from './MesoEditorDaysStepStyles';

export type MesoEditorDaysStepProps = {
  daysPerWeek: number;
  activeDay: number;
  onChangeActiveDay: (day: number) => void;
  exercisesByDay: ExercisesByDay;
  exercisesById: ExercisesById;
  onChangeSets: (dayNumber: number, index: number, sets: number) => void;
  onRemoveExercise: (dayNumber: number, index: number) => void;
  onReorderExercises: (dayNumber: number, newOrder: readonly number[]) => void;
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
  onReorderExercises,
  onAddExercise,
}: MesoEditorDaysStepProps) {
  const dayNumbers = getDayNumbers(daysPerWeek);
  const activeDayExercises = getDayExercises(exercisesByDay, activeDay);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  // useState rather than useRef for this Animated.Value: it's read during render (the dragged
  // row's `style`), which the react-hooks/refs lint rule flags for a plain ref — a useState
  // value read on every render is exactly what that rule expects instead, and the value itself
  // is still the same stable Animated.Value instance across re-renders either way.
  const [dragY] = useState(() => new Animated.Value(0));
  // One Animated.Value per current row, recomputed (not incrementally patched) whenever the
  // count changes — via useMemo rather than a ref/effect pair, since no drag is ever in progress
  // exactly when the day's exercise count itself changes (add/remove/switch day), so there's
  // nothing in-flight to preserve across that recompute.
  const rowShiftAnimations = useMemo(
    () => Array.from({ length: activeDayExercises.length }, () => new Animated.Value(0)),
    [activeDayExercises.length],
  );

  // Springs every non-dragged row toward how far it should currently be shifted to make room for
  // the drag in progress (0 for all of them once the drag ends or hasn't started).
  useEffect(() => {
    rowShiftAnimations.forEach((animation, index) => {
      const shift = draggingIndex !== null && hoverIndex !== null ? rowShiftUnits(index, draggingIndex, hoverIndex) : 0;
      Animated.spring(animation, { toValue: shift * EXERCISE_ROW_HEIGHT, useNativeDriver: true }).start();
    });
  }, [rowShiftAnimations, draggingIndex, hoverIndex]);

  // One PanResponder per row, cached rather than created inline in the row's own JSX (what task
  // 080 shipped with first) — an inline `PanResponder.create(...)` is a *new* object on every
  // render, and it broke the drag entirely the moment this file started calling `setHoverIndex`
  // on every touch move for the live "push" preview: each of those state updates re-renders the
  // component, so React would swap the row's `onResponderMove`/`onResponderRelease` props to a
  // brand-new responder mid-gesture — but that new object's own internal touch-history tracking
  // never saw the original touch-down, so its `gestureState` computations went wrong from that
  // point on (found on-device: the dragged row stopped moving entirely, part-way through the very
  // first drag after adding the live preview).
  //
  // The cache is memoized on `[activeDay, activeDayExercises.length]` rather than created once
  // for the component's whole lifetime: both of those are effectively constant *for the duration
  // of any single drag* (this is a single-touch UI — nothing can switch the active day tab or
  // add/remove an exercise while a finger is already down on a handle), so each responder's
  // `onPanResponderMove`/`onPanResponderRelease` can simply close over them normally, the same as
  // any other event handler, with no ref/"latest value" indirection needed — the cache (and every
  // responder inside it) is only ever rebuilt *between* gestures, when those values are free to
  // actually change.
  //
  // There's no "current hover index" to read back at release, either — `dragTargetIndex` is pure
  // and stateless (MesoEditorDaysStepLogic.ts), so onPanResponderRelease just calls it again with
  // *its own* gestureState.dy (the release event carries the same cumulative delta move events
  // do) instead of needing to remember the last one computed during a move.
  const handleResponders = useMemo(() => {
    const exerciseCount = activeDayExercises.length;
    const responders = new Map<number, ReturnType<typeof PanResponder.create>>();

    function getHandleResponder(index: number) {
      let responder = responders.get(index);
      if (responder) {
        return responder;
      }
      responder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragY.setValue(0);
          setDraggingIndex(index);
          setHoverIndex(index);
        },
        onPanResponderMove: (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
          dragY.setValue(gestureState.dy);
          setHoverIndex(dragTargetIndex(index, gestureState.dy, exerciseCount, EXERCISE_ROW_HEIGHT));
        },
        onPanResponderRelease: (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
          const targetIndex = dragTargetIndex(index, gestureState.dy, exerciseCount, EXERCISE_ROW_HEIGHT);
          if (targetIndex !== index) {
            onReorderExercises(activeDay, moveIndex(exerciseCount, index, targetIndex));
          }
          setDraggingIndex(null);
          setHoverIndex(null);
        },
        onPanResponderTerminate: () => {
          setDraggingIndex(null);
          setHoverIndex(null);
        },
      });
      responders.set(index, responder);
      return responder;
    }

    return { getHandleResponder };
    // `dragY` is a stable useState value (never replaced via its setter), safe and harmless to
    // list. `onReorderExercises` is deliberately *not* listed: it's a fresh closure from the
    // caller every render, but its target (setDraft in app/meso-editor/new.tsx) is stable and
    // only ever reads exercisesByDay fresh when it actually runs — including it here would
    // rebuild every row's responder for no behavioral difference, defeating the whole point of
    // this cache (see the comment above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay, activeDayExercises.length, dragY]);

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

      <ScrollView style={styles.content} bounces={false}>
        {activeDayExercises.length > 0 && (
          <View style={styles.columnHeader}>
            <View style={styles.columnHeaderHandleSpacer} />
            <View style={styles.columnHeaderDotSpacer} />
            <Text style={styles.columnHeaderExercise}>Exercise</Text>
            <Text style={styles.columnHeaderSets}>Sets</Text>
            <View style={styles.columnHeaderRemoveSpacer} />
          </View>
        )}

        {activeDayExercises.map((exercise, index) => {
          const title = exerciseTitle(exercisesById, exercise.exerciseId);
          const isDragging = draggingIndex === index;
          const rowShift = rowShiftAnimations[index];
          return (
            <Animated.View
              key={index}
              style={[
                styles.exerciseRow,
                isDragging && styles.exerciseRowDragging,
                isDragging
                  ? { transform: [{ translateY: dragY }] }
                  : rowShift && { transform: [{ translateY: rowShift }] },
              ]}
            >
              <View
                {...handleResponders.getHandleResponder(index).panHandlers}
                accessibilityLabel={`Reorder ${title}`}
                style={styles.dragHandle}
              >
                <Text style={styles.dragHandleGlyph}>≡</Text>
              </View>
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
              />
              <IconButton accessibilityLabel={`Remove ${title}`} onPress={() => onRemoveExercise(activeDay, index)}>
                <Text style={styles.removeIcon}>✕</Text>
              </IconButton>
            </Animated.View>
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
