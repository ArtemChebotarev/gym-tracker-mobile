// Day tabs — the `Day 1 · Day 2 · …` row over a week's days. Shared by the editor's Days &
// exercises step (08.5) and the template preview sheet (08.10): both pick a day of the same wizard's
// week, so they look the same — the chosen tab in accent. 08.10's mockup drew the preview's in a
// neutral fill; Artem chose one look for both (05.10.2026, GT-8).
//
// Scrolls sideways so a 7-day week fits on a narrow phone. Spacing around the row is the caller's
// (`contentContainerStyle`): the editor pads it to the screen edge, a sheet is already padded.

import { Pressable, ScrollView, Text, type StyleProp, type ViewStyle } from 'react-native';

import { tapTargetSlop } from '@design/shapes';
import { SIZES } from '@design/tokens';

import { styles } from './DayTabsStyles';

export type DayTabsProps = {
  dayNumbers: readonly number[];
  activeDay: number;
  onChangeDay: (day: number) => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function DayTabs({
  dayNumbers,
  activeDay,
  onChangeDay,
  contentContainerStyle,
}: DayTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabs}
      contentContainerStyle={[styles.tabsContent, contentContainerStyle]}
    >
      {dayNumbers.map((day) => {
        const isActive = day === activeDay;
        return (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityLabel={`Day ${day}`}
            accessibilityState={{ selected: isActive }}
            onPress={() => onChangeDay(day)}
            hitSlop={tapTargetSlop(SIZES['size/chip'])}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{`Day ${day}`}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
