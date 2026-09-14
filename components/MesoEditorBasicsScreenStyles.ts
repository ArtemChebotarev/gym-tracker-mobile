// Styles for MesoEditorBasicsScreen.tsx — see the code-style skill, "Screens keep the same
// split, one level up".

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

// Mockup (01-new-meso-basics.html): .progress div{gap:4px;height:3px;border-radius:2px}, the
// close glyph at font-size:16px, .title's 6px/4px top/bottom padding, .content's 4px top
// padding, .footer's 24px bottom padding and 1px top divider. No token exists yet at any of
// these sizes — same exception ExerciseFormSheetStyles.ts's FIELDS_MIN_HEIGHT and
// ExerciseFiltersSheetStyles.ts's BORDER_WIDTH/DOT_SIZE already take.
const PROGRESS_GAP = 4;
const PROGRESS_SEGMENT_HEIGHT = 3;
const PROGRESS_SEGMENT_RADIUS = 2;
const CLOSE_ICON_SIZE = 16;
const TITLE_PADDING_TOP = 6;
const TITLE_PADDING_BOTTOM = 4;
const CONTENT_PADDING_TOP = 4;
const FOOTER_PADDING_BOTTOM = 24;
const FOOTER_BORDER_WIDTH = 1;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS['surface/page'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: SPACING['space/section'],
    paddingBottom: SPACING['space/gap-tight'],
  },
  closeIcon: {
    fontSize: CLOSE_ICON_SIZE,
    color: COLORS['text/secondary'],
  },
  stepLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['text/faint'],
  },
  title: {
    fontSize: TYPOGRAPHY['type/sheet-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/sheet-title'].fontWeight,
    color: COLORS['text/primary'],
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: TITLE_PADDING_TOP,
    paddingBottom: TITLE_PADDING_BOTTOM,
  },
  progress: {
    flexDirection: 'row',
    gap: PROGRESS_GAP,
    paddingHorizontal: SPACING['space/screen'],
    paddingBottom: SPACING['space/screen'],
  },
  progressSegment: {
    flex: 1,
    height: PROGRESS_SEGMENT_HEIGHT,
    borderRadius: PROGRESS_SEGMENT_RADIUS,
    backgroundColor: COLORS['border/divider-subtle'],
  },
  progressSegmentDone: {
    backgroundColor: COLORS.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: CONTENT_PADDING_TOP,
  },
  section: {
    marginBottom: SPACING['space/section'],
  },
  footer: {
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: SPACING['space/screen'],
    paddingBottom: FOOTER_PADDING_BOTTOM,
    borderTopWidth: FOOTER_BORDER_WIDTH,
    borderTopColor: COLORS['border/divider'],
  },
});
