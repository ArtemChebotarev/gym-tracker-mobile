// The first-deload popup — shown once, over the first deload session the app opens, then never
// again (08.11 · Onboarding, "5. Попап первой deload-недели"). The same body as the Welcome dialog
// (`Dialog`), without the wordmark: a title, two paragraphs and `Got it`.
//
// Whether it is shown is the caller's call (the Today route reads the `deloadIntroSeen` flag);
// this only draws it and reports the tap.

import { Text, View } from 'react-native';

import { Button } from '@design/components/Button';
import { Dialog } from '@design/components/Dialog';
import { PlateText } from '@design/components/PlateText';

import {
  DELOAD_INTRO_BUTTON_LABEL,
  DELOAD_INTRO_PARAGRAPHS,
  DELOAD_INTRO_TITLE,
} from './DeloadIntroDialogLogic';
import { styles } from './DeloadIntroDialogStyles';
import { styles as welcomeStyles } from './WelcomeDialogStyles';

export type DeloadIntroDialogProps = {
  visible: boolean;
  /** `Got it`, the cross, or Android's back button — all three are the same dismissal. */
  onDismiss: () => void;
};

export function DeloadIntroDialog({ visible, onDismiss }: DeloadIntroDialogProps) {
  return (
    <Dialog visible={visible} onClose={onDismiss}>
      <View style={welcomeStyles.header}>
        <Text style={welcomeStyles.title}>{DELOAD_INTRO_TITLE}</Text>
      </View>
      <View style={styles.body}>
        {DELOAD_INTRO_PARAGRAPHS.map((parts, index) => (
          <PlateText key={index} parts={parts} style={styles.paragraph} />
        ))}
      </View>
      <Button label={DELOAD_INTRO_BUTTON_LABEL} onPress={onDismiss} />
    </Dialog>
  );
}
