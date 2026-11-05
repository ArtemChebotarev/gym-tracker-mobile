// Filters sheet for the template list — 08.10 · Редактор мезоцикла — Flow B, "Шаг T" (GT-217;
// canvas «Шаблоны», `TemplatesFilters`, whose groups were only an example). Built from the same
// pieces as the exercise library's sheet — FilterSheet, FilterSection, FilterOption, Toggle — so the
// two read and behave as one: a draft selection, `Reset` in the header, `Show N templates` below.
//
// Three groups, as Artem chose them (05.11.2026): how many days a week, the focus (Full body, Upper
// body, Lower body), and Hybrid. Hybrid is a switch rather than an option, because it is a yes or
// no, and its description is where the word is explained — the one place a new user meets it with
// room for a sentence. No level and no place: a level belongs in a template's description, a place
// was there for one friend.
//
// Fully controlled like ExerciseFiltersSheet: the caller owns the draft and its live result count.
//
// JSX only — pure helpers in TemplateFiltersSheetLogic.ts, styles in TemplateFiltersSheetStyles.ts.

import { View } from 'react-native';

import { FilterOption } from '@design/components/FilterOption';
import { FilterSection, FilterSheet } from '@design/components/FilterSheet';
import { Toggle } from '@design/components/Toggle';
import type { TemplateFilters } from '@domain/templateListing';

import { templateDayCountLabel, templateTagLabel } from './templateLabels';
import {
  DAY_OPTIONS_PER_ROW,
  FOCUS_OPTIONS_PER_ROW,
  FOCUS_TAGS,
  optionRows,
  isHybridOnly,
  setHybridOnly,
  templateApplyLabel,
  toggleDayCount,
  toggleTag,
} from './TemplateFiltersSheetLogic';
import { styles } from './TemplateFiltersSheetStyles';

export type TemplateFiltersSheetProps = {
  visible: boolean;
  filters: TemplateFilters;
  onChangeFilters: (filters: TemplateFilters) => void;
  /** The Days options: the day counts the templates train, fewest first. */
  dayCountOptions: readonly number[];
  resultCount: number;
  onReset: () => void;
  onApply: () => void;
  onClose: () => void;
};

export function TemplateFiltersSheet({
  visible,
  filters,
  onChangeFilters,
  dayCountOptions,
  resultCount,
  onReset,
  onApply,
  onClose,
}: TemplateFiltersSheetProps) {
  return (
    <FilterSheet
      visible={visible}
      onClose={onClose}
      onReset={onReset}
      applyLabel={templateApplyLabel(resultCount)}
      applyDisabled={resultCount === 0}
      onApply={onApply}
    >
      <FilterSection title="Days a week">
        <View style={styles.optionRows}>
          {optionRows(dayCountOptions, DAY_OPTIONS_PER_ROW).map((row) => (
            <View key={row.join()} style={styles.optionRow}>
              {row.map((dayCount) => (
                <FilterOption
                  key={dayCount}
                  label={templateDayCountLabel(dayCount)}
                  selected={filters.dayCounts?.includes(dayCount) ?? false}
                  onPress={() => onChangeFilters(toggleDayCount(filters, dayCount))}
                />
              ))}
            </View>
          ))}
        </View>
      </FilterSection>

      <FilterSection title="Focus">
        <View style={styles.optionRows}>
          {optionRows(FOCUS_TAGS, FOCUS_OPTIONS_PER_ROW).map((row) => (
            <View key={row.join()} style={styles.optionRow}>
              {row.map((tag) => (
                <FilterOption
                  key={tag}
                  label={templateTagLabel(tag)}
                  selected={filters.tags?.includes(tag) ?? false}
                  onPress={() => onChangeFilters(toggleTag(filters, tag))}
                />
              ))}
            </View>
          ))}
        </View>
      </FilterSection>

      <FilterSection>
        <Toggle
          label="Hybrid only"
          description="Hybrid mixes strength with power, boxing or movement work"
          value={isHybridOnly(filters)}
          onValueChange={(value) => onChangeFilters(setHybridOnly(filters, value))}
        />
      </FilterSection>
    </FilterSheet>
  );
}
