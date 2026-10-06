// The body of the RIR explanation — the track and the theses under it (08.11, GT-40/GT-42). One
// component for both places it appears, the badge's popover and the first coachmark, so they show
// the same thing. The legend of the Reps ⓘ popover is the model: a track, then short rows.

import { View } from 'react-native';

import { PlateRow } from '@design/components/PlateRow';
import { RangeTrack } from '@design/components/RangeTrack';
import type { RirExplanation } from './RirExplanationLogic';
import { styles } from './RirExplanationContentStyles';

export function RirExplanationContent({ explanation }: { explanation: RirExplanation }) {
  const { track, rows } = explanation;

  return (
    <View style={styles.root}>
      <RangeTrack
        outer={track.outer}
        inner={track.inner}
        marker={track.marker}
        labels={track.labels}
        accessibilityLabel={track.accessibilityLabel}
      />
      <View style={styles.rows}>
        {rows.map((row, index) => (
          <PlateRow key={index} leading={{ icon: row.icon }} text={row.text} />
        ))}
      </View>
    </View>
  );
}
