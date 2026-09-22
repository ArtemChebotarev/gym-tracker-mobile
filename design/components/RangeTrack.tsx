// RangeTrack — see 08.0 · Design SDK, "Компоненты": a span of values with a narrower span
// highlighted inside it and one value marked. Reference only — no accent and nothing to press
// (08.7.1 shows the weights a rep target still reaches).
//
// The outer span is a row of dashes clipped to the track, the inner one a solid bar over it, and
// the marker a dot. Each label is a full-width centred line shifted onto its own point, which
// needs the track's measured width but nothing about how wide the label itself renders; until the
// first layout there is no width to shift by, so the labels wait for it.
//
// Values come in as numbers with text the caller has already formatted — the track never learns
// whether it is showing kilos, reps or anything else.

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { centerOffset, roundedBar } from '../shapes';
import { COLORS, LINE_HEIGHTS, SIZES, SPACING, TYPOGRAPHY } from '../tokens';

/** A tick under the track: the value it sits over, and what it reads. */
export type RangeTrackLabel = { value: number; text: string };

export type RangeTrackRange = { min: number; max: number };

export type RangeTrackProps = {
  /** The whole span the track covers — its ends are the track's ends. */
  outer: RangeTrackRange;
  /** The span drawn solid inside it. */
  inner: RangeTrackRange;
  /** The value the dot marks. */
  marker: number;
  labels: readonly RangeTrackLabel[];
  accessibilityLabel: string;
};

// Enough dashes to cross any phone — the track clips whatever doesn't fit.
const DASH_COUNT = 60;

function toPercent(share: number): `${number}%` {
  return `${share * 100}%`;
}

export function RangeTrack({ outer, inner, marker, labels, accessibilityLabel }: RangeTrackProps) {
  const [width, setWidth] = useState(0);

  function share(value: number): number {
    const span = outer.max - outer.min;
    if (span <= 0) {
      return 0;
    }
    return Math.min(Math.max((value - outer.min) / span, 0), 1);
  }

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.root}>
      <View
        testID="range-track"
        style={styles.track}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.bars}>
          <View style={styles.dashes}>
            {Array.from({ length: DASH_COUNT }, (_, index) => (
              <View key={index} style={styles.dash} />
            ))}
          </View>
          <View
            testID="range-track-inner"
            style={[
              styles.inner,
              { left: toPercent(share(inner.min)), right: toPercent(1 - share(inner.max)) },
            ]}
          />
        </View>
        <View
          testID="range-track-marker"
          style={[styles.marker, { left: toPercent(share(marker)) }]}
        />
      </View>
      <View style={styles.labels}>
        {width > 0 &&
          labels.map((label) => (
            <Text
              key={label.value}
              style={[
                styles.label,
                { transform: [{ translateX: share(label.value) * width - width / 2 }] },
              ]}
            >
              {label.text}
            </Text>
          ))}
      </View>
    </View>
  );
}

/**
 * A short piece of the track, for a legend line naming one of its two spans — the same dashes and
 * the same solid bar, so the line and the track read as the same thing.
 */
export function RangeTrackSwatch({ span }: { span: 'outer' | 'inner' }) {
  return (
    <View testID={`range-track-swatch-${span}`} style={styles.swatch}>
      {span === 'inner' ? (
        <View style={[StyleSheet.absoluteFill, styles.innerSwatch]} />
      ) : (
        <View style={styles.dashes}>
          {Array.from({ length: DASH_COUNT }, (_, index) => (
            <View key={index} style={styles.dash} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: SPACING['space/md'],
  },
  track: {
    height: SIZES['size/dot-large'],
    justifyContent: 'center',
  },
  bars: {
    ...roundedBar(SIZES['size/progress']),
    overflow: 'hidden',
  },
  dashes: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    gap: SPACING['space/xxs'],
  },
  dash: {
    width: SIZES['size/progress'],
    backgroundColor: COLORS['text/faint'],
  },
  inner: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    ...roundedBar(SIZES['size/progress']),
    backgroundColor: COLORS['text/secondary'],
  },
  marker: {
    position: 'absolute',
    ...roundedBar(SIZES['size/dot-large']),
    width: SIZES['size/dot-large'],
    marginLeft: centerOffset(SIZES['size/dot-large']),
    backgroundColor: COLORS['text/primary'],
  },
  swatch: {
    width: SIZES['size/legend-swatch'],
    ...roundedBar(SIZES['size/progress']),
    overflow: 'hidden',
  },
  innerSwatch: {
    backgroundColor: COLORS['text/secondary'],
  },
  labels: {
    marginTop: SPACING['space/xs'],
    height: LINE_HEIGHTS['line-height/caption'],
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    lineHeight: LINE_HEIGHTS['line-height/caption'],
    color: COLORS['text/secondary'],
  },
});
