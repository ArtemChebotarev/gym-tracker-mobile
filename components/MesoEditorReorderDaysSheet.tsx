// Reorder days — the sheet the ⇅ in front of the Days & exercises step's tabs opens (GT-270): the week's days
// as a list, each with its exercises under it, dragged into a new order by the "≡" handle — the
// same drag as the step's own exercise rows (`useDragReorder`).
//
// Days have no names, only their number, so the numbers stay put and the days' contents move:
// whatever is dragged to the top becomes Day 1. The labels follow the position as you drag, so
// the list always reads the way the tabs will once it is applied.
//
// The day open behind the sheet is lit, in its tab's own accent, and the light goes with it as it is
// dragged; after `Done` its tab is the one open, wherever the day landed (Artem, 26.11.2026).
//
// The order is the caller's, edited here and applied to the draft only by `Done`; closing the sheet
// any other way leaves the draft as it was — the Filters sheets' pattern, so a stray drag costs
// nothing. Before a cycle starts only: the editor is where this lives, and a started cycle is never
// opened in it.
//
// JSX/rendering only — styles live in MesoEditorReorderDaysSheetStyles.ts and pure helpers in
// MesoEditorReorderDaysSheetLogic.ts, per the code-style skill.

import { Animated, Text, View } from 'react-native';

import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { tapTargetSlop } from '@design/shapes';
import { SIZES } from '@design/tokens';

import { getDayExercises, type ExercisesByDay, type ExercisesById } from './MesoEditorDaysStepLogic';
import {
  applyDayDrag,
  REORDER_DAYS_TITLE,
  reorderDaySummary,
} from './MesoEditorReorderDaysSheetLogic';
import { styles } from './MesoEditorReorderDaysSheetStyles';
import { useDragReorder } from './useDragReorder';

export type MesoEditorReorderDaysSheetProps = {
  visible: boolean;
  /** The days' current numbers in the draft, top to bottom — `[1, 2, …]` when it opens. */
  order: readonly number[];
  /** The day open behind the sheet, by its number in the draft — lit wherever it is dragged. */
  activeDay: number;
  onChangeOrder: (order: number[]) => void;
  exercisesByDay: ExercisesByDay;
  exercisesById: ExercisesById;
  onDone: () => void;
  onClose: () => void;
};

export function MesoEditorReorderDaysSheet({
  visible,
  order,
  activeDay,
  onChangeOrder,
  exercisesByDay,
  exercisesById,
  onDone,
  onClose,
}: MesoEditorReorderDaysSheetProps) {
  const drag = useDragReorder({
    itemCount: order.length,
    rowHeight: SIZES['size/exercise-row'],
    onReorder: (newOrder) => onChangeOrder(applyDayDrag(order, newOrder)),
  });

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={REORDER_DAYS_TITLE}
      footer={<Button label="Done" onPress={onDone} />}
    >
      {order.map((dayNumber, index) => {
        const position = index + 1;
        const isOpen = dayNumber === activeDay;
        return (
          <Animated.View
            key={dayNumber}
            testID={`reorder-day-${position}`}
            accessibilityState={{ selected: isOpen }}
            style={[
              styles.row,
              isOpen && styles.rowOpen,
              drag.draggingIndex === index && styles.rowDragging,
              drag.rowTransform(index),
            ]}
          >
            <View
              {...drag.handleProps(index)}
              accessibilityLabel={`Move Day ${position}`}
              hitSlop={tapTargetSlop(SIZES['size/control-inline'])}
              style={styles.handle}
            >
              <Text style={styles.handleGlyph}>≡</Text>
            </View>
            <View style={styles.main}>
              <Text style={[styles.dayTitle, isOpen && styles.dayTitleOpen]}>{`Day ${position}`}</Text>
              <Text style={styles.summary} numberOfLines={1}>
                {reorderDaySummary(getDayExercises(exercisesByDay, dayNumber), exercisesById)}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </BottomSheet>
  );
}
