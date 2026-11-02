// The `Notifications` section of Settings (GT-219, 08.11 · Onboarding, section 7): what reaches the
// user when the app is not on screen. It is apart from `In-app signals`, and neither has a say over
// the other. Off, it offers notifications on a plate the cross puts away for good, leaving a quiet
// row; on, `Change` leads to the system's Settings, the only place to turn them off.

import { Pressable, Text, View } from 'react-native';

import { Button } from '@design/components/Button';
import { CloseIcon } from '@design/icons/CloseIcon';
import { tapTargetSlop } from '@design/shapes';
import { COLORS, ICON_SIZES } from '@design/tokens';

import { styles } from './RestNotificationsSectionStyles';
import type { RestNotificationsView } from './RestNotificationsSectionLogic';

export type RestNotificationsSectionProps = {
  view: RestNotificationsView;
  onTurnOn: () => void;
  onChange: () => void;
  onHidePlate: () => void;
};

export function RestNotificationsSection({
  view,
  onTurnOn,
  onChange,
  onHidePlate,
}: RestNotificationsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Notifications</Text>
      {view === 'plate' ? (
        <View style={styles.plate}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hide rest notifications"
            onPress={onHidePlate}
            hitSlop={tapTargetSlop(ICON_SIZES['icon/inline'])}
            style={styles.hide}
          >
            <CloseIcon size={ICON_SIZES['icon/inline']} color={COLORS['text/muted']} />
          </Pressable>
          <View style={styles.plateTitleRow}>
            <Text style={styles.plateTitle}>Rest notifications</Text>
            <View style={styles.recommended}>
              <Text style={styles.recommendedLabel}>Recommended</Text>
            </View>
          </View>
          <Text style={styles.plateText}>
            Know when rest ends with your phone locked or in another app.
          </Text>
          <View style={styles.plateAction}>
            <Button label="Turn on" onPress={onTurnOn} />
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Rest notifications</Text>
            <Text style={styles.rowDescription}>
              {view === 'on' ? 'On: rest ends with your phone locked too' : 'Off: only in-app signals'}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={view === 'on' ? onChange : onTurnOn}>
            <Text style={styles.rowAction}>{view === 'on' ? 'Change' : 'Turn on'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
