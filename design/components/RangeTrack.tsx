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

/**
 * A tick under the track: the value it sits over, and what it reads. It is centred on the value by
 * default; `align: 'end'` puts its right edge there instead, so a label can sit to the left of its
 * point and leave room for another beside it when the two points are close (08.11, the RIR track).
 */
export type RangeTrackLabel = { value: number; text: string; align?: 'center' | 'end' };

export type RangeTrackRange = { min: number; max: number };

export type RangeTrackProps = {
  /** The whole span the track covers — its ends are the track's ends. */
  outer: RangeTrackRange;
  /** The span drawn solid inside it. */
  inner: RangeTrackRange;
  /**
   * The value the dot marks — or several, one dot each, to mark the two ends of a span (08.11's
   * 5–30 rep corridor). Without any there is no dot: a span to read, not a value to point at.
   */
  marker?: number | readonly number[];
  labels: readonly RangeTrackLabel[];
  accessibilityLabel: string;
};

// A swatch is a short piece of the track (`size/legend-swatch`); this many dashes cross it, and it
// clips the rest.
const SWATCH_DASH_COUNT = 12;

/**
 * How many dashes it takes to run across a track `width` wide: one dash and its gap at a time, and
 * one over, since the track clips the last. A fixed count ("enough to cross any phone") ran out at
 * 360pt, and on a wider phone the dashes stopped short of the track's right end while the accent
 * bar, placed by percentage, did not — so the track looked lopsided.
 */
function dashesAcross(width: number): number {
  return Math.ceil(width / (SIZES['size/progress'] + SPACING['space/xxs'])) + 1;
}

function toPercent(share: number): `${number}%` {
  return `${share * 100}%`;
}

export function RangeTrack({ outer, inner, marker, labels, accessibilityLabel }: RangeTrackProps) {
  const markers = marker === undefined ? [] : typeof marker === 'number' ? [marker] : marker;
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
            {Array.from({ length: dashesAcross(width) }, (_, index) => (
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
        {markers.map((value) => (
          <View
            key={value}
            testID="range-track-marker"
            style={[styles.marker, { left: toPercent(share(value)) }]}
          />
        ))}
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
                  ? {
                      left:
                        insetStart +
                        share(label.value) * width +
                        (label.align === 'end' ? -labelWidth : centerOffset(labelWidth)),
                    }
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
          {Array.from({ length: SWATCH_DASH_COUNT }, (_, index) => (
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
