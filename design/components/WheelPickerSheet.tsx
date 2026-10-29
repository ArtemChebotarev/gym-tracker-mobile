// WheelPickerSheet — the panel behind every wheel picker: a title, a line under it and Done, over
// one or more wheels of numbers (canvas 8.2, "Time picker for a round field"). TimePickerSheet
// (minutes and seconds) and NumberPickerSheet (a count) are this with their columns filled in;
// nothing else should need to draw its own wheels.
//
// The wheels are the system's own on iOS — a SwiftUI `Picker` in wheel style per column, side by
// side — so they look, scroll and click like every other iOS wheel. Elsewhere there is no SwiftUI
// and a column is a scrolling list that snaps to a row: same values, same bounds.
//
// Controlled: the caller says what each column holds and which value is picked, and hears every
// change. Done only closes the panel. Reuses BottomSheet: its title, subtitle and action are the
// canvas's bar.

import { useEffect, useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HStack, Host, Picker, Text as NativeText } from '@expo/ui/swift-ui';
import { frame, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { BottomSheet } from './BottomSheet';

/** One wheel: the numbers on it, the one picked, and the word after it (`min`). */
export type WheelColumn = {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  /** How a value is written on the wheel; the number as it is by default. */
  format?: (value: number) => string;
  /** A word after the wheel. */
  unit?: string;
};

export type WheelPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** What is being set: `Rest · round 1`. */
  title: string;
  /** A line under the title: what else the change moves. */
  subtitle?: string;
  columns: WheelColumn[];
};

function formatPlain(value: number): string {
  return String(value);
}

export function WheelPickerSheet({
  visible,
  onClose,
  title,
  subtitle,
  columns,
}: WheelPickerSheetProps) {
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
            {columns.map((column, index) => (
              <NativeWheel key={index} column={column} />
            ))}
          </HStack>
        </Host>
      ) : (
        <View style={styles.fallback}>
          {columns.map((column, index) => (
            <ScrollWheel key={index} column={column} />
          ))}
        </View>
      )}
    </BottomSheet>
  );
}

// A wheel and the word after it, as the children of the HStack above.
function NativeWheel({ column }: { column: WheelColumn }) {
  const format = column.format ?? formatPlain;
  return (
    <>
      <Picker
        selection={column.selected}
        onSelectionChange={column.onSelect}
        modifiers={[
          pickerStyle('wheel'),
          frame({ width: SIZES['size/time-wheel-column'], height: SIZES['size/time-wheel-height'] }),
        ]}
      >
        {column.values.map((value) => (
          <NativeText key={value} modifiers={[tag(value)]}>
            {format(value)}
          </NativeText>
        ))}
      </Picker>
      {column.unit !== undefined && <NativeText>{column.unit}</NativeText>}
    </>
  );
}

// Off iOS: a column that scrolls and snaps to a row; the row in the middle is the value.
function ScrollWheel({ column }: { column: WheelColumn }) {
  const row = SIZES['size/time-wheel-row'];
  const format = column.format ?? formatPlain;
  const scrollRef = useRef<ScrollView>(null);
  const { values, selected, onSelect, unit } = column;

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
            <Text style={styles.wheelValue}>{format(value)}</Text>
          </View>
        ))}
      </ScrollView>
      {unit !== undefined && <Text style={styles.unit}>{unit}</Text>}
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
