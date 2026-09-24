// WizardScreen — the persistent frame for a multi-step wizard flow (currently only the
// mesocycle editor's Basics → Days & exercises → Review, see 08.5, but written domain-agnostic
// like WizardHeader). Mounted exactly ONCE for the whole flow — the caller swaps `children` and
// `footer` as the user moves between steps, it does not swap this component itself.
//
// This exists because giving each step its own screen file, each rendering its own
// SafeAreaView/WizardHeader/footer, meant React Navigation actually unmounted one screen and
// mounted a new one on every step change — even with the transition animation turned off, that
// remount visibly reset the header/progress-bar/button positions for a frame, which is exactly
// the "jump" a caller review flagged after testing task 076 on-device: "Между шагами 1 и 2
// прыгает всё... я хочу это видеть как виджет, внутри которого меняется контент при передвижении
// вперёд назад, но выравнивание и т.д. остаются на месте." The fix is architectural, not visual:
// one mounted shell, driven entirely by step state in the caller (no per-step routes at all) —
// see app/meso-editor/new.tsx.
//
// Wrapped in its own SafeAreaProvider, even though Expo Router already supplies one at the app
// root (see ExpoRoot's own SafeAreaProviderCompat) — a caller review found the header losing its
// top inset specifically after switching from step 1 to step 2 on this exact screen (both steps
// render through the same persistent SafeAreaView, never remounted, so this wasn't insets being
// stale from a remount). The root provider is a fullScreenModal's ancestor, not a descendant of
// the modal's own native presentation; nesting a second provider here — inside the modal — is
// the fix, not just defensive duplication, and matches what worked before this flow was merged
// into one screen (each old per-step screen had its own local provider too).

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { BORDER_WIDTHS, COLORS, SPACING } from '../tokens';
import { WizardHeader, type WizardTitlePlacement } from './WizardHeader';

export type WizardScreenProps = {
  title: string;
  currentStep: number;
  totalSteps: number;
  /** Passed through to WizardHeader — see `WizardTitlePlacement`. Defaults to `heading`. */
  titlePlacement?: WizardTitlePlacement;
  footer: ReactNode;
  children: ReactNode;
} & ({ onClose: () => void; onBack?: never } | { onBack: () => void; onClose?: never });

export function WizardScreen({
  title,
  currentStep,
  totalSteps,
  titlePlacement,
  footer,
  children,
  onClose,
  onBack,
}: WizardScreenProps) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {onClose ? (
          <WizardHeader
            title={title}
            currentStep={currentStep}
            totalSteps={totalSteps}
            titlePlacement={titlePlacement}
            onClose={onClose}
          />
        ) : (
          <WizardHeader
            title={title}
            currentStep={currentStep}
            totalSteps={totalSteps}
            titlePlacement={titlePlacement}
            onBack={onBack!}
          />
        )}

        <View style={styles.body}>{children}</View>

        <View style={styles.footer}>{footer}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS['surface/page'],
  },
  body: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: SPACING['space/screen'],
    paddingBottom: SPACING['space/xl'],
    borderTopWidth: BORDER_WIDTHS['border/default'],
    borderTopColor: COLORS['border/divider'],
  },
});
