// The Exercise screen's History tab — 06 · History & Analytics, Сценарий 2 (task 108). Every
// completed session with this exercise, newest first, as the same labelled card the Overview tab's
// `Last session` block uses: `Week 3 · Day 1` with its date, then a row per logged set.
//
// Sections are mesocycles, sticky-headed with the mesocycle's name and how many of its sessions
// are listed. The list is continuous across them — a mesocycle boundary doesn't restart it (06:
// "Сквозная через все мезоциклы. Граница мезоцикла не обрывает историю"); the sections only say
// which block a session belonged to. A session still in progress isn't here: this is the record of
// what was already done, the same rule the Overview blocks follow.
//
// Virtualized (SectionList), unlike the Overview tab's ScrollView: Overview shows three sessions
// at most, this one grows with every block trained.
//
// No progress chart. 06 names one as the second view of this scenario, but the 1RM formula behind
// it is still an open question there and picking one here would be a guess — task 108 leaves it
// out until that decision is made.
//
// Presentational: the grouped history comes in as a prop from app/exercise/[id]/index.tsx.
// JSX/rendering only — styles live in ExerciseHistoryTabStyles.ts and pure helpers in
// ExerciseHistoryTabLogic.ts, per the code-style skill.

import { SectionList, Text, View } from 'react-native';

import type { Equipment } from '@domain/catalog';
import type { ExerciseHistoryMesocycle, ExerciseHistorySession } from '@domain/exerciseHistory';
import { SectionHeader } from '@design/components/SectionHeader';

import { ExerciseDetailCard, ExerciseDetailCardRow } from './ExerciseDetailCard';
import {
  formatSetLabel,
  formatSetRirTail,
  formatSetValue,
} from './ExerciseDetailScreenLogic';
import {
  buildHistorySections,
  formatHistorySessionDate,
  formatHistorySessionLabel,
  type ExerciseHistorySection,
} from './ExerciseHistoryTabLogic';
import { styles } from './ExerciseHistoryTabStyles';

export type ExerciseHistoryTabProps = {
  /** `undefined` while it loads. */
  groups: ExerciseHistoryMesocycle[] | undefined;
  isPending: boolean;
  /** The exercise's equipment — a `bodyweight-weighted` set reads back split (task 105). */
  equipment?: Equipment;
};

export function ExerciseHistoryTab({ groups, isPending, equipment }: ExerciseHistoryTabProps) {
  if (isPending || groups === undefined) {
    return <Text style={styles.status}>Loading…</Text>;
  }

  return (
    <SectionList<ExerciseHistorySession, ExerciseHistorySection>
      style={styles.list}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      sections={buildHistorySections(groups)}
      keyExtractor={(session) => session.id}
      stickySectionHeadersEnabled
      renderSectionHeader={({ section }) => (
        <View style={styles.headerBleed}>
          <SectionHeader title={section.title} count={section.data.length} />
        </View>
      )}
      renderItem={({ item }) => (
        <ExerciseDetailCard
          label={formatHistorySessionLabel(item)}
          meta={formatHistorySessionDate(item)}
        >
          {item.setLogs.map((setLog, index) => (
            <ExerciseDetailCardRow
              key={setLog.id}
              label={formatSetLabel(setLog)}
              labelTone="counter"
              value={formatSetValue(setLog, equipment)}
              tail={formatSetRirTail(setLog)}
              isLast={index === item.setLogs.length - 1}
            />
          ))}
        </ExerciseDetailCard>
      )}
    />
  );
}
