// Drag-to-reorder for a list of same-height rows, by a handle — the editor's exercise rows (task 080)
// and the Reorder days sheet (GT-270). Moved out of MesoEditorDaysStep.tsx when the second list
// arrived, so both drag the same way and neither keeps its own copy.
//
// Hand-rolled on React Native's own PanResponder/Animated rather than a library: two different drag
// libraries were tried first (react-native-draggable-flatlist-style `Sortable` from
// react-native-reanimated-dnd) and each had a real, reproducible on-device bug — one rendered an
// opaque white background where the app's dark surface should show through, the other desynced its
// own internal position bookkeeping so every drop just swapped the last two rows, regardless of
// which row's handle was actually dragged. Neither was fixable from the outside. This is a few dozen
// lines of plain arithmetic instead (dragReorderLogic.ts), built on primitives already shipping in
// React Native core.
//
// Two moving pieces, kept deliberately separate:
// - `dragY` follows the finger continuously for the row actually being dragged (raw gesture delta,
//   no snapping).
// - `hoverIndex` is the *discrete* slot that drag currently previews landing on (`dragTargetIndex`)
//   — every *other* row springs by ±1 row height (`rowShiftUnits`) to visually make room, via its
//   own entry in `rowShiftAnimations`. This is what makes the list "push out of the way" live during
//   the drag, not just snap once you let go.
// Nothing reaches the caller until release — `hoverIndex` is a pure display preview, so an
// abandoned drag (onPanResponderTerminate) costs nothing to discard.
//
// The distance-to-row-index math assumes every row is exactly `rowHeight` points tall, so the
// caller fixes its row's height to that same number rather than leaving it to padding/content.
//
// Only the handle starts the drag (`handleProps`), not the whole row — otherwise the pan responder
// would claim touches meant for the row's own buttons. `onPanResponderTerminationRequest: () =>
// false` is equally load-bearing: without it, a surrounding ScrollView's default answer to "may I
// take the responder away from you?" is yes, so a few pixels into the drag the list would steal the
// gesture back and start scrolling instead (found on-device). The caller's ScrollView also wants
// `bounces={false}`: iOS's elastic overscroll made the whole content area visibly "stretch" on any
// touch-drag inside it.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type PanResponderInstance,
} from 'react-native';

import {
  dragTargetIndex,
  moveIndex,
  resetRowShiftAnimations,
  rowShiftUnits,
} from './dragReorderLogic';

export type DragReorderOptions = {
  itemCount: number;
  rowHeight: number;
  /** A permutation of the current indices (`moveIndex`) — called once, on a drop that moved. */
  onReorder: (newOrder: number[]) => void;
};

export type DragReorder = {
  /** The row being dragged, for its lifted style; `null` between drags. */
  draggingIndex: number | null;
  /** Spread onto the row's handle. */
  handleProps: (index: number) => PanResponderInstance['panHandlers'];
  /** The row's translateY — the finger for the dragged one, the push preview for the rest. */
  rowTransform: (index: number) => { transform: { translateY: Animated.Value }[] } | undefined;
};

export function useDragReorder({ itemCount, rowHeight, onReorder }: DragReorderOptions): DragReorder {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  // useState rather than useRef for this Animated.Value: it's read during render (the dragged row's
  // `style`), which the react-hooks/refs lint rule flags for a plain ref — a useState value read on
  // every render is exactly what that rule expects instead, and the value itself is still the same
  // stable Animated.Value instance across re-renders either way.
  const [dragY] = useState(() => new Animated.Value(0));
  // One Animated.Value per current row, recomputed (not incrementally patched) whenever the count
  // changes — no drag is ever in progress exactly when the count itself changes (add/remove/switch
  // day), so there's nothing in-flight to preserve across that recompute.
  const rowShiftAnimations = useMemo(
    () => Array.from({ length: itemCount }, () => new Animated.Value(0)),
    [itemCount],
  );

  // The caller's latest `onReorder`, read at release. The responders below are cached across
  // renders (see their note), so closing over the callback directly would call whichever one was
  // current when the cache was built — a stale closure that could overwrite a newer edit.
  const onReorderRef = useRef(onReorder);
  useEffect(() => {
    onReorderRef.current = onReorder;
  });

  // Springs every non-dragged row toward how far it should currently be shifted to make room for
  // the drag in progress (0 for all of them once the drag ends or hasn't started).
  //
  // useNativeDriver: false, deliberately — `dragY` (set via plain `dragY.setValue()` in the
  // handlers below) can never itself be native-driven, and a row that's been pushed by *this* spring
  // at some point is the exact same native view that later becomes the dragged row in a later
  // gesture. Once a view's transform had been handed to the native driver, on-device testing showed
  // that the *next* time that row was driven by plain-JS `dragY.setValue()` calls, its on-screen
  // position stopped updating during the drag — a native/JS driver handoff RN doesn't support
  // cleanly on the same view. Keeping every row's translateY JS-driven avoids that handoff entirely.
  useEffect(() => {
    rowShiftAnimations.forEach((animation, index) => {
      const shift =
        draggingIndex !== null && hoverIndex !== null
          ? rowShiftUnits(index, draggingIndex, hoverIndex)
          : 0;
      Animated.spring(animation, {
        toValue: shift * rowHeight,
        useNativeDriver: false,
      }).start();
    });
  }, [rowShiftAnimations, draggingIndex, hoverIndex, rowHeight]);

  // One PanResponder per row, cached rather than created inline — an inline `PanResponder.create`
  // is a *new* object on every render, and every `setHoverIndex` on a touch move re-renders, so
  // React would swap the row's responder props to a brand-new responder mid-gesture whose own
  // touch-history tracking never saw the original touch-down (found on-device: the dragged row
  // stopped moving part-way through the very first drag).
  //
  // The cache is rebuilt only when the row count changes, which never happens during a drag (a
  // single-touch UI — nothing can add or remove a row while a finger is on a handle).
  //
  // The hover index at release is whatever `onPanResponderMove` last previewed — a closure variable
  // local to the responder — *not* recomputed from the release event's own `gestureState.dy`. Those
  // two could disagree by a row on-device (a fast drag's release lands a touch away from the last
  // move sample it previewed), so the drop didn't always match the slot the preview had just shown.
  const responders = useMemo(() => {
    const cache = new Map<number, PanResponderInstance>();

    function getHandleResponder(index: number): PanResponderInstance {
      const cached = cache.get(index);
      if (cached) {
        return cached;
      }
      let latestHoverIndex = index;
      const responder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragY.setValue(0);
          latestHoverIndex = index;
          setDraggingIndex(index);
          setHoverIndex(index);
        },
        onPanResponderMove: (
          _event: GestureResponderEvent,
          gestureState: PanResponderGestureState,
        ) => {
          dragY.setValue(gestureState.dy);
          latestHoverIndex = dragTargetIndex(index, gestureState.dy, itemCount, rowHeight);
          setHoverIndex(latestHoverIndex);
        },
        onPanResponderRelease: () => {
          resetRowShiftAnimations(rowShiftAnimations);
          if (latestHoverIndex !== index) {
            onReorderRef.current(moveIndex(itemCount, index, latestHoverIndex));
          }
          setDraggingIndex(null);
          setHoverIndex(null);
        },
        onPanResponderTerminate: () => {
          resetRowShiftAnimations(rowShiftAnimations);
          setDraggingIndex(null);
          setHoverIndex(null);
        },
      });
      cache.set(index, responder);
      return responder;
    }

    return { getHandleResponder };
  }, [itemCount, rowHeight, dragY, rowShiftAnimations]);

  return {
    draggingIndex,
    handleProps: (index) => responders.getHandleResponder(index).panHandlers,
    rowTransform: (index) => {
      if (draggingIndex === index) {
        return { transform: [{ translateY: dragY }] };
      }
      const shift = rowShiftAnimations[index];
      return shift ? { transform: [{ translateY: shift }] } : undefined;
    },
  };
}
