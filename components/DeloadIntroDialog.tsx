// The first-deload popup — shown once, over the first deload session the app opens, then never
// again (08.11 · Onboarding, "5. Попап первой deload-недели"). The same body as the Welcome dialog
// (`Dialog`), without the wordmark: a title, a lead line, three chips with one fact each (the
// first-weight ladder's shape) and `Got it`.
//
// Whether it is shown is the caller's call (the Today route reads the `deloadIntroSeen` flag);
// this only draws it and reports the tap.

import { Text, View } from 'react-native';

import { Button } from '@design/components/Button';
import { Chip } from '@design/components/Chip';
import { Dialog } from '@design/components/Dialog';
import { PlateText } from '@design/components/PlateText';
import { SIZES } from '@design/tokens';

import {
  DELOAD_INTRO_BUTTON_LABEL,
  DELOAD_INTRO_FACTS,
  DELOAD_INTRO_LEAD,
  DELOAD_INTRO_NOTE,
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
      <PlateText parts={DELOAD_INTRO_LEAD} style={styles.lead} />
      <View style={styles.facts}>
        {DELOAD_INTRO_FACTS.map((fact) => (
          <View key={fact.chip} style={styles.fact}>
            <Chip variant="static" label={fact.chip} compact accent width={SIZES['size/fact-chip']} />
            <Text style={styles.factText}>{fact.text}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>{DELOAD_INTRO_NOTE}</Text>
      <Button label={DELOAD_INTRO_BUTTON_LABEL} onPress={onDismiss} />
    </Dialog>
  );
}
