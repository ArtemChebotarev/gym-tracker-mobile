// Styles for MesoEditorDaysStep.tsx — see the code-style skill, "Screens keep the same split,
// one level up". The header/progress-bar/footer chrome's own styles live in
// design/components/WizardScreen.tsx (task 076 review) — only this step's own content styling
// stays here.

import { StyleSheet } from 'react-native';

import {
  BORDER_WIDTHS,
  COLORS,
  ICON_SIZES,
  RADII,
  SHADOWS,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '@design/tokens';
import { circle } from '@design/shapes';

// Column widths: "Sets" centers over the Stepper's inline rendering (`size/sets-column` — two
// inline buttons, their gaps, and the value between them), and the trailing remove column mirrors
// IconButton's own diameter. The drag handle is sized like the row's other small glyphs, with a
// touch-friendly box around it (task 080).
//
// The row height is fixed and exact (`size/exercise-row`) rather than content-driven: the
// hand-rolled drag (MesoEditorDaysStep.tsx's PanResponder) turns a drag distance in points into a
// target row index by dividing by it, so if it drifted from what actually renders, dragging past
// N rows would land on N±1.

export const styles = StyleSheet.create({
  dayTabs: {
    flexGrow: 0,
  },
  dayTabsContent: {
    flexDirection: 'row',
    gap: SPACING['space/gap-tight'],
    paddingHorizontal: SPACING['space/screen'],
    paddingBottom: SPACING['space/section'],
  },
  dayTab: {
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/pill'],
    backgroundColor: COLORS['surface/card'],
    paddingHorizontal: SPACING['space/pill-x'],
    paddingVertical: SPACING['space/sm'],
  },
  dayTabActive: {
    backgroundColor: COLORS['accent/bg'],
    borderColor: COLORS['accent/border'],
  },
  dayTabLabel: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/secondary'],
  },
  dayTabLabelActive: {
    color: COLORS.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: SPACING['space/xs'],
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    marginBottom: SPACING['space/gap-tight'],
  },
  columnHeaderDotSpacer: {
    width: SIZES['size/dot-large'],
  },
  columnHeaderExercise: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
  },
  columnHeaderSets: {
    width: SIZES['size/sets-column'],
    textAlign: 'center',
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
  },
  columnHeaderRemoveSpacer: {
    width: SIZES['size/icon-button'],
  },
  columnHeaderHandleSpacer: {
    width: SIZES['size/control-inline'],
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    height: SIZES['size/exercise-row'],
    borderBottomWidth: BORDER_WIDTHS['border/default'],
    borderBottomColor: COLORS['border/divider'],
  },
  // Lifted state while a row is being dragged (task 080) — a card-like surface and shadow so it
  // visually separates from the rows it's passing over, since they don't move out of the way
  // until the drag is released (see MesoEditorDaysStep.tsx's own comment on why that's the
  // deliberately simpler choice here).
  exerciseRowDragging: {
    backgroundColor: COLORS['surface/card'],
    borderBottomColor: 'transparent',
    ...SHADOWS['shadow/lifted'],
    zIndex: 1,
  },
  dot: {
    ...circle(SIZES['size/dot-large']),
  },
  exerciseMain: {
    flex: 1,
  },
  exerciseName: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  exerciseGroup: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['text/faint'],
    marginTop: SPACING['space/xxs'],
  },
  removeIcon: {
    fontSize: ICON_SIZES['icon/small'],
    color: COLORS['text/faint'],
  },
  dragHandle: {
    width: SIZES['size/control-inline'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandleGlyph: {
    fontSize: ICON_SIZES['icon/small'],
    color: COLORS['text/faint'],
  },
  addExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/row'],
    paddingVertical: SPACING['space/md'],
  },
  addExerciseIcon: {
    ...circle(SIZES['size/badge']),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS['accent/bg'],
  },
  addExerciseIconGlyph: {
    fontSize: ICON_SIZES['icon/glyph'],
    color: COLORS.accent,
  },
  addExerciseLabel: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS.accent,
  },
});
