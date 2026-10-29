// The Exercise screen — 08.6 · Библиотека упражнений, "Exercise — вкладка Overview" (task 065),
// laid out after the canvas "Hybro · Hybrid exercises (10.1)", frames 4.5–4.9 (GT-195). A pushed
// screen: back and `⋯` in the header, then the exercise's name with its chips — the muscle group in
// the group's own tint, the type for anything but strength, the equipment when it has one — and a
// `Catalog`/`Custom` badge, then the Overview / History switcher.
//
// What Overview holds depends on the exercise's type, and this file doesn't decide it:
// `overviewSections` (ExerciseOverviewLayout.ts) hands it a list, and the screen draws each entry.
// Whatever the type, the tiles come first — or, with nothing ever logged, a framed line saying so
// in their place — then `How to perform`, which hands over to a YouTube Shorts search (task 153),
// then what the type adds: power's `Settings`, how it is set up in the library (GT-196).
// Sessions themselves are on the History tab only (ExerciseHistoryTab, task 108): Overview used to
// repeat the last one, and dropped it (GT-195).
//
// The switcher is the only way into History (08.6: "Единственная точка входа — переключатель
// Overview / History на самом экране Exercise"), and Overview always opens first, from wherever
// the screen was entered. So the tab is this component's own state rather than a prop: the screen
// deliberately doesn't remember it ("Экран не запоминает, на какой вкладке был в прошлый раз"),
// and leaving and re-entering remounts it back on Overview. `onTabChange` only reports the switch
// outward, so the route can start loading the history the first time it's actually asked for —
// the tab still belongs to this component.
//
// Presentational otherwise: the overview model and what back, `⋯` and the how-to link do come in as props from
// app/exercise/[id]/index.tsx. JSX/rendering only — styles live in ExerciseDetailScreenStyles.ts
// and pure helpers in ExerciseDetailScreenLogic.ts, per the code-style skill.

import { useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Exercise, MuscleGroup } from '@domain/catalog';
import { exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import type { ExerciseHistoryMesocycle } from '@domain/exerciseHistory';
import type { ExerciseOverview, ExerciseOverviewStats } from '@domain/exerciseOverview';
import { Badge } from '@design/components/Badge';
import { EmptyState } from '@design/components/EmptyState';
import { ActionMenu, type ActionMenuItem } from '@design/components/ActionMenu';
import { IconButton } from '@design/components/IconButton';
import { SegmentedControl } from '@design/components/SegmentedControl';
import { StatTile } from '@design/components/StatTile';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { getExerciseTypeIcon } from '@design/exerciseTypeIcon';
import { getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import { BackIcon } from '@design/icons/BackIcon';
import { InfoIcon } from '@design/icons/InfoIcon';
import { getMuscleGroupChipColors } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import { COLORS, ICON_SIZES } from '@design/tokens';
import type { LoadError } from '@state/loadError';

import { LoadErrorState } from './LoadErrorState';
import {
  ExerciseDetailCard,
  ExerciseDetailCardRow,
  ExerciseDetailSection,
} from './ExerciseDetailCard';
import {
  EXERCISE_DETAIL_TABS,
  exerciseSettings,
  formatBestSet,
  formatLastDone,
  powerLoadOf,
  type ExerciseDetailTab,
} from './ExerciseDetailScreenLogic';
import { styles } from './ExerciseDetailScreenStyles';
import { ExerciseDetailEmpty } from './ExerciseDetailEmpty';
import { ExerciseHistoryTab } from './ExerciseHistoryTab';
import { sourceLabel } from './ExerciseLibraryScreenLogic';
import {
  emptyTitleOf,
  overviewSections,
  type OverviewSection,
  type OverviewTile,
} from './ExerciseOverviewLayout';

export type ExerciseDetailScreenProps = {
  /** `undefined` while it loads, `null` when no such exercise exists. */
  overview: ExerciseOverview | undefined | null;
  isPending: boolean;
  /** Set when reading the exercise failed — shown instead of “not found”, which would be untrue. */
  loadError?: LoadError;
  /** The History tab's list — `undefined` until the caller starts loading it. */
  history: ExerciseHistoryMesocycle[] | undefined;
  isHistoryPending: boolean;
  onBack: () => void;
  /** Opens the `⋯` menu (08.6, "Меню и действия"). */
  /**
   * What the screen's `⋯` offers (08.6, "Меню и действия"). The menu opens out of the button
   * itself (117), so the screen holds the actions rather than an `onOpenMenu` that raised a sheet.
   */
  menuItems: ActionMenuItem[];
  /** The tab was switched — the caller loads the history the first time it's History. */
  onTabChange?: (tab: ExerciseDetailTab) => void;
  /** `Watch how to perform exercise` was pressed — the caller opens the search (task 153). */
  onWatchHowTo: () => void;
};

export function ExerciseDetailScreen({
  overview,
  isPending,
  loadError,
  history,
  isHistoryPending,
  onBack,
  menuItems,
  onTabChange,
  onWatchHowTo,
}: ExerciseDetailScreenProps) {
  const [tab, setTab] = useState<ExerciseDetailTab>('overview');

  function openTab(next: ExerciseDetailTab) {
    setTab(next);
    onTabChange?.(next);
  }

  if (isPending || !overview) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <IconButton accessibilityLabel="Back" onPress={onBack}>
            <BackIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
          </IconButton>
        </View>
        {isPending ? (
          <Text style={styles.status}>Loading…</Text>
        ) : loadError ? (
          <LoadErrorState loadError={loadError} />
        ) : (
          <EmptyState
            icon={InfoIcon}
            title="Exercise not found"
            description="It isn't in the library any more."
            actionLabel="Go back"
            onAction={onBack}
          />
        )}
      </SafeAreaView>
    );
  }

  const { exercise, stats } = overview;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Back" onPress={onBack}>
          <BackIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
        </IconButton>
        <ActionMenu accessibilityLabel="Exercise menu" title={exercise.name} items={menuItems} />
      </View>

      <View style={styles.heading}>
        <Text style={styles.title}>{exercise.name}</Text>
        <HeadingChips exercise={exercise} />
      </View>

      <SegmentedControl
        options={EXERCISE_DETAIL_TABS}
        value={tab}
        onChange={(value) => openTab(value as ExerciseDetailTab)}
      />

      {tab === 'overview' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {overviewSections(exercise, stats).map((section) => (
            <OverviewSectionView
              key={section.kind}
              section={section}
              exercise={exercise}
              stats={stats}
              onWatchHowTo={onWatchHowTo}
            />
          ))}
        </ScrollView>
      ) : stats === null ? (
        // Nothing ever logged, no set and no round: there is no history to show either (08.6,
        // "Пустое состояние").
        <ExerciseDetailEmpty
          title={emptyTitleOf(exercise)}
          description="Your first workout with this exercise fills this in."
        />
      ) : (
        <ExerciseHistoryTab
          groups={history}
          isPending={isHistoryPending}
          equipment={exercise.equipment}
          powerLoad={powerLoadOf(exercise)}
        />
      )}
    </SafeAreaView>
  );
}

/**
 * Under the name: the muscle group, then the type (strength has none — it is the default), then the
 * equipment when the exercise has one, then where it comes from (canvas 4.5–4.9).
 */
function HeadingChips({ exercise }: { exercise: Exercise }) {
  const type = exerciseTypeOf(exercise);

  return (
    <View style={styles.headingMeta}>
      <GroupChip muscleGroup={exercise.muscleGroup} />
      {type !== 'strength' && (
        <OutlinedChip
          label={getExerciseTypeLabel(type)}
          icon={getExerciseTypeIcon(type)({
            size: ICON_SIZES['icon/chip'],
            color: COLORS['text/secondary'],
          })}
        />
      )}
      {exercise.equipment !== undefined && (
        <OutlinedChip label={getEquipmentLabel(exercise.equipment)} />
      )}
      <Badge label={sourceLabel(exercise.source)} />
    </View>
  );
}

/** The type and the equipment: the group chip's box, outlined rather than tinted (canvas 4.5–4.9). */
function OutlinedChip({ label, icon }: { label: string; icon?: ReactNode }) {
  return (
    <View style={[styles.groupChip, styles.outlinedChip]}>
      {icon}
      <Text style={[styles.groupLabel, styles.outlinedLabel]}>{label}</Text>
    </View>
  );
}

function OverviewSectionView({
  section,
  exercise,
  stats,
  onWatchHowTo,
}: {
  section: OverviewSection;
  exercise: Exercise;
  stats: ExerciseOverviewStats | null;
  onWatchHowTo: () => void;
}) {
  switch (section.kind) {
    case 'tiles':
      return stats === null ? null : <OverviewTiles tiles={section.tiles} stats={stats} />;
    case 'empty':
      return (
        <ExerciseDetailEmpty
          title={section.title}
          description="Highlights show up after your first workout."
        />
      );
    case 'howTo':
      return (
        <ExerciseDetailSection label="How to perform">
          <WatchHowToCard onPress={onWatchHowTo} />
        </ExerciseDetailSection>
      );
    case 'settings':
      return <SettingsCard exercise={exercise} />;
  }
}

/**
 * How the exercise is set up in the library, read-only. `Used in new cycles`: these are the values a
 * new cycle starts from — a running cycle keeps its own copy (10.1 FR-8, FR-9). A timed work's
 * lever says under the card what it does next week (canvas 4.8).
 */
function SettingsCard({ exercise }: { exercise: Exercise }) {
  const { rows, note } = exerciseSettings(exercise);

  return (
    <ExerciseDetailCard
      testID="exercise-settings"
      label="Settings"
      meta="Used in new cycles"
      footnote={note}
    >
      {rows.map((row, index) => (
        <ExerciseDetailCardRow
          key={row.key}
          label={row.label}
          value={row.value}
          isLast={index === rows.length - 1}
        />
      ))}
    </ExerciseDetailCard>
  );
}

function OverviewTiles({
  tiles,
  stats,
}: {
  tiles: readonly OverviewTile[];
  stats: ExerciseOverviewStats;
}) {
  return (
    <View style={styles.tiles}>
      {tiles.map((tile) => {
        switch (tile) {
          case 'bestSet':
            // `null` only without a logged set — never for a type whose layout lists the tile.
            return stats.bestSet === null ? null : (
              <StatTile key={tile} label="Best set" value={formatBestSet(stats.bestSet)} />
            );
          case 'sessions':
            return <StatTile key={tile} label="Sessions" value={String(stats.sessionCount)} />;
          case 'lastDone':
            return (
              <StatTile key={tile} label="Last done" value={formatLastDone(stats.lastDoneAt)} />
            );
        }
      })}
    </View>
  );
}

function GroupChip({ muscleGroup }: { muscleGroup: MuscleGroup }) {
  const colors = getMuscleGroupChipColors(muscleGroup);

  return (
    <View
      testID="exercise-group-chip"
      style={[styles.groupChip, { backgroundColor: colors.tint ?? COLORS['surface/card'] }]}
    >
      {colors.dot !== undefined && (
        <View style={[styles.groupDot, { backgroundColor: colors.dot }]} />
      )}
      <Text style={[styles.groupLabel, { color: colors.text ?? COLORS['text/secondary'] }]}>
        {getMuscleGroupLabel(muscleGroup)}
      </Text>
    </View>
  );
}

// YouTube's own red icon, as downloaded from brand.youtube — unmodified, since the brand rules
// allow only its red, almost-black or white and ask for it to link back to YouTube content, which
// this card does. Sized by SIZES['size/brand-mark'] so the mark stays above their 20pt minimum.
const YOUTUBE_ICON = require('../assets/brand/yt_icon_red_digital.png');

/**
 * Technique lives on YouTube, not in the app. A card in the look of the blocks above it — the
 * YouTube mark on the left, what it does and where it goes under it, a chevron — so it reads as
 * one more thing on the screen rather than a stray link.
 */
function WatchHowToCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.howTo, pressed && styles.linkPressed]}
    >
      <Image source={YOUTUBE_ICON} resizeMode="contain" style={styles.howToMark} />
      <View style={styles.howToText}>
        <Text style={styles.howToTitle}>Watch how to perform exercise</Text>
        <Text style={styles.howToCaption}>YouTube Shorts</Text>
      </View>
      <Text style={styles.howToChevron}>›</Text>
    </Pressable>
  );
}
