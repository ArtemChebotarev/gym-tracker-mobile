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
import { COLORS, ICON_SIZES, RADII, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { IconButton } from './IconButton';

export type WizardHeaderProps = {
  title: string;
  currentStep: number;
  totalSteps: number;
} & ({ onClose: () => void; onBack?: never } | { onBack: () => void; onClose?: never });

// Mockup (01-new-meso-basics.html / 02-new-meso-days.html): .progress div{gap:4px;height:3px;
// border-radius:2px}, .title's 6px/4px top/bottom padding, .header's 18px/6px top/bottom padding.

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
    paddingTop: SPACING['space/section'],
    paddingBottom: SPACING['space/gap-tight'],
  },
  icon: {
    fontSize: ICON_SIZES['icon/small'],
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
    paddingTop: SPACING['space/gap-tight'],
    paddingBottom: SPACING['space/xs'],
  },
  progress: {
    flexDirection: 'row',
    gap: SPACING['space/xs'],
    paddingHorizontal: SPACING['space/screen'],
    paddingBottom: SPACING['space/screen'],
  },
  progressSegment: {
    flex: 1,
    height: SIZES['size/progress'],
    borderRadius: RADII['radius/progress'],
    backgroundColor: COLORS['border/divider-subtle'],
  },
  progressSegmentDone: {
    backgroundColor: COLORS.accent,
  },
});
