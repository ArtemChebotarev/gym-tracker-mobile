// The Welcome dialog — shown once over the first Today, then never again (08.11 · Onboarding,
// "1. Welcome"). Wordmark, a one-line promise, three steps and `Got it`; no cross, no way out but
// the button or the cross in the corner (08.11 said no cross; Artem asked for one on 06.10.2026,
// and it does exactly what `Got it` does), and no path to creating a cycle from here — closing it
// leaves the user on Today.
//
// Whether it is shown is the caller's call (the Today route reads the `welcomeSeen` flag); this
// only draws it and reports the tap.

import { Text, View } from 'react-native';

import { Button } from '@design/components/Button';
import { Dialog } from '@design/components/Dialog';
import { HybroWordmark } from '@design/components/HybroWordmark';
import { COLORS, ICON_SIZES } from '@design/tokens';

import { WELCOME_BUTTON_LABEL, WELCOME_STEPS, WELCOME_TITLE } from './WelcomeDialogLogic';
import { styles } from './WelcomeDialogStyles';

export type WelcomeDialogProps = {
  visible: boolean;
  /** `Got it`, the cross, or Android's back button — all three are the same dismissal. */
  onDismiss: () => void;
};

export function WelcomeDialog({ visible, onDismiss }: WelcomeDialogProps) {
  return (
    <Dialog visible={visible} onClose={onDismiss}>
      <View style={styles.header}>
        <HybroWordmark />
        <Text style={styles.title}>{WELCOME_TITLE}</Text>
      </View>
      <View style={styles.steps}>
        {WELCOME_STEPS.map(({ icon: Icon, title, text }) => (
          <View key={title} style={styles.step}>
            <View style={styles.stepIcon}>
              <Icon size={ICON_SIZES['icon/tab']} color={COLORS.accent} />
            </View>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepBody}>{text}</Text>
            </View>
          </View>
        ))}
      </View>
      <Button label={WELCOME_BUTTON_LABEL} onPress={onDismiss} />
    </Dialog>
  );
}
