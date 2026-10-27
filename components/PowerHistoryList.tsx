// A power exercise's History tab — 10.1 FR-12 and canvas 5.2 (GT-110). Not a list of sessions as
// a strength exercise has, but the week as the unit: under each mesocycle's sticky header one card,
// a row per week with that week's best set, newest first. A quieter tail says what happened that
// week — the load went up or down (a heavier ball, a higher box: the variation within one exercise)
// and whether every set reached the top of the corridor, where the card asks for a heavier load.
//
// Sections and their order are the strength list's own (`buildExerciseHistory`), so the two tabs
// read the same across a mesocycle boundary. Presentational: the grouped history and the load come
// in from ExerciseHistoryTab. Styles are that tab's — this is the same list in another shape.

import { SectionList } from 'react-native';

import type { PowerLoad } from '@domain/exerciseConfig';
import type { ExerciseHistoryMesocycle, PowerHistoryWeek } from '@domain/exerciseHistory';
import { listBleed, SectionHeader } from '@design/components/SectionHeader';

import { ExerciseDetailCard, ExerciseDetailCardRow } from './ExerciseDetailCard';
import { styles } from './ExerciseHistoryTabStyles';
import {
  buildPowerHistorySections,
  formatPowerBestSet,
  formatPowerWeekLabel,
  formatPowerWeekTail,
  type PowerHistorySection,
} from './PowerHistoryListLogic';

const BLEED = listBleed();

export type PowerHistoryListProps = {
  groups: ExerciseHistoryMesocycle[];
  load: PowerLoad;
};

export function PowerHistoryList({ groups, load }: PowerHistoryListProps) {
  return (
    <SectionList<PowerHistoryWeek[], PowerHistorySection>
      style={[styles.list, BLEED.style]}
      contentContainerStyle={[styles.content, BLEED.content]}
      showsVerticalScrollIndicator={false}
      sections={buildPowerHistorySections(groups, load)}
      keyExtractor={(weeks) => weeks[0]?.id ?? ''}
      stickySectionHeadersEnabled
      renderSectionHeader={({ section }) => (
        <SectionHeader title={section.title} count={section.weekCount} inset="card" />
      )}
      renderItem={({ item: weeks }) => (
        <ExerciseDetailCard label="Best set each week">
          {weeks.map((week, index) => (
            <ExerciseDetailCardRow
              key={week.id}
              label={formatPowerWeekLabel(week)}
              value={formatPowerBestSet(week, load)}
              tail={formatPowerWeekTail(week, load)}
              isLast={index === weeks.length - 1}
            />
          ))}
        </ExerciseDetailCard>
      )}
    />
  );
}
