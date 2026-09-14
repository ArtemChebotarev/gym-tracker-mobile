// WizardHeader — see 08.0 · Design SDK, "Компоненты": the header/title/progress-bar chrome
// shared by every step of a multi-step wizard flow (currently only the mesocycle editor's
// Basics → Days & exercises → Review, see 08.5, but written domain-agnostic so any future
// wizard flow reuses it). Originally duplicated by hand in each step's own screen file — pulled
// out here (task 076 review) once step 2 revealed the duplication had a real bug: step 2 had
// copy-pasted step 1's Close (✕) button instead of a Back (‹) one.
//
// Exactly one of `onClose` / `onBack` is expected per step: the flow's first step shows Close
// (✕) — it abandons the whole flow — every later step shows Back (‹) — it returns to the
// previous step instead. The type only documents this; nothing here enforces "first step only"
// — that's the caller's responsibility, same as every other prop-driven design component.

import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../tokens';
import { IconButton } from './IconButton';

export type WizardHeaderProps = {
  title: string;
  currentStep: number;
  totalSteps: number;
} & ({ onClose: () => void; onBack?: never } | { onBack: () => void; onClose?: never });

// No dedicated size token exists yet — same exception as IconButton's own DIAMETER.
const ICON_SIZE = 16;
// Mockup (01-new-meso-basics.html / 02-new-meso-days.html): .progress div{gap:4px;height:3px;
// border-radius:2px}, .title's 6px/4px top/bottom padding, .header's 18px/6px top/bottom
// padding. No token exists for any of these.
const PROGRESS_GAP = 4;
const PROGRESS_SEGMENT_HEIGHT = 3;
const PROGRESS_SEGMENT_RADIUS = 2;
const HEADER_PADDING_TOP = 18;
const HEADER_PADDING_BOTTOM = 6;
const TITLE_PADDING_TOP = 6;
const TITLE_PADDING_BOTTOM = 4;

export function WizardHeader({ title, currentStep, totalSteps, onClose, onBack }: WizardHeaderProps) {
  const isClose = onClose !== undefined;

  return (
    <View>
      <View style={styles.header}>
        <IconButton accessibilityLabel={isClose ? 'Close' : 'Back'} onPress={isClose ? onClose : onBack!}>
          <Text style={styles.icon}>{isClose ? '✕' : '‹'}</Text>
        </IconButton>
        <Text style={styles.stepLabel}>{`Step ${currentStep} of ${totalSteps}`}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.progress}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[styles.progressSegment, index < currentStep && styles.progressSegmentDone]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: HEADER_PADDING_BOTTOM,
  },
  icon: {
    fontSize: ICON_SIZE,
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
});
