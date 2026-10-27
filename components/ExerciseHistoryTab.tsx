// The Exercise screen's History tab — 06 · History & Analytics, Сценарий 2 (task 108). Every
// completed session with this exercise, newest first, as the same labelled card the Overview tab's
// `Last session` block uses: `Week 3 · Day 1` with its date, then a row per logged set.
//
// Sections are mesocycles, sticky-headed with the mesocycle's name and how many of its sessions
// are listed. The list is continuous across them — a mesocycle boundary doesn't restart it (06:
// "Сквозная через все мезоциклы. Граница мезоцикла не обрывает историю"); the sections only say
// which block a session belonged to. A session still in progress isn't here: this is the record of
// what was already done, the same rule the Overview blocks follow. With nothing finished yet the
// tab says so instead of staying blank.
//
// Every type reads the same list (10.1 FR-12, GT-110): what was done, session by session. A power
// set only reads in its own load — `Level 2 × 3` — and without RIR.
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

import { SectionList, Text } from 'react-native';

import type { Equipment } from '@domain/catalog';
import type { PowerLoad } from '@domain/exerciseConfig';
import type { ExerciseHistoryMesocycle, ExerciseHistorySession } from '@domain/exerciseHistory';
import { listBleed, SectionHeader } from '@design/components/SectionHeader';

import { ExerciseDetailCard, ExerciseDetailCardRow } from './ExerciseDetailCard';
import { ExerciseDetailEmpty } from './ExerciseDetailEmpty';
import { formatSetLabel, formatSetRirTail, formatSetValue } from './ExerciseDetailScreenLogic';
import {
  buildHistorySections,
  formatHistorySessionDate,
  formatHistorySessionLabel,
  type ExerciseHistorySection,
} from './ExerciseHistoryTabLogic';
import { styles } from './ExerciseHistoryTabStyles';

const BLEED = listBleed();

export type ExerciseHistoryTabProps = {
  /** `undefined` while it loads. */
  groups: ExerciseHistoryMesocycle[] | undefined;
  isPending: boolean;
  /** The exercise's equipment — a `bodyweight-weighted` set reads back split (task 105). */
  equipment?: Equipment;
  /** Set for a power exercise: its sets read in its own load, with no RIR (10.1 FR-12, GT-110). */
  powerLoad?: PowerLoad;
};

export function ExerciseHistoryTab({
  groups,
  isPending,
  equipment,
  powerLoad,
}: ExerciseHistoryTabProps) {
  if (isPending || groups === undefined) {
    return <Text style={styles.status}>Loading…</Text>;
  }

  // Sets exist (the Overview tiles count them) but none of their workouts is finished yet: a blank
  // tab under tiles that say `Sessions 1` reads as broken, so say why it's empty.
  if (groups.length === 0) {
    return (
      <ExerciseDetailEmpty
        title="No finished workouts yet"
        description="A workout appears here once you finish it."
      />
    );
  }

  return (
    <SectionList<ExerciseHistorySession, ExerciseHistorySection>
      style={[styles.list, BLEED.style]}
      contentContainerStyle={[styles.content, BLEED.content]}
      showsVerticalScrollIndicator={false}
      sections={buildHistorySections(groups)}
      keyExtractor={(session) => session.id}
      stickySectionHeadersEnabled
      renderSectionHeader={({ section }) => (
        <SectionHeader title={section.title} count={section.data.length} inset="card" />
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
              value={formatSetValue(setLog, equipment, powerLoad)}
              tail={formatSetRirTail(setLog, powerLoad)}
              isLast={index === item.setLogs.length - 1}
            />
          ))}
        </ExerciseDetailCard>
      )}
    />
  );
}
