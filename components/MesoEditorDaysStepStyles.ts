// Styles for MesoEditorDaysStep.tsx — see the code-style skill, "Screens keep the same split,
// one level up". The header/progress-bar/footer chrome's own styles live in
// design/components/WizardScreen.tsx (task 076 review) — only this step's own content styling
// stays here.

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

const CONTENT_PADDING_TOP = 4;

// Mockup (02-new-meso-days.html): `.dot{width:8px;height:8px}` — bigger than the 6px group-dot
// Chip/SectionHeader/ExerciseFiltersSheet already use elsewhere in the app. Kept as this
// screen's own local size rather than changed to match, since the mockup is this task's literal
// pixel spec and 6px is not written down as a shared token — it's just every other screen's own
// local constant happening to agree so far.
const DOT_SIZE = 8;
const EXERCISE_GROUP_MARGIN_TOP = 2;
const REMOVE_ICON_SIZE = 16;
const DAY_TAB_PADDING_HORIZONTAL = 16;
const DAY_TAB_PADDING_VERTICAL = 8;
const DAY_TAB_BORDER_WIDTH = 1;
const ROW_BORDER_WIDTH = 1;
const ADD_ROW_PADDING_VERTICAL = 12;
const ADD_ICON_SIZE = 22;
const ADD_ICON_GLYPH_SIZE = 14;
const COLUMN_HEADER_MARGIN_BOTTOM = 6;
// Width of the Stepper's own inline rendering (two 24px buttons, two 6px gaps, and the value
// text between them) — matched here so "Sets" centers over the actual stepper below it rather
// than over the row's full remaining width. IconButton's own DIAMETER (30, not exported) is
// mirrored the same way for the trailing remove-button column.
const SETS_COLUMN_WIDTH = 80;
const REMOVE_COLUMN_WIDTH = 30;

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
    borderWidth: DAY_TAB_BORDER_WIDTH,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/pill'],
    backgroundColor: COLORS['surface/card'],
    paddingHorizontal: DAY_TAB_PADDING_HORIZONTAL,
    paddingVertical: DAY_TAB_PADDING_VERTICAL,
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
    paddingTop: CONTENT_PADDING_TOP,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    marginBottom: COLUMN_HEADER_MARGIN_BOTTOM,
  },
  columnHeaderDotSpacer: {
    width: DOT_SIZE,
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
    width: SETS_COLUMN_WIDTH,
    textAlign: 'center',
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
  },
  columnHeaderRemoveSpacer: {
    width: REMOVE_COLUMN_WIDTH,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    paddingVertical: SPACING['space/row'],
    borderBottomWidth: ROW_BORDER_WIDTH,
    borderBottomColor: COLORS['border/divider'],
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
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
    marginTop: EXERCISE_GROUP_MARGIN_TOP,
  },
  removeIcon: {
    fontSize: REMOVE_ICON_SIZE,
    color: COLORS['text/faint'],
  },
  addExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/row'],
    paddingVertical: ADD_ROW_PADDING_VERTICAL,
  },
  addExerciseIcon: {
    width: ADD_ICON_SIZE,
    height: ADD_ICON_SIZE,
    borderRadius: ADD_ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS['accent/bg'],
  },
  addExerciseIconGlyph: {
    fontSize: ADD_ICON_GLYPH_SIZE,
    color: COLORS.accent,
  },
  addExerciseLabel: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS.accent,
  },
});
