import { View } from 'react-native';

import { TimerCapsule } from '@design/components/TimerCapsule';
import { useTimerCapsuleStore } from '@state/timerCapsuleStore';

import { TimerCapsuleHostStyles as styles } from './TimerCapsuleHostStyles';

// Where the floating timer capsule is drawn (GT-85): inside the tab bar's overlay, just above the
// bar, so it stays on screen whichever tab is open — the tab bar is laid over every tab, and the
// capsule rides with it. Draws nothing until something runs a timer (state/timerCapsuleStore).
export function TimerCapsuleHost() {
  const capsule = useTimerCapsuleStore((s) => s.capsule);
  if (capsule === null) return null;

  return (
    <View pointerEvents="box-none" style={styles.slot}>
      <TimerCapsule {...capsule} />
    </View>
  );
}
