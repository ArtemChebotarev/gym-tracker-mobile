// RangeTrack — see 08.0 · Design SDK, "Компоненты": a span of values with a narrower span
// highlighted inside it and one value marked. Nothing to press; the inner span is drawn in the
// accent, as the part worth aiming for (08.7.1 shows the weights a rep target still reaches).
//
// The outer span is a row of dashes clipped to the track, the inner one a solid bar over it, and
// the marker a dot. Each label is measured and centred on its own point, so the track needs both
// its own measured width and each label's. The two end labels set the track's ends: it is pulled in
// from each side by half the label that sits there, so that label's outer edge lines up with the
// edge of the text around it (task 137). Until everything is measured the labels stay invisible.

// Values come in as numbers with text the caller has already formatted — the track never learns
// whether it is showing kilos, reps or anything else.

import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { centerOffset, roundedBar } from '../shapes';
import { COLORS, LINE_HEIGHTS, OPACITY, SIZES, SPACING, TYPOGRAPHY } from '../tokens';

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
  const [labelWidths, setLabelWidths] = useState<ReadonlyMap<number, number>>(new Map());

  function share(value: number): number {
    const span = outer.max - outer.min;
    if (span <= 0) {
      return 0;
    }
    return Math.min(Math.max((value - outer.min) / span, 0), 1);
  }

  function measureLabel(value: number, event: LayoutChangeEvent) {
    const measured = event.nativeEvent.layout.width;
    setLabelWidths((current) =>
      current.get(value) === measured ? current : new Map(current).set(value, measured),
    );
  }

  // Half of the label on each end of the track — how far the track is pulled in from that side.
  function endInset(value: number): number {
    return -centerOffset(labelWidths.get(value) ?? 0);
  }
  const insetStart = endInset(outer.min);
  const insetEnd = endInset(outer.max);

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.root}>
      <View
        testID="range-track"
        style={[styles.track, { marginLeft: insetStart, marginRight: insetEnd }]}
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
        {labels.map((label) => {
          const labelWidth = labelWidths.get(label.value);
          const placed = width > 0 && labelWidth !== undefined;
          return (
            <Text
              key={label.value}
              numberOfLines={1}
              onLayout={(event) => measureLabel(label.value, event)}
              style={[
                styles.label,
                placed
                  ? { left: insetStart + share(label.value) * width + centerOffset(labelWidth) }
                  : styles.unplaced,
              ]}
            >
              {label.text}
            </Text>
          );
        })}
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
    marginTop: SPACING['space/xl'],
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
    backgroundColor: COLORS.accent,
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
    backgroundColor: COLORS.accent,
  },
  labels: {
    marginTop: SPACING['space/xs'],
    height: LINE_HEIGHTS['line-height/caption'],
  },
  label: {
    position: 'absolute',
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    lineHeight: LINE_HEIGHTS['line-height/caption'],
    color: COLORS['text/secondary'],
  },
  unplaced: {
    opacity: OPACITY['opacity/hidden'],
  },
});
