// TimePickerSheet — see canvas 8.2, "Time picker for a round field": a duration chosen on two
// wheels, minutes and seconds, in a panel that rises from the bottom with the title of what is
// being set, a line under it, and Done. For any field that holds a length of time — a round's work
// or rest, an exercise's defaults — where `−` / `+` by five seconds is too many taps.
//
// The wheels are the system's own on iOS (a SwiftUI `Picker` in wheel style, two of them side by
// side), so they look, scroll and click like every other iOS wheel. iOS's own countdown picker
// does not do seconds, hence two pickers rather than one. Elsewhere there is no SwiftUI and the
// wheels are a scrolling column that snaps to a row — same values, same bounds.
//
// Controlled: it shows `value` and reports every change through `onChange`, held within
// `[minSec, maxSec]` — what is picked is already what will be kept. Done only closes the panel.
//
// Reuses BottomSheet for the panel: its title, subtitle and action are the canvas's bar.

import { useEffect, useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HStack, Host, Picker, Text as NativeText } from '@expo/ui/swift-ui';
import { frame, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import {
  joinSeconds,
  minuteOptions,
  secondOptions,
  splitSeconds,
} from '../timePickerLogic';
import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { BottomSheet } from './BottomSheet';

export type TimePickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** What is being set: `Rest · round 1`. */
  title: string;
  /** A line under the title: what else the change moves. */
  subtitle?: string;
  /** Seconds. */
  value: number;
  onChange: (valueSec: number) => void;
  /** The least and the most the field may hold, seconds. */
  minSec?: number;
  maxSec: number;
  /** Seconds between two positions of the seconds wheel. Defaults to 5. */
  stepSec?: number;
};

const DEFAULT_STEP_SEC = 5;

export function TimePickerSheet({
  visible,
  onClose,
  title,
  subtitle,
  value,
  onChange,
  minSec = 0,
  maxSec,
  stepSec = DEFAULT_STEP_SEC,
}: TimePickerSheetProps) {
  const { minutes, seconds } = splitSeconds(value);
  const minuteValues = minuteOptions(maxSec);
  const secondValues = secondOptions(stepSec);
  // A value that is not on a step (an old 0:07) shows on the nearest position below it.
  const shownSeconds = secondValues.filter((s) => s <= seconds).pop() ?? 0;

  const columns = {
    minutes: { values: minuteValues, selected: minutes },
    seconds: { values: secondValues, selected: shownSeconds },
  };

  function changeMinutes(nextMinutes: number) {
    onChange(joinSeconds(nextMinutes, shownSeconds, minSec, maxSec));
  }
  function changeSeconds(nextSeconds: number) {
    onChange(joinSeconds(minutes, nextSeconds, minSec, maxSec));
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      action={
        <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={onClose}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      }
    >
      {Platform.OS === 'ios' ? (
        <Host style={styles.host}>
          <HStack spacing={SPACING['space/gap-tight']}>
            <Picker
              selection={columns.minutes.selected}
              onSelectionChange={changeMinutes}
              modifiers={[
                pickerStyle('wheel'),
                frame({ width: SIZES['size/time-wheel-column'], height: SIZES['size/time-wheel-height'] }),
              ]}
            >
              {columns.minutes.values.map((minute) => (
                <NativeText key={minute} modifiers={[tag(minute)]}>
                  {String(minute)}
                </NativeText>
              ))}
            </Picker>
            <NativeText>min</NativeText>
            <Picker
              selection={columns.seconds.selected}
              onSelectionChange={changeSeconds}
              modifiers={[
                pickerStyle('wheel'),
                frame({ width: SIZES['size/time-wheel-column'], height: SIZES['size/time-wheel-height'] }),
              ]}
            >
              {columns.seconds.values.map((second) => (
                <NativeText key={second} modifiers={[tag(second)]}>
                  {String(second).padStart(2, '0')}
                </NativeText>
              ))}
            </Picker>
            <NativeText>sec</NativeText>
          </HStack>
        </Host>
      ) : (
        <View style={styles.fallback}>
          <ScrollWheel
            values={columns.minutes.values}
            selected={columns.minutes.selected}
            unit="min"
            onSelect={changeMinutes}
          />
          <ScrollWheel
            values={columns.seconds.values}
            selected={columns.seconds.selected}
            unit="sec"
            onSelect={changeSeconds}
          />
        </View>
      )}
    </BottomSheet>
  );
}

type ScrollWheelProps = {
  values: number[];
  selected: number;
  unit: string;
  onSelect: (value: number) => void;
};

// Off iOS: a column that scrolls and snaps to a row; the row in the middle is the value.
function ScrollWheel({ values, selected, unit, onSelect }: ScrollWheelProps) {
  const row = SIZES['size/time-wheel-row'];
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: values.indexOf(selected) * row, animated: false });
  }, [values, selected, row]);

  return (
    <View style={styles.wheel}>
      <ScrollView
        ref={scrollRef}
        style={styles.wheelScroll}
        snapToInterval={row}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.wheelContent}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.y / row);
          const next = values[Math.min(values.length - 1, Math.max(0, index))];
          if (next !== undefined) {
            onSelect(next);
          }
        }}
      >
        {values.map((value) => (
          <View key={value} style={styles.wheelRow}>
            <Text style={styles.wheelValue}>{unit === 'sec' ? String(value).padStart(2, '0') : value}</Text>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  done: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS.accent,
  },
  host: {
    height: SIZES['size/time-wheel-height'],
    alignSelf: 'stretch',
  },
  fallback: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING['space/gap'],
  },
  wheel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  wheelScroll: {
    height: SIZES['size/time-wheel-height'],
    width: SIZES['size/time-wheel-column'],
  },
  wheelContent: {
    paddingVertical: SIZES['size/time-wheel-inset'],
  },
  wheelRow: {
    height: SIZES['size/time-wheel-row'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelValue: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/primary'],
  },
  unit: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
  },
});
