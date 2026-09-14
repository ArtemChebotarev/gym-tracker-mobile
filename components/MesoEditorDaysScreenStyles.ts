// Styles for MesoEditorDaysScreen.tsx — see the code-style skill, "Screens keep the same split,
// one level up". The header/title/progress-bar chrome lives in design/components/WizardHeader.tsx
// (task 076 review) — its own styles moved with it.

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

const CONTENT_PADDING_TOP = 4;
const FOOTER_PADDING_BOTTOM = 24;
const FOOTER_BORDER_WIDTH = 1;

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
const DAY_TITLE_MARGIN_BOTTOM = 2;
const ADD_ROW_PADDING_VERTICAL = 12;
const ADD_ICON_SIZE = 22;
const ADD_ICON_GLYPH_SIZE = 14;
const FOOTER_HINT_MARGIN_TOP = 10;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS['surface/page'],
  },
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
  dayTitle: {
    fontSize: TYPOGRAPHY['type/subsection-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/subsection-title'].fontWeight,
    color: COLORS['text/primary'],
    marginBottom: DAY_TITLE_MARGIN_BOTTOM,
  },
  daySub: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['text/faint'],
    marginBottom: SPACING['space/screen'],
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
  footer: {
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: SPACING['space/screen'],
    paddingBottom: FOOTER_PADDING_BOTTOM,
    borderTopWidth: FOOTER_BORDER_WIDTH,
    borderTopColor: COLORS['border/divider'],
  },
  footerHint: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['text/faint'],
    textAlign: 'center',
    marginTop: FOOTER_HINT_MARGIN_TOP,
  },
});
